"use client";

export default function PrintControls() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      Print / Save as PDF
    </button>
  );
}
