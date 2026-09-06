import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

import OfficialProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function OfficialProfilePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = await requireOfficialFeatureAccess(session);

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
          Profile and photo changes are reviewed by Municipal Staff before they appear on your
          Digital ID.
        </p>
      </section>

      {(pendingRequest ?? rejectedRequest) ? (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">
            {(pendingRequest ?? rejectedRequest)?.status === "PENDING"
              ? "Profile update awaiting Municipal Staff review"
              : "Profile update was rejected by Municipal Staff"}
          </p>
          <p className="mt-1 text-amber-100/80">
            Your Digital ID continues to show the last approved information. Submitted {(pendingRequest ?? rejectedRequest)?.createdAt.toLocaleString()}.
            {(pendingRequest ?? rejectedRequest)?.status === "REJECTED" && (pendingRequest ?? rejectedRequest)?.rejectionReason
              ? ` Reason: ${(pendingRequest ?? rejectedRequest)?.rejectionReason}`
              : ""}
          </p>
          {(pendingRequest ?? rejectedRequest)?.status === "PENDING" && (pendingRequest ?? rejectedRequest)?.faceCheckStatus === "UNAVAILABLE" ? (
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
