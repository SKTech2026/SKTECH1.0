import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import OfficialProfileForm from "@/app/dashboard/official/profile/profile-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireDashboardRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialProfilePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });

  const [user, municipalities, pendingRequest, rejectedRequest] = await Promise.all([
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
            suffix: true,
            birthDate: true,
            sex: true,
            position: true,
            skFederationOfficer: true,
            skFederationPosition: true,
            municipalityId: true,
            barangayId: true,
            sitio: true,
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
    prisma.officialProfileChangeRequest.findFirst({
      where: {
        requestedByUserId: authorizedSession.user.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        createdAt: true,
        faceCheckStatus: true,
        rejectionReason: true,
      },
    }),
    prisma.officialProfileChangeRequest.findFirst({
      where: {
        requestedByUserId: authorizedSession.user.id,
        status: "REJECTED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        createdAt: true,
        faceCheckStatus: true,
        rejectionReason: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/official/auth");
  }

  if (!user.official) {
    return (
      <div className="space-y-4">
        <Link href="/mobile/official/settings" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Submit your admission profile first before editing digital ID details.
        </section>
      </div>
    );
  }

  const reviewRequest = pendingRequest ?? rejectedRequest;

  return (
    <div className="space-y-4">
      <Link href="/mobile/official/settings" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Profile Management
        </p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Edit Mobile Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Changes are submitted to Municipal Staff for review before they appear on your Digital ID.
        </p>
      </section>

      {reviewRequest ? (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">
            {reviewRequest.status === "PENDING"
              ? "Profile update awaiting Municipal Staff review"
              : "Profile update was rejected by Municipal Staff"}
          </p>
          <p className="mt-1 text-amber-100/80">
            Your Digital ID continues to show the last approved information. Submitted {reviewRequest.createdAt.toLocaleString()}.
            {reviewRequest.status === "REJECTED" && reviewRequest.rejectionReason
              ? ` Reason: ${reviewRequest.rejectionReason}`
              : ""}
          </p>
          {reviewRequest.status === "PENDING" && reviewRequest.faceCheckStatus === "UNAVAILABLE" ? (
            <p className="mt-2 text-xs text-amber-100/80">
              Face comparison unavailable. Staff must manually verify the requested photo against the registered photo.
            </p>
          ) : null}
        </section>
      ) : null}

      <OfficialProfileForm
        initial={{
          officialId: user.official.id,
          firstName: user.official.firstName,
          middleName: user.official.middleName ?? "",
          lastName: user.official.lastName,
          suffix: user.official.suffix ?? "",
          birthDate: user.official.birthDate?.toISOString().slice(0, 10) ?? "",
          sex: user.official.sex,
          position: user.official.position ?? "SK_CHAIRPERSON",
          skFederationOfficer: user.official.skFederationOfficer,
          skFederationPosition: user.official.skFederationPosition,
          municipalityId: user.official.municipalityId ?? "",
          barangayId: user.official.barangayId ?? "",
          sitio: user.official.sitio ?? "",
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
