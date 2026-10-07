"use client";

export default function KkAnalyticsPrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800">Print / Save as PDF</button>;
}
