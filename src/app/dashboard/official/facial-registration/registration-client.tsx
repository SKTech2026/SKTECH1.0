"use client";

import {
  Camera,
  CheckCircle2,
  CircleAlert,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RegisterResult = {
  success?: boolean;
  message?: string;
  detectedFaces?: number;
  livenessPassed?: boolean;
  error?: string;
};

type EnrollmentStage = {
  id: string;
  title: string;
  instruction: string;
  helper: string;
};

type FrameQuality = {
  dataUrl: string;
  brightness: number;
  sharpness: number;
};

const FRAMES_PER_STAGE = 3;
const CAPTURE_DELAY_MS = 260;
const MAX_FRAME_WIDTH = 480;
const MIN_BRIGHTNESS = 35;
const MAX_BRIGHTNESS = 225;
const MIN_SHARPNESS = 6;

const ENROLLMENT_STAGES: EnrollmentStage[] = [
  {
    id: "straight",
    title: "Center face",
    instruction: "Look straight ahead",
    helper: "Position your face inside the frame and hold still.",
  },
  {
    id: "left",
    title: "Left angle",
    instruction: "Slowly turn your head to the left",
    helper: "Use a small natural turn. Keep your eyes near the camera.",
  },
  {
    id: "right",
    title: "Right angle",
    instruction: "Slowly turn your head to the right",
    helper: "Use a small natural turn. Keep your face inside the guide.",
  },
  {
    id: "up",
    title: "Slightly up",
    instruction: "Raise your face slightly",
    helper: "Tilt up gently, without leaving the oval guide.",
  },
  {
    id: "down",
    title: "Slightly down",
    instruction: "Lower your face slightly",
    helper: "Tilt down gently and keep the camera steady.",
  },
  {
    id: "live",
    title: "Liveness",
    instruction: "Natural frontal/liveness frames",
    helper: "Look forward, blink naturally, and hold still.",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function getFrameQuality(video: HTMLVideoElement): FrameQuality | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  let brightnessTotal = 0;
  let sharpnessTotal = 0;
  let sharpnessSamples = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    brightnessTotal += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
  }

  for (let y = 1; y < height; y += 4) {
    for (let x = 1; x < width; x += 4) {
      const index = (y * width + x) * 4;
      const leftIndex = (y * width + (x - 1)) * 4;
      const topIndex = ((y - 1) * width + x) * 4;
      const current = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      const left = (pixels[leftIndex] + pixels[leftIndex + 1] + pixels[leftIndex + 2]) / 3;
      const top = (pixels[topIndex] + pixels[topIndex + 1] + pixels[topIndex + 2]) / 3;
      sharpnessTotal += Math.abs(current - left) + Math.abs(current - top);
      sharpnessSamples += 2;
    }
  }

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.72),
    brightness: brightnessTotal / Math.max(1, pixels.length / 4),
    sharpness: sharpnessTotal / Math.max(1, sharpnessSamples),
  };
}

function getQualityMessage(frame: FrameQuality | null): string | null {
  if (!frame) {
    return "Camera is not ready yet.";
  }

  if (frame.brightness < MIN_BRIGHTNESS) {
    return "Improve lighting";
  }

  if (frame.brightness > MAX_BRIGHTNESS) {
    return "Reduce glare";
  }

  if (frame.sharpness < MIN_SHARPNESS) {
    return "Hold still";
  }

  return null;
}

