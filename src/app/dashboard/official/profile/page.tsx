import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

import OfficialProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function OfficialProfilePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.OFFICIAL], false);

  const [user, municipalities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authorizedSession.user.id },
      select: {
        id: true,
        image: true,
        official: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            position: true,
            municipalityId: true,
            barangayId: true,
            dateElected: true,
            termEnd: true,
            contactNo: true,
            address: true,
          },
        },
      },
    }),
    prisma.municipality.findMany({
      orderBy: [{ province: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        province: true,
        barangays: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (!user.official) {
    return (
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-200">
        <h2 className="text-lg font-semibold">No official profile yet</h2>
        <p className="mt-2">
          Submit your admission profile first before editing digital ID details.
        </p>
        <Link
          href="/dashboard/official/admission"
          className="mt-4 inline-flex rounded-lg border border-amber-300/40 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/15"
        >
          Go to Admission Form
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Identity Profile
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Edit SK Official Profile</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Keep your profile details updated so your digital ID always shows the latest
          official information.
        </p>
      </section>

      <OfficialProfileForm
        initial={{
          officialId: user.official.id,
          firstName: user.official.firstName,
          middleName: user.official.middleName ?? "",
          lastName: user.official.lastName,
          position: user.official.position ?? "SK_CHAIRPERSON",
          municipalityId: user.official.municipalityId ?? "",
          barangayId: user.official.barangayId ?? "",
          dateElected: user.official.dateElected?.toISOString().slice(0, 10) ?? "",
          termEnd: user.official.termEnd?.toISOString().slice(0, 10) ?? "",
          contactNo: user.official.contactNo ?? "",
          address: user.official.address ?? "",
          photoUrl: user.image && user.image.startsWith("/") ? user.image : "/images/default-official.svg",
        }}
        municipalities={municipalities}
      />
    </div>
  );
}

