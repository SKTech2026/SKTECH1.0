import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  IdCard,
  Megaphone,
  MessageSquare,
  RefreshCcw,
} from "lucide-react";

import FlippablePortraitID from "@/components/id/FlippablePortraitID";
import { authOptions } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/announcements";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireRole(session, [Role.OFFICIAL]);

  const user = await prisma.user.findUnique({
    where: { id: authorized.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      faceRegistered: true,
      official: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          barangay: true,
          municipality: true,
          role: true,
          termStart: true,
          termEnd: true,
          status: true,
          attendances: {
            orderBy: { createdAt: "desc" },
            take: 15,
            include: {
              event: {
                select: { title: true },
              },
            },
          },
        },
      },
    },
  });

  const announcements = await getActiveAnnouncements(5);

  if (!user?.official) {
    return (
      <section className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-200">
        Your official profile is not linked yet. Please contact municipal staff for verification.
      </section>
    );
  }

  const fullName = `${user.official.firstName}${
    user.official.middleName ? ` ${user.official.middleName}` : ""
  } ${user.official.lastName}`.trim();
  const termPeriod = `${user.official.termStart.toLocaleDateString()} - ${
    user.official.termEnd?.toLocaleDateString() ?? "Active"
  }`;
  const qrValue = `/id/${user.official.id}`;
  const photoUrl =
    user.image && user.image.startsWith("/") ? user.image : "/images/default-official.svg";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4 shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Official Mobile Access</p>
        <h1 className="mt-1 text-xl font-bold text-slate-100">Digital ID Wallet</h1>
        <p className="mt-1 text-xs text-slate-300">
          Swipe-ready identity, attendance history, and federation announcements.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link
          href="/mobile/official"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100"
        >
          <IdCard className="h-4 w-4 text-cyan-300" />
          Mobile Home
        </Link>
        <Link
          href="/mobile/official/chat"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100"
        >
          <MessageSquare className="h-4 w-4 text-cyan-300" />
          Chat
        </Link>
        <a
          href="#announcements"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100"
        >
          <Megaphone className="h-4 w-4 text-cyan-300" />
          Announcements
        </a>
        <a
          href="#attendance"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-900/80 px-3 text-xs font-semibold text-slate-100"
        >
          <Clock3 className="h-4 w-4 text-cyan-300" />
          Attendance
        </a>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-3">
        <FlippablePortraitID
          fullName={fullName}
          position={user.official.role}
          barangay={user.official.barangay ?? "N/A"}
          municipality={user.official.municipality ?? "N/A"}
          termPeriod={termPeriod}
          idNumber={user.official.id.slice(0, 12).toUpperCase()}
          qrValue={qrValue}
          photoUrl={photoUrl}
          skfedLogoUrl="/login-logo.png"
          provincialSealUrl="/images/provincial-seal-logo.png"
          className="mx-auto max-w-full"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={`/id/${user.official.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-slate-950"
          >
            <IdCard className="h-4 w-4" />
            Open ID
          </Link>
          <Link
            href="/dashboard/official/facial-registration"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-800/80 px-3 text-sm font-semibold text-slate-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Re-Register Face
          </Link>
        </div>
      </section>

      <section id="attendance" className="scroll-mt-24 rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Attendance History</h2>
          <span className="text-xs text-slate-400">{user.official.attendances.length} recent records</span>
        </div>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {user.official.attendances.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-xs text-slate-400">
              No attendance logs yet.
            </p>
          ) : (
            user.official.attendances.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2"
              >
                <p className="text-xs font-semibold text-slate-100">
                  {record.event?.title ?? "General Attendance"}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-300">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                  {record.timeIn.toLocaleString()}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {record.timeOut ? "Checked out" : "Checked in"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section id="announcements" className="scroll-mt-24 rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Active Announcements</h2>
        <div className="mt-3 space-y-2">
          {announcements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-xs text-slate-400">
              No announcements available.
            </p>
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2">
                <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.eventDate.toLocaleDateString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-300">
                  {item.description ?? "No details provided."}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4 text-xs text-slate-300">
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
