"use client";

import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";

type LogoutConfirmButtonProps = {
  callbackUrl?: string;
  className?: string;
  children: ReactNode;
  title?: string;
  "aria-label"?: string;
};

export default function LogoutConfirmButton({
  callbackUrl = "/login",
  className,
  children,
  title,
  "aria-label": ariaLabel,
}: LogoutConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          aria-describedby="logout-confirm-message"
        >
          <div className="w-full max-w-sm rounded-2xl border border-glass-border bg-surface p-5 shadow-2xl">
            <h2 id="logout-confirm-title" className="text-lg font-semibold text-foreground">
              Confirm Logout
            </h2>
            <p id="logout-confirm-message" className="mt-2 text-sm leading-relaxed text-muted">
              Are you sure you want to log out?
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                autoFocus
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl })}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-300/35 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}