import Link from "next/link";
import { ShieldCheck, UserCog } from "lucide-react";

const roles = [
  { role: "ADMIN", label: "Administrator", href: "/login?role=ADMIN", icon: ShieldCheck },
  { role: "STAFF", label: "Staff", href: "/login?role=STAFF", icon: UserCog },
] as const;

export default function AuthRoleNav({ activeRole }: { activeRole: "ADMIN" | "STAFF" }) {
  return (
    <nav aria-label="Choose internal access role" className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1">
      {roles.map(({ role, label, href, icon: Icon }) => (
        <Link key={role} href={href} aria-current={role === activeRole ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold motion-safe:transition-colors motion-safe:duration-200 ${role === activeRole ? "bg-white text-blue-800 shadow-sm ring-1 ring-slate-300" : "text-slate-700 hover:bg-white hover:text-blue-800"}`}>
          <Icon size={14} aria-hidden="true" />{label}
        </Link>
      ))}
    </nav>
  );
}
