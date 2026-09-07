import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import {
  Clock3,
  IdCard,
  Megaphone,
  MessageSquare,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireDashboardRole } from "@/lib/roleGuard";
import { formatOfficialFullName } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

export default async function MobileOfficialPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });

  const user = await prisma.user.findUnique({
    where: { id: authorized.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      faceRegistered: true,
      status: true,
      official: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          barangay: true,
          municipality: true,
          role: true,
          position: true,
          admissionStatus: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });
  const faceRegistered = user?.faceRegistered ?? false;

  if (!user?.official) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Official Mobile</p>
          <h1 className="mt-1 text-xl font-bold text-foreground">Complete Admission Credentials</h1>
          <p className="mt-1 text-sm text-muted">
            Submit your SK information, proof of legitimacy, ID photo, and face registration for Staff review.
          </p>
        </section>
        <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Not submitted yet</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Admission is required</h2>
          <p className="mt-1 text-sm text-muted">Your Official profile is not linked yet. Start the secure admission flow to create your submission.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/mobile/official/admission" className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground">Start / Continue Admission</Link>
            <Link href="/mobile/official/admission" className="inline-flex h-11 items-center justify-center rounded-xl border border-glass-border bg-surface px-4 text-sm font-semibold text-foreground">Upload ID Photo</Link>
            <Link href="/mobile/official/facial-registration" className="inline-flex h-11 items-center justify-center rounded-xl border border-glass-border bg-surface px-4 text-sm font-semibold text-foreground">Register Face</Link>
            <Link href="/mobile/official/admission" className="inline-flex h-11 items-center justify-center rounded-xl border border-glass-border bg-surface px-4 text-sm font-semibold text-foreground">View Submission Status</Link>
          </div>
        </section>
        <section className="rounded-2xl border border-glass-border bg-surface p-4 text-sm text-muted">
          <p>Face status: <span className={faceRegistered ? "font-semibold text-emerald-300" : "font-semibold text-amber-200"}>{faceRegistered ? "Face Registered" : "Not Registered"}</span></p>
          <p className="mt-2">Staff review begins after the admission form, proof document, and required face capture are submitted.</p>
        </section>
      </div>
    );
  }

  const fullName = formatOfficialFullName(user.official);
  const isApproved =
    user.status === "APPROVED" &&
    user.official.admissionStatus === "APPROVED" &&
    user.official.status === "ACTIVE";
  const isRejected = user.official.admissionStatus === "REJECTED";
  const profileHref = user.official ? "/mobile/official/profile" : "/mobile/official/admission";

  if (!isApproved) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Official Mobile</p>
          <h1 className="mt-1 text-xl font-bold text-foreground">Official Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Welcome, {fullName}. Complete your official admission to continue.</p>
        </section>
        <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">{isRejected ? "Admission resubmission required" : user.official.updatedAt ? "Admission pending review" : "Admission details required"}</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Complete Admission Details</h2>
          <p className="mt-1 text-sm text-muted">
            {isRejected
              ? "Review and resubmit your credentials for Municipal Staff review."
              : user.official.updatedAt
                ? "Your credentials are with Municipal Staff for review. Official features remain locked until approval."
                : "Submit your credentials for Staff review before accessing Official features."}
          </p>
          <Link href="/dashboard/official/admission" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground">
            {isRejected ? "Review Admission Details" : "Complete Admission Details"}
          </Link>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href={profileHref} className="inline-flex h-10 items-center justify-center rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground">Upload / Update ID Photo</Link>
            <Link href="/mobile/official/facial-registration" className="inline-flex h-10 items-center justify-center rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground">{user.faceRegistered ? "Face Registered" : "Register Face"}</Link>
          </div>
        </section>
        <section className="rounded-2xl border border-glass-border bg-surface p-4 text-sm text-muted">
          <p>Current status: <span className="font-semibold text-amber-200">{user.official.admissionStatus}</span></p>
          <p className="mt-2">Submitted details: <span className="font-semibold text-foreground">{fullName}</span> from {user.official.municipality ?? "your municipality"}.</p>
          <p className="mt-2">Face status: <span className={user.faceRegistered ? "font-semibold text-emerald-300" : "font-semibold text-amber-200"}>{user.faceRegistered ? "Face Registered" : "Not Registered"}</span></p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Official Mobile</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Official Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Welcome, {fullName}. Choose what you want to access.</p>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Official access</h2>
            <p className="mt-1 text-xs text-muted">Approved account status: {user.official.status}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isApproved ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}>
            {isApproved ? "Approved" : "Pending"}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/id/${user.official.id}`} className="rounded-2xl border border-glass-border bg-surface p-4 transition hover:bg-surface-elevated">
          <IdCard className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Digital ID</h2>
          <p className="mt-1 text-xs text-muted">Open your landscape digital identity card.</p>
        </Link>
        <Link href="/mobile/official/announcements" className="rounded-2xl border border-glass-border bg-surface p-4 transition hover:bg-surface-elevated">
          <Megaphone className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Announcements</h2>
          <p className="mt-1 text-xs text-muted">Read active federation announcements.</p>
        </Link>
        <Link href="/mobile/official/feed" className="rounded-2xl border border-glass-border bg-surface p-4 transition hover:bg-surface-elevated">
          <Megaphone className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Municipal SK Federation Feed</h2>
          <p className="mt-1 text-xs text-muted">See Staff posts for your municipality.</p>
        </Link>
        <Link href="/mobile/official/chat" className="rounded-2xl border border-glass-border bg-surface p-4 transition hover:bg-surface-elevated">
          <MessageSquare className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Chat</h2>
          <p className="mt-1 text-xs text-muted">Message approved SKTECH contacts.</p>
        </Link>
        <Link href="/mobile/official/attendance-logs" className="rounded-2xl border border-glass-border bg-surface p-4 transition hover:bg-surface-elevated">
          <Clock3 className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Attendance Logs</h2>
          <p className="mt-1 text-xs text-muted">Review your recent attendance records.</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-4 text-xs text-muted">
        <p>
          Face registration status:{" "}
          <span className={user.faceRegistered ? "text-emerald-300" : "text-amber-300"}>
            {user.faceRegistered ? "Registered" : "Not registered"}
          </span>
        </p>
      </section>
    </div>
  );
}
