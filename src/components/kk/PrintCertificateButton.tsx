"use client";

export default function PrintCertificateButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-900"
    >
      Print certificate
    </button>
  );
}
