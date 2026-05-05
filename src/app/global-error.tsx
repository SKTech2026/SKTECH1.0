"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl">
          <h1 className="text-2xl font-bold">Application error</h1>
          <p className="mt-2 text-sm text-slate-300">
            The app encountered a critical error. Please retry.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
