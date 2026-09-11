"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Snapshot = Record<string, string | boolean | null>;

type ProfileChangeRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedChanges: Snapshot;
  currentSnapshot: Snapshot;
  requestedPhotoUrl: string | null;
  faceMatchScore: number | null;
  faceCheckStatus: "NOT_CHECKED" | "MATCHED" | "MISMATCHED" | "UNAVAILABLE";
  createdAt: string;
  official: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    municipality: string | null;
    barangay: string | null;
    municipalityId: string | null;
    user: { image: string | null } | null;
  };
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  middleName: "Middle name",
  lastName: "Last name",
  suffix: "Suffix",
  birthDate: "Birth date",
  position: "Position",
  municipality: "Municipality",
  barangay: "Barangay",
  contactNo: "Contact number",
  address: "Address",
  dateElected: "Date elected",
  termEnd: "Term expiration",
};

const displayValue = (value: string | boolean | null | undefined) => {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
};

export default function ProfileChangeRequests() {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalWarningRequestId, setApprovalWarningRequestId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff/profile-change-requests", { cache: "no-store" });
      const payload = (await response.json()) as { data?: ProfileChangeRequest[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to load profile changes.");
      setRequests(payload.data ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile changes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const submitReview = async (id: string, action: "APPROVE" | "REJECT", reason: string | null) => {
    if (action === "REJECT" && (!reason || reason.trim().length < 3)) {
      setError("A rejection reason is required.");
      return;
    }

    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/staff/profile-change-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Review failed.");
      setSuccess(payload.message ?? "Profile change reviewed.");
      setRejectionRequestId(null);
      setRejectionReason("");
      setApprovalWarningRequestId(null);
      await loadRequests();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review failed.");
    } finally {
      setSavingId(null);
    }
  };

  const review = (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT") {
      setError(null);
      setRejectionRequestId(id);
      setRejectionReason("");
      return;
    }

    const request = requests.find((item) => item.id === id);
    if (request && (request.faceCheckStatus === "UNAVAILABLE" || request.faceCheckStatus === "MISMATCHED")) {
      setError(null);
      setApprovalWarningRequestId(id);
      return;
    }

    void submitReview(id, action, null);
  };

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Municipal Review</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Profile Change Requests</h3>
          <p className="mt-1 text-sm text-muted">Review photo and profile changes from Officials assigned to your municipality.</p>
        </div>
        <button type="button" onClick={() => void loadRequests()} className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated">
          Refresh
        </button>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</p> : null}
      {loading ? <p className="mt-5 text-sm text-muted">Loading profile change requests...</p> : null}
      {!loading && requests.length === 0 ? <p className="mt-5 text-sm text-muted">No pending profile changes for your municipality.</p> : null}

      <div className="mt-5 space-y-4">
        {requests.map((request) => {
          const current = request.currentSnapshot;
          const requested = request.requestedChanges;
          const changedFields = Object.keys(FIELD_LABELS).filter(
            (field) => displayValue(current[field]) !== displayValue(requested[field]),
          );
          const currentPhoto = typeof current.photoUrl === "string" ? current.photoUrl : null;
          const busy = savingId === request.id;

          return (
            <article key={request.id} className="rounded-xl border border-glass-border bg-surface-elevated/35 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-foreground">{[request.official.firstName, request.official.middleName, request.official.lastName].filter(Boolean).join(" ")}</h4>
                  <p className="mt-1 text-xs text-muted">{request.official.municipality ?? "Not recorded"} / {request.official.barangay ?? "Not recorded"}</p>
                  <p className="mt-1 text-xs text-muted">Submitted {new Date(request.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">PENDING</span>
              </div>

              {request.requestedPhotoUrl ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[{ label: "Current approved photo", url: currentPhoto }, { label: "Requested photo", url: request.requestedPhotoUrl }].map((photo) => (
                    <div key={photo.label}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{photo.label}</p>
                      <div className="relative aspect-[4/5] max-w-[180px] overflow-hidden rounded-lg border border-glass-border bg-surface">
                        {photo.url ? <Image src={photo.url} alt={photo.label} fill unoptimized className="object-cover" sizes="180px" /> : <div className="flex h-full items-center justify-center text-xs text-muted">Not recorded</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 rounded-lg border border-glass-border bg-surface/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Requested field changes</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {changedFields.length === 0 ? <p className="text-sm text-muted">Photo-only change.</p> : changedFields.map((field) => (
                    <div key={field} className="rounded-md border border-glass-border px-3 py-2 text-sm">
                      <p className="text-xs font-semibold text-muted">{FIELD_LABELS[field]}</p>
                      <p className="mt-1 text-foreground">{displayValue(current[field])} <span className="text-accent">-&gt;</span> {displayValue(requested[field])}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs text-amber-200">
                Face check: {request.faceCheckStatus === "UNAVAILABLE" ? "UNAVAILABLE - manual photo verification required" : request.faceCheckStatus}{request.faceMatchScore !== null ? ` (${request.faceMatchScore.toFixed(3)})` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void review(request.id, "APPROVE")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving..." : "Approve"}</button>
                <button type="button" disabled={busy} onClick={() => void review(request.id, "REJECT")} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Reject</button>
              </div>
            </article>
          );
        })}
      </div>

      {rejectionRequestId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-glass-border bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">Reject Profile Change</h3>
            <p className="mt-2 text-sm text-muted">Provide a reason for rejecting this profile change request.</p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              autoFocus
              placeholder="Rejection reason"
              className="mt-4 w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setRejectionRequestId(null); setRejectionReason(""); }} className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-elevated/60">
                Cancel
              </button>
              <button type="button" disabled={savingId === rejectionRequestId} onClick={() => void submitReview(rejectionRequestId, "REJECT", rejectionReason)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {savingId === rejectionRequestId ? "Saving..." : "Reject Profile Change"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {approvalWarningRequestId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/40 bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">Confirm Photo Verification</h3>
            <p className="mt-2 text-sm text-muted">Face comparison is not positive. Confirm that you manually verified the requested photo against the approved record.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setApprovalWarningRequestId(null)} className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-elevated/60">
                Cancel
              </button>
              <button type="button" disabled={savingId === approvalWarningRequestId} onClick={() => void submitReview(approvalWarningRequestId, "APPROVE", null)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {savingId === approvalWarningRequestId ? "Saving..." : "Approve Anyway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
