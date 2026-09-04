import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";
import IdProductionClient from "./id-production-client";

export const dynamic = "force-dynamic";

export default async function AdminIdProductionPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);

  const [officials, municipalities] = await Promise.all([
    prisma.sKOfficial.findMany({
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        role: true,
        position: true,
        status: true,
        admissionStatus: true,
        municipalityId: true,
        municipality: true,
        barangayId: true,
        barangay: true,
        sitio: true,
        skFederationOfficer: true,
        skFederationPosition: true,
        dateElected: true,
        termStart: true,
        user: {
          select: {
            status: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 120,
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Identity Services
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Digital ID Production</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Issue and review official digital identity cards for approved SK members.
        </p>
      </section>

      <IdProductionClient
        officials={officials.map((official) => ({
          id: official.id,
          firstName: official.firstName,
          middleName: official.middleName,
          lastName: official.lastName,
          suffix: official.suffix,
          role: official.role,
          position: official.position,
          status: official.status,
          admissionStatus: official.admissionStatus,
          municipalityId: official.municipalityId,
          municipality: official.municipality,
          barangayId: official.barangayId,
          barangay: official.barangay,
          sitio: official.sitio,
          skFederationOfficer: official.skFederationOfficer,
          skFederationPosition: official.skFederationPosition,
          dateElected: official.dateElected?.toISOString() ?? official.termStart.toISOString(),
          userStatus: official.user?.status ?? null,
          photoUrl: official.user?.image ?? null,
        }))}
        municipalities={municipalities}
      />
    </div>
  );
}
