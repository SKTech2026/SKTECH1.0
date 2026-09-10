import type { PrismaClient } from "@prisma/client";

import {
  ORIENTAL_MINDORO_LOCATIONS,
  getOrientalMindoroBarangayCount,
  getOrientalMindoroLgus,
  normalizeLocationName,
} from "@/data/oriental-mindoro-locations";
import { prisma } from "@/lib/db";

type LocationStore = Pick<
  PrismaClient,
  "municipality" | "barangay"
>;

type LocationPrismaClient = LocationStore & Pick<PrismaClient, "$transaction">;

export type OrientalMindoroSyncSummary = {
  dryRun: boolean;
  target: {
    lguCount: number;
    barangayCount: number;
  };
  before: {
    municipalityCount: number;
    barangayCount: number;
  };
  after: {
    municipalityCount: number;
    barangayCount: number;
  };
  municipalitiesCreated: string[];
  municipalitiesUpdated: string[];
  barangaysCreated: Array<{
    municipality: string;
    barangay: string;
  }>;
  barangaysExisting: number;
  conflicts: string[];
  warnings: string[];
};

type SyncOptions = {
  dryRun?: boolean;
  client?: LocationPrismaClient;
};

type ExistingMunicipality = {
  id: string;
  name: string;
  province: string;
};

const province = ORIENTAL_MINDORO_LOCATIONS.metadata.name;

const findExistingMunicipalities = async (
  client: LocationStore,
  names: string[],
) => {
  const normalizedNames = names.map(normalizeLocationName);
  const candidates = await client.municipality.findMany({
    where: {
      OR: names.map((name) => ({
        name: {
          equals: name,
          mode: "insensitive" as const,
        },
      })),
    },
    select: {
      id: true,
      name: true,
      province: true,
    },
  });

  return candidates.filter((candidate) =>
    normalizedNames.includes(normalizeLocationName(candidate.name)),
  );
};

const findExistingBarangay = (
  client: LocationStore,
  municipalityId: string,
  barangayName: string,
) =>
  client.barangay.findFirst({
    where: {
      municipalityId,
      name: {
        equals: barangayName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

const countLocations = async (client: LocationStore) => {
  const [municipalityCount, barangayCount] = await Promise.all([
    client.municipality.count(),
    client.barangay.count(),
  ]);

  return {
    municipalityCount,
    barangayCount,
  };
};

export async function syncOrientalMindoroLocations(options: SyncOptions = {}) {
  const dryRun = options.dryRun ?? true;
  const client = options.client ?? prisma;
  const before = await countLocations(client);
  const summary: OrientalMindoroSyncSummary = {
    dryRun,
    target: {
      lguCount: ORIENTAL_MINDORO_LOCATIONS.lgus.length,
      barangayCount: getOrientalMindoroBarangayCount(),
    },
    before,
    after: before,
    municipalitiesCreated: [],
    municipalitiesUpdated: [],
    barangaysCreated: [],
    barangaysExisting: 0,
    conflicts: [],
    warnings: [],
  };

  const syncWithClient = async (tx: LocationStore) => {
    for (const lgu of getOrientalMindoroLgus()) {
      const lookupNames = [lgu.name, ...(lgu.aliases ?? [])];
      const existingMunicipalities = await findExistingMunicipalities(tx, lookupNames);
      const canonicalExisting = existingMunicipalities.find(
        (municipality) => normalizeLocationName(municipality.name) === normalizeLocationName(lgu.name),
      );
      const aliasExisting = existingMunicipalities.find(
        (municipality) => normalizeLocationName(municipality.name) !== normalizeLocationName(lgu.name),
      );

      if (canonicalExisting && aliasExisting) {
        summary.conflicts.push(
          `${lgu.name} has both canonical and alias rows (${canonicalExisting.name}, ${aliasExisting.name}); no merge attempted.`,
        );
      }

      let municipality: ExistingMunicipality | null = canonicalExisting ?? aliasExisting ?? null;

      if (!municipality) {
        summary.municipalitiesCreated.push(lgu.name);
        if (!dryRun) {
          municipality = await tx.municipality.create({
            data: {
              name: lgu.name,
              province,
            },
            select: {
              id: true,
              name: true,
              province: true,
            },
          });
        }
      } else if (
        municipality.province !== province ||
        normalizeLocationName(municipality.name) !== normalizeLocationName(lgu.name)
      ) {
        const canRenameAlias =
          aliasExisting?.id === municipality.id && !canonicalExisting && normalizeLocationName(lgu.name) !== normalizeLocationName(municipality.name);

        if (canRenameAlias || municipality.province !== province) {
          summary.municipalitiesUpdated.push(`${municipality.name} -> ${lgu.name}`);
          if (!dryRun) {
            municipality = await tx.municipality.update({
              where: { id: municipality.id },
              data: {
                province,
                ...(canRenameAlias ? { name: lgu.name } : {}),
              },
              select: {
                id: true,
                name: true,
                province: true,
              },
            });
          }
        }
      }

      if (!municipality) {
        summary.warnings.push(`Skipped barangays for ${lgu.name} during dry run because the LGU would be created.`);
        for (const barangay of lgu.barangays) {
          summary.barangaysCreated.push({ municipality: lgu.name, barangay });
        }
        continue;
      }

      for (const barangay of lgu.barangays) {
        const existingBarangay = await findExistingBarangay(tx, municipality.id, barangay);
        if (existingBarangay) {
          summary.barangaysExisting += 1;
          continue;
        }

        summary.barangaysCreated.push({
          municipality: lgu.name,
          barangay,
        });

        if (!dryRun) {
          await tx.barangay.create({
            data: {
              municipalityId: municipality.id,
              name: barangay,
            },
          });
        }
      }
    }
  };

  if (dryRun) {
    await syncWithClient(client);
    summary.after = {
      municipalityCount: before.municipalityCount + summary.municipalitiesCreated.length,
      barangayCount: before.barangayCount + summary.barangaysCreated.length,
    };
    return summary;
  }

  await client.$transaction(async (tx) => {
    await syncWithClient(tx);
  });

  summary.after = await countLocations(client);
  return summary;
}
