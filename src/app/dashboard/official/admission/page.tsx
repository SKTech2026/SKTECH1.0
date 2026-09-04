import { AdmissionStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

import OfficialAdmissionForm from "./OfficialAdmissionForm";

export const dynamic = "force-dynamic";

export default async function OfficialAdmissionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.OFFICIAL], false);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const stepParam = resolvedSearchParams.step;
  const parsedStep = Number(Array.isArray(stepParam) ? stepParam[0] : stepParam ?? "1");
  const initialStep = Number.isFinite(parsedStep) ? parsedStep : 1;

  const [user, municipalities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authorizedSession.user.id },
      select: {
        id: true,
        status: true,
        official: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            birthDate: true,
            sex: true,
            municipalityId: true,
            barangayId: true,
            sitio: true,
            province: true,
            position: true,
            skFederationOfficer: true,
            skFederationPosition: true,
            dateElected: true,
            termEnd: true,
            admissionStatus: true,
            email: true,
            contactNo: true,
            address: true,
            proofDocumentUrl: true,
            proofDocumentName: true,
            proofDocumentType: true,
            updatedAt: true,
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

  if (
    user.status === UserStatus.APPROVED &&
    user.official?.admissionStatus === AdmissionStatus.APPROVED
  ) {
    redirect("/dashboard/official");
  }

  const existingProfile = user.official
    ? {
        firstName: user.official.firstName,
        middleName: user.official.middleName,
        lastName: user.official.lastName,
        suffix: user.official.suffix,
        birthDate: user.official.birthDate?.toISOString().slice(0, 10) ?? "",
        sex: user.official.sex,
        province: user.official.province ?? "Oriental Mindoro",
        municipalityId: user.official.municipalityId ?? "",
        barangayId: user.official.barangayId ?? "",
        sitio: user.official.sitio,
        position: user.official.position ?? "SK_CHAIRPERSON",
        skFederationOfficer: user.official.skFederationOfficer,
        skFederationPosition: user.official.skFederationPosition,
        dateElected: user.official.dateElected?.toISOString().slice(0, 10) ?? "",
        termEnd: user.official.termEnd?.toISOString().slice(0, 10) ?? "",
        status: user.official.admissionStatus,
        email: user.official.email ?? authorizedSession.user.email ?? "",
        contactNo: user.official.contactNo,
        address: user.official.address,
        proofDocumentUrl: user.official.proofDocumentUrl,
        proofDocumentName: user.official.proofDocumentName,
        proofDocumentType: user.official.proofDocumentType,
        updatedAt: user.official.updatedAt.toISOString(),
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Official Onboarding
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Submit Admission Details</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Complete your official profile for staff verification. Submission remains pending until reviewed.
        </p>
      </section>

      <OfficialAdmissionForm
        initialProfile={existingProfile}
        municipalities={municipalities}
        initialStep={initialStep}
      />
    </div>
  );
}
