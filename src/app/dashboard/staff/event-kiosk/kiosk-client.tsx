"use client";

import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Expand,
  Loader2,
  Minimize,
  ScanFace,
  ShieldAlert,
  UserCircle2,
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
  distance: number;
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
  totalFaces?: number;
  matchedCount?: number;
  livenessPassed?: boolean;
  livenessScore?: number;
  faces?: FaceResult[];
  latestMatch?: FaceResult | null;
};

type VerificationQueueItem = {
  id: string;
  timestamp: string;
  label: string;
  status: FaceStatus;
  confidence?: number;
  attendanceStatus?: "MARKED" | "SKIPPED_DUPLICATE";
};

type CapturedFrame = {
  data: string;
  width: number;
  height: number;
};

type TrackedFace = {
  id: string;
  status: FaceStatus;
  fullName: string | null;
  role: string | null;
  municipality: string | null;
  confidence: number;
  box: { top: number; right: number; bottom: number; left: number };
  target: { top: number; right: number; bottom: number; left: number };
};

const KIOSK_INTERVAL_MS = 350;
const VERIFICATION_FRAME_COUNT = 4;
const VERIFICATION_FRAME_DELAY_MS = 180;
const MAX_CAPTURE_WIDTH = 640;
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const ERROR_RETRY_COOLDOWN_MS = 2_500;

function uniqueEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isBenignPlayInterruption(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const value = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    value.includes("play() request was interrupted") ||
    value.includes("interrupted by a new load request")
  );
}

function captureFrame(video: HTMLVideoElement): CapturedFrame | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const targetWidth = Math.min(MAX_CAPTURE_WIDTH, sourceWidth);
  const scale = targetWidth / sourceWidth;
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, targetWidth, targetHeight);
  return {
    data: canvas.toDataURL("image/jpeg", 0.82),
    width: targetWidth,
    height: targetHeight,
  };
}

function statusColor(status: FaceStatus | "ERROR") {
  if (status === "VERIFIED") return "#22c55e";
  if (status === "LOW_CONFIDENCE") return "#f59e0b";
  return "#ef4444";
}

function statusLabel(status: FaceStatus | "ERROR") {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "LOW_CONFIDENCE":
      return "Low confidence";
    case "OUT_OF_SCOPE":
      return "Out of scope";
    case "LIVENESS_FAILED":
      return "Liveness failed";
    case "UNREGISTERED":
      return "Unregistered";
    default:
      return "Verification error";
  }
}

