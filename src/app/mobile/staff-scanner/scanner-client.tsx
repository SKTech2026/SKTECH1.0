"use client";

import { signOut } from "next-auth/react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ScanFace,
  Smartphone,
  SunMedium,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FaceStatus =
  | "VERIFIED"
  | "LOW_CONFIDENCE"
  | "UNREGISTERED"
  | "OUT_OF_SCOPE"
  | "LIVENESS_FAILED";

type FaceResult = {
  faceIndex: number;
  box: [number, number, number, number] | number[];
  confidence: number;
  status: FaceStatus;
  userId: string | null;
  officialId: string | null;
  fullName: string | null;
  role: string | null;
  municipality: string | null;
  attendance:
    | {
        status: "MARKED" | "SKIPPED_DUPLICATE";
        attendanceId: string | null;
        timestamp: string | null;
      }
    | null;
};

type VerifyResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  livenessScore?: number;
  totalFaces?: number;
  faces?: FaceResult[];
  latestMatch?: FaceResult | null;
};

type QueueItem = {
  id: string;
  label: string;
  municipality: string;
  confidence: number;
  timestamp: string;
};

const SCAN_INTERVAL_MS = 500;
const MAX_CAPTURE_WIDTH = 640;
const INACTIVITY_TIMEOUT_MS = 5 * 60_000;
const QUEUE_DUPLICATE_WINDOW_MS = 30_000;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusColor(status: FaceStatus) {
  if (status === "VERIFIED") return "#22c55e";
  if (status === "LOW_CONFIDENCE") return "#f59e0b";
  return "#ef4444";
}

function captureFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return null;

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const targetWidth = Math.min(MAX_CAPTURE_WIDTH, sourceWidth);
  const scale = targetWidth / sourceWidth;
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  return {
    data: canvas.toDataURL("image/jpeg", 0.82),
    width: targetWidth,
    height: targetHeight,
  };
}

function isSupportedTorch(track: MediaStreamTrack | null) {
  if (!track) return false;
  const capabilities = (track as MediaStreamTrack & { getCapabilities?: () => MediaTrackCapabilities })
    .getCapabilities?.();
  return Boolean(capabilities && "torch" in capabilities);
}

