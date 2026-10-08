type SKTechBotLauncherProps = {
  open: boolean;
  onClick: () => void;
  controls: string;
  label?: string;
};

export function SKTechBotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="12" width="28" height="20" rx="7" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.46)" />
      <rect x="14" y="18" width="36" height="26" rx="10" fill="rgba(15,23,42,0.18)" stroke="rgba(255,255,255,0.4)" />
      <circle cx="24" cy="31" r="2.8" fill="currentColor" />
      <circle cx="40" cy="31" r="2.8" fill="currentColor" />
      <path d="M28 38C31.2 40.5 32.8 40.5 36 38" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 10L20 5H44L41 10" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 44V52M44 44V52M26 52H38" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 29.5H14M50 29.5H54" stroke="rgba(125,211,252,0.65)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SKTechBotLauncher({ open, onClick, controls, label = "SKTECH AI Assistant" }: SKTechBotLauncherProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Close ${label}` : `Open ${label}`}
      aria-expanded={open}
      aria-controls={controls}
      className={`group relative grid h-14 w-14 place-items-center rounded-full border border-cyan-300/50 bg-slate-950/90 text-cyan-50 shadow-[0_12px_34px_-10px_rgba(14,165,233,0.85)] backdrop-blur-xl transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_40px_-8px_rgba(34,211,238,0.9)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transform-none motion-reduce:transition-none md:h-16 md:w-16 ${open ? "bg-slate-900" : ""}`}
    >
      <span className="absolute inset-0 rounded-full border border-cyan-300/35 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />
      <span className="absolute inset-1 rounded-full border border-dashed border-cyan-200/30 motion-safe:animate-[spin_18s_linear_infinite]" />
      <span className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(103,232,249,0.6),rgba(8,145,178,0.28)_40%,transparent_75%)] motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
      <SKTechBotIcon className="relative h-8 w-8 md:h-9 md:w-9" />
      <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
    </button>
  );
}