export default function EventKioskClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const trackedFacesRef = useRef<TrackedFace[]>([]);
  const nextScanAllowedAtRef = useRef(0);
  const startSequenceRef = useRef(0);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [livenessScore, setLivenessScore] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
  const [latestMatch, setLatestMatch] = useState<FaceResult | null>(null);
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);

  const drawDetections = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    const width = video.clientWidth;
    const height = video.clientHeight;
    if (!width || !height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const tracked = trackedFacesRef.current;
    if (!frameSize || tracked.length === 0) {
      return;
    }

    const scaleX = width / frameSize.width;
    const scaleY = height / frameSize.height;

    for (const face of tracked) {
      face.box.top += (face.target.top - face.box.top) * 0.35;
      face.box.right += (face.target.right - face.box.right) * 0.35;
      face.box.bottom += (face.target.bottom - face.box.bottom) * 0.35;
      face.box.left += (face.target.left - face.box.left) * 0.35;

      const { top, right, bottom, left } = face.box;
      const x = left * scaleX;
      const y = top * scaleY;
      const boxWidth = Math.max(1, (right - left) * scaleX);
      const boxHeight = Math.max(1, (bottom - top) * scaleY);
      const color = statusColor(face.status);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      const confidencePct = Math.round((face.confidence ?? 0) * 100);
      const primaryLabel = face.fullName ?? statusLabel(face.status);
      const secondaryLabel = `${face.role ?? "Unknown Role"} | ${face.municipality ?? "Unknown Municipality"}`;
      const tertiaryLabel = `${scanBusy ? "Verifying..." : statusLabel(face.status)} | ${confidencePct}%`;
      const labelWidth = Math.min(360, Math.max(170, primaryLabel.length * 7.4));
      const labelHeight = 54;
      const labelX = Math.max(8, Math.min(width - labelWidth - 8, x));
      const labelY = Math.max(8, y - labelHeight - 8);

      ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 12px Inter, Segoe UI, sans-serif";
      ctx.fillText(primaryLabel.slice(0, 40), labelX + 8, labelY + 16);
      ctx.font = "500 10px Inter, Segoe UI, sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(secondaryLabel.slice(0, 52), labelX + 8, labelY + 30);
      ctx.fillStyle = color;
      ctx.fillText(tertiaryLabel.slice(0, 50), labelX + 8, labelY + 44);
    }
  }, [frameSize, scanBusy]);

  useEffect(() => {
    const render = () => {
      drawDetections();
      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    animationFrameRef.current = window.requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [drawDetections]);

  useEffect(() => {
    const onResize = () => drawDetections();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawDetections]);

  const stopCamera = useCallback(() => {
    startSequenceRef.current += 1;
    if (scanningTimerRef.current) {
      clearInterval(scanningTimerRef.current);
      scanningTimerRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanActive(false);
    setCameraEnabled(false);
    trackedFacesRef.current = [];
    setFrameSize(null);
  }, []);

  const startCamera = useCallback(async () => {
    const sequenceId = ++startSequenceRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (sequenceId !== startSequenceRef.current) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      const video = videoRef.current;
      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (error) {
        if (!isBenignPlayInterruption(error)) {
          throw error;
        }
      }

      setCameraEnabled(true);
      setError(null);
    } catch (cameraError) {
      if (isBenignPlayInterruption(cameraError)) {
        return;
      }
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Unable to access camera for kiosk scanning.",
      );
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const target = sectionRef.current;
    if (!target) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // No-op for unsupported/fullscreen denied environments.
    }
  }, []);

  useEffect(() => {
    const listener = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);

  const runVerification = useCallback(async () => {
    if (!videoRef.current || scanBusy) {
      return;
    }

    if (Date.now() < nextScanAllowedAtRef.current) {
      return;
    }

    setScanBusy(true);
    try {
      const frames: CapturedFrame[] = [];
      for (let index = 0; index < VERIFICATION_FRAME_COUNT; index += 1) {
        const frame = captureFrame(videoRef.current);
        if (frame) {
          frames.push(frame);
        }
        if (index < VERIFICATION_FRAME_COUNT - 1) {
          await new Promise((resolve) => setTimeout(resolve, VERIFICATION_FRAME_DELAY_MS));
        }
      }

      if (frames.length < 2) {
        throw new Error("Insufficient camera frames for liveness check.");
      }

      const primary = frames[frames.length - 1];
      setFrameSize({ width: primary.width, height: primary.height });

      const response = await fetch("/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: primary.data,
          livenessFrames: frames.map((frame) => frame.data),
          eventId: eventId.trim() || undefined,
          autoRecord: true,
        }),
      });

      const payload = (await response.json()) as VerifyResponse;
      if (!response.ok) {
        const failureMessage = payload.error ?? "Verification failed.";

        if (response.status === 429 || failureMessage.toLowerCase().includes("too many")) {
          setError(null);
          nextScanAllowedAtRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          setMessage("Rate limited. Auto scan will retry automatically in about 1 minute.");
        } else {
          setError(failureMessage);
          nextScanAllowedAtRef.current = Date.now() + ERROR_RETRY_COOLDOWN_MS;
          setMessage("Verification error. Auto scan will retry automatically.");
        }
        return;
      }

      const detectedFaces = Array.isArray(payload.faces) ? payload.faces : [];
      nextScanAllowedAtRef.current = 0;
      trackedFacesRef.current = detectedFaces.map((face, index) => {
        const [top, right, bottom, left] = face.box;
        const id = face.userId || `face-${index}`;
        const previous = trackedFacesRef.current.find((item) => item.id === id);
        const target = {
          top: Number(top),
          right: Number(right),
          bottom: Number(bottom),
          left: Number(left),
        };

        return {
          id,
          status: face.status,
          fullName: face.fullName,
          role: face.role,
          municipality: face.municipality,
          confidence: face.confidence,
          box: previous ? { ...previous.box } : { ...target },
          target,
        };
      });
      setMessage(payload.message ?? null);
      setError(null);
      setLivenessScore(typeof payload.livenessScore === "number" ? payload.livenessScore : null);
      setLatestMatch(payload.latestMatch ?? null);

      const queueItems: VerificationQueueItem[] = detectedFaces
        .filter((face) => face.status === "VERIFIED" && face.attendance?.status === "MARKED")
        .map((face) => ({
          id: uniqueEntryId(),
          timestamp: new Date().toLocaleTimeString(),
          label: face.fullName ?? "Verified Official",
          status: face.status,
          confidence: face.confidence,
          attendanceStatus: face.attendance?.status,
        }));
      if (queueItems.length > 0) {
        setQueue((previous) => [...queueItems, ...previous].slice(0, 18));
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
      trackedFacesRef.current = [];
      setMessage(null);
    } finally {
      setScanBusy(false);
    }
  }, [eventId, scanBusy]);

  useEffect(() => {
    if (!scanActive || !cameraEnabled) {
      if (scanningTimerRef.current) {
        clearInterval(scanningTimerRef.current);
        scanningTimerRef.current = null;
      }
      return;
    }

    scanningTimerRef.current = setInterval(() => {
      void runVerification();
    }, KIOSK_INTERVAL_MS);

    return () => {
      if (scanningTimerRef.current) {
        clearInterval(scanningTimerRef.current);
        scanningTimerRef.current = null;
      }
    };
  }, [cameraEnabled, runVerification, scanActive]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const kioskStatus = useMemo(() => {
    if (!cameraEnabled) return "Camera offline";
    if (scanActive && Date.now() < nextScanAllowedAtRef.current) return "Waiting to retry...";
    if (scanBusy) return "Verifying...";
    if (scanActive) return "Auto verification active (~3 FPS)";
    return "Camera ready";
  }, [cameraEnabled, scanActive, scanBusy]);

  return (
    <div ref={sectionRef} className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Event Kiosk
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Government Biometric Attendance Terminal</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Real-time multi-face verification with liveness scoring, confidence overlays, and
          duplicate-safe attendance recording.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md sm:p-5">
          <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-black">
            <video
              ref={videoRef}
              className="aspect-[16/9] w-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 z-10"
            />
            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-semibold text-white z-20">
              {kioskStatus}
            </div>
            {scanBusy ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!cameraEnabled ? (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <Camera className="h-4 w-4" />
                Start Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <ShieldAlert className="h-4 w-4" />
                Stop Camera
              </button>
            )}

            <button
              type="button"
              disabled={!cameraEnabled}
              onClick={() => setScanActive((previous) => !previous)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                scanActive
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-accent text-accent-foreground hover:opacity-90"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <ScanFace className="h-4 w-4" />
              {scanActive ? "Stop Auto Scan" : "Start Auto Scan"}
            </button>

            <button
              type="button"
              disabled={!cameraEnabled || scanBusy}
              onClick={() => void runVerification()}
              className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scanBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Capture Once
            </button>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>

            <input
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              placeholder="Optional Event ID"
              className="min-w-[220px] flex-1 rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>

          {message ? (
            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </article>

        <article className="space-y-4 rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Latest Match
            </p>
            {latestMatch ? (
              <div className="mt-3">
                <p className="text-lg font-semibold text-foreground">
                  {latestMatch.fullName ?? "Unnamed Official"}
                </p>
                <p className="text-sm text-muted">
                  {(latestMatch.role ?? "Unknown Role").replaceAll("_", " ")} |{" "}
                  {latestMatch.municipality ?? "Unassigned"}
                </p>
                <p className="mt-1 text-xs text-emerald-300">
                  Confidence: {Math.round(latestMatch.confidence * 100)}%
                </p>
                {latestMatch.attendance ? (
                  <p className="mt-1 text-xs text-cyan-300">
                    Attendance: {latestMatch.attendance.status}
                  </p>
                ) : null}
                {latestMatch.officialId ? (
                  <Link
                    href={`/id/${latestMatch.officialId}`}
                    target="_blank"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Open Digital ID
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No verified face yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Liveness
            </p>
            <p className="mt-2 text-sm text-foreground">
              {livenessScore !== null ? `${Math.round(livenessScore * 100)}%` : "Not sampled"}
            </p>
          </div>

          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Multi-Face Queue
            </p>
            <div className="mt-3 space-y-2">
              {queue.length === 0 ? (
                <p className="text-sm text-muted">Queue will appear after first scan.</p>
              ) : (
                queue.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{
                      borderColor: `${statusColor(entry.status)}66`,
                      backgroundColor: `${statusColor(entry.status)}1A`,
                      color: statusColor(entry.status),
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{entry.label}</span>
                      <span>{entry.timestamp}</span>
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {statusLabel(entry.status)}
                      {typeof entry.confidence === "number"
                        ? ` • ${Math.round(entry.confidence * 100)}%`
                        : ""}
                      {entry.attendanceStatus ? ` • ${entry.attendanceStatus}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

