"use client";

import { LogOut } from "lucide-react";

import LogoutConfirmButton from "@/components/auth/LogoutConfirmButton";

export default function LogoutButton() {
  return (
    <LogoutConfirmButton
      callbackUrl="/official/auth"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </LogoutConfirmButton>
  );
}