export default function MobileStaffScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanAtRef = useRef(0);
  const busyRef = useRef(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentVerifiedRef = useRef<Record<string, number>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const unmountedRef = useRef(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scanActive, setScanActive] = useState(true);
  const [scanBusy, setScanBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
  const [faces, setFaces] = useState<FaceResult[]>([]);
  const [latestMatch, setLatestMatch] = useState<FaceResult | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [livenessScore, setLivenessScore] = useState<number | null>(null);

  const playSuccessTone = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 780;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const now = context.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      oscillator.start(now);
      oscillator.stop(now + 0.22);
    } catch {
      // Ignore audio errors on restricted devices.
    }
  }, []);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.clientWidth;
    const height = video.clientHeight;
    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!frameSize || faces.length === 0) return;

    const scaleX = width / frameSize.width;
    const scaleY = height / frameSize.height;

    for (const face of faces) {
      const [top, right, bottom, left] = face.box;
      const x = left * scaleX;
      const y = top * scaleY;
      const boxWidth = (right - left) * scaleX;
      const boxHeight = (bottom - top) * scaleY;
      const color = statusColor(face.status);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      const label = face.fullName ?? "Unregistered";
      const subtitle = `${Math.round(face.confidence * 100)}% - ${face.role ?? "Unknown"}`;
      const labelWidth = Math.min(280, Math.max(140, label.length * 7));
      const labelX = Math.max(8, Math.min(width - labelWidth - 8, x));
      const labelY = Math.max(8, y - 42);

      ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
      ctx.fillRect(labelX, labelY, labelWidth, 34);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, 34);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 11px Inter, Segoe UI, sans-serif";
      ctx.fillText(label.slice(0, 34), labelX + 6, labelY + 13);
      ctx.fillStyle = color;
      ctx.font = "500 10px Inter, Segoe UI, sans-serif";
      ctx.fillText(subtitle.slice(0, 38), labelX + 6, labelY + 26);
    }
  }, [faces, frameSize]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
    setTorchOn(false);
    setTorchSupported(false);
    setFaces([]);
    setFrameSize(null);
  }, []);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    try {
      setError(null);
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (unmountedRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const track = stream.getVideoTracks()[0] ?? null;
      setTorchSupported(isSupportedTorch(track));
      setCameraEnabled(true);
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : "Unable to access camera.");
    }
  }, [stopCamera]);

  const setTorch = useCallback(async (enabled: boolean) => {
    const track = streamRef.current?.getVideoTracks()?.[0] ?? null;
    if (!track || !isSupportedTorch(track)) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: enabled } as MediaTrackConstraintSet],
      });
      setTorchOn(enabled);
    } catch {
      setError("Flashlight is not supported on this device.");
    }
  }, []);

  const runVerification = useCallback(async () => {
    const video = videoRef.current;
    if (!video || busyRef.current || !cameraEnabled) return;

    const frame = captureFrame(video);
    if (!frame) return;

    busyRef.current = true;
    setScanBusy(true);
    setFrameSize({ width: frame.width, height: frame.height });

    try {
      const response = await fetch("/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: frame.data,
          livenessFrames: [frame.data],
          eventId: eventId.trim() || undefined,
          autoRecord: true,
        }),
      });

      const payload = (await response.json()) as VerifyResponse;
      if (!response.ok) {
        setError(payload.error ?? "Verification failed.");
        return;
      }

      const nextFaces = Array.isArray(payload.faces) ? payload.faces : [];
      setFaces(nextFaces);
      setLatestMatch(payload.latestMatch ?? null);
      setLivenessScore(typeof payload.livenessScore === "number" ? payload.livenessScore : null);
      setMessage(payload.message ?? null);
      setError(null);

      const now = Date.now();
      const markedFaces = nextFaces.filter(
        (face) =>
          face.status === "VERIFIED" &&
          face.attendance?.status === "MARKED" &&
          face.officialId &&
          face.confidence >= 0.7,
      );

      if (markedFaces.length > 0) {
        const freshQueueItems: QueueItem[] = [];
        for (const face of markedFaces) {
          const officialId = face.officialId as string;
          const prev = recentVerifiedRef.current[officialId] ?? 0;
          if (now - prev < QUEUE_DUPLICATE_WINDOW_MS) continue;

          recentVerifiedRef.current[officialId] = now;
          freshQueueItems.push({
            id: createId(),
            label: face.fullName ?? "Verified Official",
            municipality: face.municipality ?? "Unknown",
            confidence: face.confidence,
            timestamp: new Date().toLocaleTimeString(),
          });
        }

        if (freshQueueItems.length > 0) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(120);
          }
          playSuccessTone();
          setQueue((prev) => [...freshQueueItems, ...prev].slice(0, 16));
        }
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification request failed.");
    } finally {
      busyRef.current = false;
      setScanBusy(false);
    }
  }, [cameraEnabled, eventId, playSuccessTone]);

  useEffect(() => {
    if (!scanActive || !cameraEnabled) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (!cameraEnabled || !scanActive) return;
      if (timestamp - lastScanAtRef.current >= SCAN_INTERVAL_MS) {
        lastScanAtRef.current = timestamp;
        void runVerification();
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraEnabled, runVerification, scanActive]);

  const handleSwitchCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (cameraEnabled) {
      void startCamera(next);
    }
  }, [cameraEnabled, facingMode, startCamera]);

  useEffect(() => {
    void fetch("/api/mobile/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MOBILE_STAFF_SCANNER_OPENED" }),
    }).catch(() => {
      // Non-blocking audit call.
    });
  }, []);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        void fetch("/api/mobile/session-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MOBILE_STAFF_AUTO_LOGOUT_IDLE" }),
        }).catch(() => {
          // Ignore audit failure.
        });
        void signOut({ callbackUrl: "/login?role=STAFF&error=inactive_timeout" });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "mousemove", "keydown"];
    for (const eventName of events) {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    }
    resetInactivityTimer();

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, resetInactivityTimer);
      }
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setScanActive(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    void startCamera(facingMode);
    return () => {
      unmountedRef.current = true;
      stopCamera();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
      void fetch("/api/mobile/session-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MOBILE_STAFF_SCANNER_CLOSED" }),
        keepalive: true,
      }).catch(() => {
        // Non-blocking teardown audit.
      });
    };
  }, [facingMode, startCamera, stopCamera]);

  const scannerStatus = useMemo(() => {
    if (!cameraEnabled) return "Camera offline";
    if (scanBusy) return "Analyzing frame...";
    if (scanActive) return "Auto scan active (2 FPS)";
    return "Scan paused";
  }, [cameraEnabled, scanActive, scanBusy]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4 shadow-[0_24px_60px_-34px_rgba(34,211,238,0.55)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Portable Staff Scanner</p>
        <h1 className="mt-1 text-xl font-bold text-slate-100">Biometric Attendance Kiosk</h1>
        <p className="mt-1 text-xs text-slate-300">
          Live multi-face verification with automatic attendance recording.
        </p>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3 shadow-xl">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-black">
          <video ref={videoRef} className="aspect-[9/16] w-full object-cover" autoPlay muted playsInline />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" />
          <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
            {scannerStatus}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void (cameraEnabled ? stopCamera() : startCamera(facingMode))}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-800/80 text-sm font-semibold text-slate-100"
          >
            {cameraEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {cameraEnabled ? "Stop Camera" : "Start Camera"}
          </button>
          <button
            type="button"
            disabled={!cameraEnabled}
            onClick={() => setScanActive((prev) => !prev)}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold ${
              scanActive ? "bg-rose-600 text-white" : "bg-cyan-500 text-slate-950"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ScanFace className="h-4 w-4" />
            {scanActive ? "Stop Scan" : "Start Scan"}
          </button>
          <button
            type="button"
            disabled={!cameraEnabled}
            onClick={handleSwitchCamera}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-800/80 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Switch Cam
          </button>
          <button
            type="button"
            disabled={!cameraEnabled || !torchSupported}
            onClick={() => void setTorch(!torchOn)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-800/80 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SunMedium className="h-4 w-4" />
            {torchOn ? "Flash Off" : "Flash On"}
          </button>
        </div>

        <div className="mt-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Event ID (optional)
          </label>
          <input
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            placeholder="e.g. SPORTS-FEST-2026"
            className="h-11 w-full rounded-xl border border-white/20 bg-slate-800/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
          />
        </div>

        {message ? (
          <div className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Latest Match</p>
          {latestMatch ? (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-semibold text-slate-100">{latestMatch.fullName ?? "Unnamed"}</p>
              <p className="text-xs text-slate-300">
                {(latestMatch.role ?? "Unknown role").replaceAll("_", " ")}
              </p>
              <p className="text-xs text-emerald-300">{Math.round(latestMatch.confidence * 100)}% confidence</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Waiting for verified scan.</p>
          )}
        </article>
        <article className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Liveness</p>
          <p className="mt-2 text-lg font-bold text-slate-100">
            {livenessScore !== null ? `${Math.round(livenessScore * 100)}%` : "--"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Real-time anti-spoof checkpoint.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Verified Queue</p>
          <span className="inline-flex items-center gap-1 text-xs text-slate-300">
            <Users className="h-3.5 w-3.5" />
            {queue.length}
          </span>
        </div>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {queue.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-slate-400">
              No verified attendance yet.
            </p>
          ) : (
            queue.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-emerald-200">{entry.label}</p>
                  <p className="text-[11px] text-emerald-300">{entry.timestamp}</p>
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-300/90">
                  {entry.municipality} - {Math.round(entry.confidence * 100)}%
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Attendance marked
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">Terminal Notes</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-300">
          <li className="inline-flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            Scanner runs continuously until you stop it.
          </li>
          <li className="inline-flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-cyan-300" />
            New matches vibrate and play a success tone.
          </li>
          <li className="inline-flex items-center gap-1">
            {scanBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" /> : <ScanFace className="h-3.5 w-3.5 text-cyan-300" />}
            2 FPS verification loop with mobile-safe processing.
          </li>
        </ul>
      </section>
    </div>
  );
}
