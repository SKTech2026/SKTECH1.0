"use client";

import { useCallback, useEffect, useState } from "react";

type TerminationConfirmModalProps = {
  open: boolean;
  title: string;
  subjectName: string;
  subjectType: "official" | "staff";
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
};

export default function TerminationConfirmModal({
  open,
  title,
  subjectName,
  subjectType,
  onClose,
  onConfirm,
  loading = false,
}: TerminationConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const closeModal = useCallback(() => {
    if (loading) return;
    setReason("");
    setConfirmation("");
    onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, open]);

  if (!open) return null;

  const canConfirm = reason.trim().length > 0 && confirmation === "TERMINATE" && !loading;
  const confirmTermination = async () => {
    await onConfirm(reason.trim());
    setReason("");
    setConfirmation("");
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/65 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="termination-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-rose-300/30 bg-surface p-5 shadow-2xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">
          Permanent account action
        </p>
        <h2 id="termination-modal-title" className="mt-2 text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">
          You are terminating {subjectType === "official" ? "official" : "staff"} account <strong className="text-foreground">{subjectName}</strong>.
        </p>
        <p className="mt-3 rounded-xl border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-6 text-rose-100">
          This action is permanent. The account will be terminated and the record will be preserved for archive and audit history.
        </p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="termination-reason">
          Reason
        </label>
        <textarea
          id="termination-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={loading}
          rows={3}
          placeholder="Enter the reason for termination"
          className="mt-1.5 w-full resize-y rounded-xl border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-rose-300/60 disabled:opacity-60"
        />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="termination-confirmation">
          Type TERMINATE to confirm
        </label>
        <input
          id="termination-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={loading}
          autoComplete="off"
          className="mt-1.5 w-full rounded-xl border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm font-semibold tracking-[0.12em] text-foreground outline-none transition focus:border-rose-300/60 disabled:opacity-60"
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirmTermination()}
            disabled={!canConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Terminating..." : "Permanently Terminate"}
          </button>
        </div>
      </div>
    </div>
  );
}