export default function FacialRegistrationClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startSequenceRef = useRef(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [acceptedFrameCount, setAcceptedFrameCount] = useState(0);
  const [qualityFeedback, setQualityFeedback] = useState("Position your face inside the frame");
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [livenessState, setLivenessState] = useState<"idle" | "capturing" | "passed" | "failed">(
    "idle",
  );
  const [result, setResult] = useState<RegisterResult | null>(null);

  const totalFramesNeeded = ENROLLMENT_STAGES.length * FRAMES_PER_STAGE;
  const progress = busy
    ? Math.round((acceptedFrameCount / totalFramesNeeded) * 100)
    : result?.success
      ? 100
      : 0;
  const currentStage = ENROLLMENT_STAGES[currentStageIndex] ?? ENROLLMENT_STAGES[0];
  const progressRingStyle = {
    background: `conic-gradient(var(--accent-color) ${progress * 3.6}deg, rgba(148, 163, 184, 0.24) 0deg)`,
  };

  const isLivenessError = useCallback((message: string) => {
    const value = message.toLowerCase();
    return value.includes("liveness") || value.includes("blink") || value.includes("head movement");
  }, []);

  const resetEnrollment = useCallback(() => {
    setCurrentStageIndex(0);
    setCompletedStages([]);
    setAcceptedFrameCount(0);
    setQualityFeedback("Position your face inside the frame");
    setResult(null);
    setEnrolledAt(null);
    setLivenessState("idle");
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
            width: { ideal: 720 },
            height: { ideal: 960 },
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

  const captureStageFrames = useCallback(
    async (stage: EnrollmentStage) => {
      const frames: string[] = [];
      let attempts = 0;
      let lastFeedback = stage.helper;
      setQualityFeedback(stage.helper);

      while (frames.length < FRAMES_PER_STAGE && attempts < FRAMES_PER_STAGE * 5) {
        attempts += 1;
        await sleep(CAPTURE_DELAY_MS);

        const frame = videoRef.current ? getFrameQuality(videoRef.current) : null;
        const qualityMessage = getQualityMessage(frame);

        if (qualityMessage || !frame) {
          lastFeedback = qualityMessage ?? "Position your face inside the frame";
          setQualityFeedback(lastFeedback);
          continue;
        }

        frames.push(frame.dataUrl);
        setAcceptedFrameCount((count) => count + 1);
        lastFeedback = frames.length === FRAMES_PER_STAGE ? "Face captured" : "Hold still";
        setQualityFeedback(lastFeedback);
      }

      if (frames.length < FRAMES_PER_STAGE) {
        throw new Error(`${stage.title}: ${lastFeedback || "Unable to capture enough clear frames."}`);
      }

      setCompletedStages((stages) => [...stages, stage.id]);
      return frames;
    },
    [],
  );

  const captureAndRegister = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    setBusy(true);
    setResult(null);
    setEnrolledAt(null);
    setLivenessState("capturing");
    setCurrentStageIndex(0);
    setCompletedStages([]);
    setAcceptedFrameCount(0);
    setQualityFeedback("Position your face inside the frame");

    try {
      const frames: string[] = [];

      for (let stageIndex = 0; stageIndex < ENROLLMENT_STAGES.length; stageIndex += 1) {
        const stage = ENROLLMENT_STAGES[stageIndex];
        setCurrentStageIndex(stageIndex);
        frames.push(...(await captureStageFrames(stage)));
      }

      if (frames.length < totalFramesNeeded) {
        throw new Error("Unable to capture enough clear live frames.");
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
      setEnrolledAt(new Date().toLocaleString());
      setLivenessState("passed");
      setQualityFeedback("Registration complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Face registration failed.";
      setResult({
        error: message,
      });
      setLivenessState(isLivenessError(message) ? "failed" : "idle");
      setQualityFeedback(message);
    } finally {
      setBusy(false);
    }
  }, [captureStageFrames, isLivenessError, totalFramesNeeded]);

  const livenessLabel = useMemo(() => {
    if (livenessState === "capturing") return "Validating liveness...";
    if (livenessState === "passed") return "Liveness check passed";
    if (livenessState === "failed") return "Liveness validation failed";
    return "Awaiting guided capture";
  }, [livenessState]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Biometric Enrollment
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Facial Registration
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Follow the guided capture to generate one stronger encrypted facial profile for SKTECH
          attendance verification.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="rounded-2xl border border-glass-border bg-surface p-3 shadow-xl backdrop-blur-md sm:p-5">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-glass-border bg-black/80">
            <video
              ref={videoRef}
              className="aspect-[3/4] w-full object-cover sm:aspect-video"
              muted
              autoPlay
              playsInline
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="grid h-[68%] w-[68%] max-w-[280px] place-items-center rounded-[50%] p-1"
                style={progressRingStyle}
              >
                <div className="h-full w-full rounded-[50%] border-2 border-cyan-200/80 bg-transparent shadow-[0_0_36px_rgba(34,211,238,0.35)]" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-3">
              <div className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-semibold text-white/90">
                Live Camera
              </div>
              <div className="rounded-full border border-cyan-200/30 bg-black/45 px-3 py-1 text-xs font-semibold text-cyan-100">
                {progress}%
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/55 p-3 text-center backdrop-blur">
              <p className="text-base font-bold text-white sm:text-lg">{currentStage.instruction}</p>
              <p className="mt-1 text-xs text-cyan-100/90 sm:text-sm">{qualityFeedback}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {cameraEnabled ? (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <VideoOff className="h-4 w-4" />
                Disable Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <Video className="h-4 w-4" />
                Enable Camera
              </button>
            )}

            <button
              type="button"
              disabled={!cameraEnabled || !consentChecked || busy}
              onClick={() => void captureAndRegister()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {busy ? "Capturing..." : "Start Guided Enrollment"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={resetEnrollment}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </article>

        <article className="space-y-4 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md sm:p-5">
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
            {ENROLLMENT_STAGES.map((stage, index) => {
              const completed = completedStages.includes(stage.id) || result?.success;
              const active = busy && index === currentStageIndex;
              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-3 ${
                    completed
                      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                      : active
                        ? "border-cyan-300/45 bg-cyan-500/10 text-cyan-100"
                        : "border-glass-border bg-surface-elevated/40 text-muted"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                      Step {index + 1}
                    </span>
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : active ? (
                      <Sparkles className="h-4 w-4" />
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                </div>
              );
            })}
          </div>

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
            <p className="mt-1 text-xs text-muted">
              {acceptedFrameCount}/{totalFramesNeeded} clear frames accepted
            </p>
          </div>

          {result?.success ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Face Registration Complete
              </div>
              <p className="text-sm">Your facial profile is ready for SKTECH attendance verification.</p>
              {enrolledAt ? (
                <p className="mt-1 text-xs text-emerald-100/80">Enrolled: {enrolledAt}</p>
              ) : null}
              <p className="mt-1 text-xs text-emerald-100/80">
                Detected Faces: {result.detectedFaces ?? 0}
              </p>
            </div>
          ) : null}

          {result?.error ? (
            <div className="flex gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{result.error}</span>
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
