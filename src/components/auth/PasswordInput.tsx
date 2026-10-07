"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-2">
      <input {...props} type={visible ? "text" : "password"} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-14 text-base text-slate-900 outline-none motion-safe:transition-colors motion-safe:duration-200 focus:border-blue-700 focus:ring-4 focus:ring-blue-600/15" />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-700 motion-safe:transition-colors motion-safe:duration-200 hover:bg-slate-100 hover:text-blue-800">
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
