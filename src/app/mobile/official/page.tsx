import Link from "next/link";
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
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";
import { formatEnumLabel, formatOfficialFullName } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

export default async function MobileOfficialPage() {
  const session = await getServerSession(authOptions);
  const authorized = await requireOfficialFeatureAccess(session);

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
          suffix: true,
          barangay: true,
          municipality: true,
          role: true,
          position: true,
          skFederationOfficer: true,
          skFederationPosition: true,
          dateElected: true,
          termStart: true,
          termEnd: true,
          birthDate: true,
          contactNo: true,
          email: true,
          address: true,
          admissionStatus: true,
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

  const qrValue = `/id/${user.official.id}`;
  const photoUrl =
    user.image && user.image.startsWith("/") ? user.image : "/images/default-official.svg";
  const fullName = formatOfficialFullName(user.official);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Official Mobile Access</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Digital ID Wallet</h1>
        <p className="mt-1 text-xs text-muted">
          Swipe-ready identity, attendance history, and federation announcements.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link
          href="/mobile/official"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground"
        >
          <IdCard className="h-4 w-4 text-cyan-300" />
          Mobile Home
        </Link>
        <Link
          href="/mobile/official/chat"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground"
        >
          <MessageSquare className="h-4 w-4 text-cyan-300" />
          Chat
        </Link>
        <a
          href="#announcements"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground"
        >
          <Megaphone className="h-4 w-4 text-cyan-300" />
          Announcements
        </a>
        <a
          href="#attendance"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-xs font-semibold text-foreground"
        >
          <Clock3 className="h-4 w-4 text-cyan-300" />
          Attendance
        </a>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-3">
        <FlippablePortraitID
          fullName={fullName}
          position={formatEnumLabel(user.official.position ?? user.official.role)}
          skfedPosition={
            user.official.skFederationOfficer
              ? formatEnumLabel(user.official.skFederationPosition)
              : null
          }
          barangay={user.official.barangay ?? "N/A"}
          municipality={user.official.municipality ?? "N/A"}
          dateElected={(user.official.dateElected ?? user.official.termStart).toISOString()}
          termEnd={user.official.termEnd?.toISOString() ?? null}
          birthDate={user.official.birthDate?.toISOString() ?? null}
          contactNo={user.official.contactNo}
          email={user.official.email}
          address={user.official.address}
          admissionStatus={user.official.admissionStatus}
          registryStatus={user.official.status}
          accountStatus={user.official.status}
          idNumber={user.official.id.replace(/-/g, "").slice(-12).toUpperCase()}
          qrValue={qrValue}
          photoUrl={photoUrl}
          variant="dashboardPreview"
          className="mx-auto max-w-full"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={`/id/${user.official.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
            <IdCard className="h-4 w-4" />
            Open ID
          </Link>
          <Link
            href="/mobile/official/facial-registration"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm font-semibold text-foreground"
          >
            <RefreshCcw className="h-4 w-4" />
            Re-Register Face
          </Link>
        </div>
      </section>

      <section id="attendance" className="scroll-mt-24 rounded-2xl border border-glass-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Attendance History</h2>
          <span className="text-xs text-muted">{user.official.attendances.length} recent records</span>
        </div>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {user.official.attendances.length === 0 ? (
            <p className="rounded-xl border border-dashed border-glass-border px-3 py-3 text-xs text-muted">
              No attendance logs yet.
            </p>
          ) : (
            user.official.attendances.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-glass-border bg-surface-elevated px-3 py-2"
              >
                <p className="text-xs font-semibold text-foreground">
                  {record.event?.title ?? "General Attendance"}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
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

      <section id="announcements" className="scroll-mt-24 rounded-2xl border border-glass-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Active Announcements</h2>
        <div className="mt-3 space-y-2">
          {announcements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-glass-border px-3 py-3 text-xs text-muted">
              No announcements available.
            </p>
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="rounded-xl border border-glass-border bg-surface-elevated px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.eventDate.toLocaleDateString()}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {item.description ?? "No details provided."}
                </p>
              </article>
            ))
          )}
        </div>
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
