"use client";

import { Camera, CheckCircle2, ShieldCheck, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RegisterResult = {
  success?: boolean;
  message?: string;
  detectedFaces?: number;
  livenessPassed?: boolean;
  error?: string;
};

function isBenignPlayInterruption(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    message.includes("play() request was interrupted") ||
    message.includes("interrupted by a new load request")
  );
}

function describeMediaError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to access camera. Check browser permission.";
  }

  const message = error.message.toLowerCase();
  if (error.name === "NotAllowedError" || message.includes("permission")) {
    return "Camera permission was denied. Allow camera access in your browser settings.";
  }

  if (
    error.name === "NotReadableError" ||
    error.name === "TrackStartError" ||
    message.includes("could not start video source")
  ) {
    return "Camera is busy or blocked by another app/tab. Close other camera apps and try again.";
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "No camera device was found. Connect a camera and try again.";
  }

  if (error.name === "OverconstrainedError") {
    return "Requested camera settings are not supported. Retrying with compatible settings may help.";
  }

  return error.message || "Unable to access camera. Check browser permission.";
}

async function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 2000): Promise<void> {
  if (video.readyState >= 1) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onLoadedMetadata = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Video metadata failed to load."));
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function frameFromVideo(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function FacialRegistrationClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startSequenceRef = useRef(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [livenessState, setLivenessState] = useState<"idle" | "capturing" | "passed" | "failed">(
    "idle",
  );
  const [result, setResult] = useState<RegisterResult | null>(null);

  const isLivenessError = useCallback((message: string) => {
    const value = message.toLowerCase();
    return value.includes("liveness") || value.includes("blink") || value.includes("head movement");
  }, []);

  const startCamera = useCallback(async () => {
    const sequenceId = ++startSequenceRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not available in this browser.");
      }

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }

      const video = videoRef.current;
      if (video) {
        video.pause();
        video.srcObject = null;
      }

      const constraintsList: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 540 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: "user",
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError ?? new Error("Unable to access camera.");
      }

      if (sequenceId !== startSequenceRef.current) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await waitForVideoReady(video);

      try {
        await video.play();
      } catch (error) {
        const hasLiveTrack = stream.getVideoTracks().some((track) => track.readyState === "live");
        if (!isBenignPlayInterruption(error) && !hasLiveTrack) {
          throw error;
        }
      }

      setCameraEnabled(true);
      setResult((previous) => (previous?.error ? null : previous));
    } catch (error) {
      if (isBenignPlayInterruption(error)) {
        return;
      }
      setResult({
        error: describeMediaError(error),
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    startSequenceRef.current += 1;
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureAndRegister = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    setBusy(true);
    setResult(null);
    setLivenessState("capturing");

    try {
      const frames: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        const frame = frameFromVideo(videoRef.current);
        if (frame) {
          frames.push(frame);
        }
        await new Promise((resolve) => setTimeout(resolve, 220));
      }

      if (frames.length < 2) {
        throw new Error("Unable to capture enough frames for liveness.");
      }

      const primaryImage = frames[frames.length - 1];
      const response = await fetch("/api/face/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: primaryImage,
          livenessFrames: frames,
        }),
      });

      const payload = (await response.json()) as RegisterResult;
      if (!response.ok) {
        throw new Error(payload.error ?? "Face registration failed.");
      }

      setResult(payload);
      setLivenessState("passed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Face registration failed.";
      setResult({
        error: message,
      });
      setLivenessState(isLivenessError(message) ? "failed" : "idle");
    } finally {
      setBusy(false);
    }
  }, [isLivenessError]);

  const livenessLabel = useMemo(() => {
    if (livenessState === "capturing") return "Validating liveness...";
    if (livenessState === "passed") return "Liveness check passed";
    if (livenessState === "failed") return "Liveness validation failed";
    return "Awaiting capture";
  }, [livenessState]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Biometric Enrollment
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Facial Registration</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Capture your face with consent to generate an encrypted biometric embedding for
          attendance verification.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-black/70">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              muted
              autoPlay
              playsInline
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[58%] w-[44%] rounded-[28px] border-2 border-cyan-300/70 shadow-[0_0_30px_rgba(56,189,248,0.3)]" />
            </div>
            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white/90">
              Live Camera
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {cameraEnabled ? (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <VideoOff className="h-4 w-4" />
                Disable Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <Video className="h-4 w-4" />
                Enable Camera
              </button>
            )}

            <button
              type="button"
              disabled={!cameraEnabled || !consentChecked || busy}
              onClick={() => void captureAndRegister()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {busy ? "Capturing..." : "Capture & Register"}
            </button>
          </div>
        </article>

        <article className="space-y-4 rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <label className="flex items-start gap-3 rounded-xl border border-glass-border bg-surface-elevated/60 p-3">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-500"
            />
            <span className="text-sm text-foreground">
              I consent to biometric processing for attendance verification. Raw images are not
              stored and only encrypted embeddings are kept.
            </span>
          </label>

          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Liveness Indicator
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${
                livenessState === "passed"
                  ? "text-emerald-300"
                  : livenessState === "failed"
                    ? "text-rose-300"
                    : "text-foreground"
              }`}
            >
              {livenessLabel}
            </p>
          </div>

          {result?.success ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Enrollment Complete
              </div>
              <p className="text-sm">{result.message}</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Detected Faces: {result.detectedFaces ?? 0}
              </p>
            </div>
          ) : null}

          {result?.error ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {result.error}
            </div>
          ) : null}

          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4 text-xs text-muted">
            <div className="mb-2 inline-flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Security Notes
            </div>
            <ul className="space-y-1">
              <li>Embedding is encrypted before storage.</li>
              <li>Verification enforces liveness and failed-attempt limits.</li>
              <li>Camera data is processed in-memory only.</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
