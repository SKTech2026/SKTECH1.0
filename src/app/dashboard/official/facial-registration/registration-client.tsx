"use client";

import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";
import type {
  AwsCredentials,
  FaceLivenessDetectorCoreProps,
} from "@aws-amplify/ui-react-liveness";
import { Camera, CheckCircle2, CircleAlert, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type LivenessCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string | null;
};

type LivenessSession = {
  sessionId: string;
  region: string;
  credentials: LivenessCredentials;
};

type RegisterResult = {
  success?: boolean;
  message?: string;
  detectedFaces?: number;
  livenessPassed?: boolean;
  livenessConfidence?: number | null;
  error?: string;
};

type EnrollmentStatus =
  | "idle"
  | "preparing"
  | "scanning"
  | "verifying"
  | "complete"
  | "error";

type LivenessErrorPayload = Parameters<
  NonNullable<FaceLivenessDetectorCoreProps["onError"]>
>[0];

function describeLivenessError(error: LivenessErrorPayload): string {
  const message = error.error?.message?.toLowerCase() ?? "";

  if (message.includes("permission") || message.includes("notallowed")) {
    return "Camera permission denied. Allow camera access and try again.";
  }

  if (message.includes("timeout") || message.includes("expired")) {
    return "The secure face scan expired. Please try again.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "AWS Face Liveness is temporarily unavailable. Please try again.";
  }

  return "Liveness check failed. Please try again.";
}

function credentialsFromSession(session: LivenessSession): AwsCredentials {
  return {
    accessKeyId: session.credentials.accessKeyId,
    secretAccessKey: session.credentials.secretAccessKey,
    sessionToken: session.credentials.sessionToken,
    expiration: session.credentials.expiration
      ? new Date(session.credentials.expiration)
      : undefined,
  };
}

export default function FacialRegistrationClient() {
  const [session, setSession] = useState<LivenessSession | null>(null);
  const [status, setStatus] = useState<EnrollmentStatus>("idle");
  const [result, setResult] = useState<RegisterResult | null>(null);

  const statusText = useMemo(() => {
    if (status === "preparing") return "Preparing secure face scan";
    if (status === "scanning") return "Follow the camera instructions";
    if (status === "verifying") return "Creating secure facial profile";
    if (status === "complete") return "Registration complete";
    if (status === "error") return "Try again";
    return "Ready to register your face";
  }, [status]);

  const startLivenessSession = useCallback(async () => {
    setStatus("preparing");
    setResult(null);

    try {
      const response = await fetch("/api/face/liveness/session", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json()) as LivenessSession & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to prepare secure face scan.");
      }

      setSession(payload);
      setStatus("scanning");
    } catch (error) {
      setStatus("error");
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "AWS Face Liveness is temporarily unavailable. Please try again.",
      });
    }
  }, []);

  const resetEnrollment = useCallback(() => {
    setSession(null);
    setResult(null);
    setStatus("idle");
  }, []);

  const completeAnalysis = useCallback(async () => {
    if (!session) {
      return;
    }

    setStatus("verifying");

    try {
      const response = await fetch("/api/face/liveness/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      const payload = (await response.json()) as RegisterResult;

      if (!response.ok) {
        throw new Error(payload.error ?? "Face registration failed. Please try again.");
      }

      setStatus("complete");
      setResult(payload);
      setSession(null);
    } catch (error) {
      setStatus("error");
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Face registration failed. Please try again.",
      });
      setSession(null);
    }
  }, [session]);

  const handleLivenessError = useCallback((error: LivenessErrorPayload) => {
    setStatus("error");
    setSession(null);
    setResult({ error: describeLivenessError(error) });
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          AWS Face Liveness
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Facial Registration
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Complete a secure guided selfie to refresh your encrypted SKTECH facial profile for
          attendance verification.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
          <div className="border-b border-glass-border bg-surface-elevated/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Secure scan
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{statusText}</p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cyan-300/30 bg-cyan-500/10 text-cyan-200">
                {status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          <div className="min-h-[460px] bg-black/90 p-2 sm:p-4">
            {session ? (
              <div className="mx-auto max-w-md overflow-hidden rounded-[1.5rem] bg-white text-slate-950">
                <FaceLivenessDetectorCore
                  sessionId={session.sessionId}
                  region={session.region}
                  onAnalysisComplete={completeAnalysis}
                  onError={handleLivenessError}
                  onUserCancel={resetEnrollment}
                  config={{
                    credentialProvider: async () => credentialsFromSession(session),
                  }}
                />
              </div>
            ) : (
              <div className="flex min-h-[430px] flex-col items-center justify-center px-4 text-center">
                <div className="grid h-28 w-28 place-items-center rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                  {status === "complete" ? (
                    <CheckCircle2 className="h-12 w-12" />
                  ) : (
                    <Sparkles className="h-12 w-12" />
                  )}
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">{statusText}</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-300">
                  AWS will guide the camera scan. SKTECH stores only the encrypted facial
                  embedding after liveness and face quality checks succeed.
                </p>
                <button
                  type="button"
                  disabled={status === "preparing" || status === "verifying"}
                  onClick={() => void startLivenessSession()}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  {status === "idle" ? "Register / Re-Register Face" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </article>

        <article className="space-y-4 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md sm:p-5">
          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Enrollment State
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${
                status === "complete"
                  ? "text-emerald-300"
                  : status === "error"
                    ? "text-rose-300"
                    : "text-foreground"
              }`}
            >
              {statusText}
            </p>
          </div>

          {result?.success ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Face Registration Complete
              </div>
              <p className="text-sm">Your facial profile is ready for SKTECH attendance verification.</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Liveness confidence:{" "}
                {typeof result.livenessConfidence === "number"
                  ? `${result.livenessConfidence.toFixed(1)}%`
                  : "Passed"}
              </p>
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

          <button
            type="button"
            disabled={status === "preparing" || status === "verifying"}
            onClick={resetEnrollment}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-4 text-xs text-muted">
            <div className="mb-2 inline-flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Security Notes
            </div>
            <ul className="space-y-1">
              <li>AWS verifies liveness before SKTECH creates a facial profile.</li>
              <li>Reference image processing happens server-side only.</li>
              <li>Only encrypted embeddings are stored for attendance verification.</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
