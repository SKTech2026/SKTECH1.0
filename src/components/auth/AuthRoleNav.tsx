import Link from "next/link";
import { ShieldCheck, UserCog, Users } from "lucide-react";

const roles = [
  { role: "OFFICIAL", label: "Official", href: "/official/auth", icon: Users },
  { role: "STAFF", label: "Staff", href: "/login?role=STAFF", icon: UserCog },
  { role: "ADMIN", label: "Admin", href: "/login?role=ADMIN", icon: ShieldCheck },
] as const;

export default function AuthRoleNav({ activeRole }: { activeRole: "ADMIN" | "STAFF" | "OFFICIAL" }) {
  return (
    <nav aria-label="Choose your sign-in portal" className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {roles.map(({ role, label, href, icon: Icon }) => (
        <Link key={role} href={href} aria-current={role === activeRole ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors ${role === activeRole ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white hover:text-blue-700"}`}>
          <Icon size={14} aria-hidden="true" />{label}
        </Link>
      ))}
    </nav>
  );
}
