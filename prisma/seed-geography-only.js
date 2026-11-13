/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function loadData() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/data/oriental-mindoro-dropdowns.json"), "utf8"));
  const expectedLgus = new Set(["Baco", "Bansud", "Bongabong", "Bulalacao", "City of Calapan",
    "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas",
    "San Teodoro", "Socorro", "Victoria"]);
  if (data.province !== "Oriental Mindoro" || data.totalLGUs !== 15 ||
      data.totalBarangays !== 426 || !Array.isArray(data.lgus) || data.lgus.length !== 15 ||
      data.lgus.filter((lgu) => lgu.type === "city").length !== 1 ||
      data.lgus.filter((lgu) => lgu.type === "municipality").length !== 14 ||
      data.lgus.reduce((total, lgu) => total + lgu.barangays.length, 0) !== 426 ||
      new Set(data.lgus.map((lgu) => key(lgu.name))).size !== 15 ||
      data.lgus.some((lgu) => !expectedLgus.has(lgu.name)) ||
      data.lgus.some((lgu) => lgu.barangayCount !== lgu.barangays.length ||
        new Set(lgu.barangays.map(key)).size !== lgu.barangays.length)) {
    throw new Error("Invalid geography dataset.");
  }
  data.lgus = data.lgus.map((lgu) => ({ ...lgu,
    aliases: lgu.name === "City of Calapan" ? ["Calapan City"] : [] }));
  return data;
}

function validateTarget(raw, env = process.env) {
  if (!raw) throw new Error("RAILWAY_FRESH_DATABASE_URL is required.");
  const url = new URL(raw);
  const expectedHost = env.RAILWAY_FRESH_DATABASE_HOST?.trim().toLowerCase();
  if (!/^(postgres|postgresql):$/.test(url.protocol) ||
      !/^[a-z0-9-]+\.proxy\.rlwy\.net$/i.test(url.hostname) ||
      !expectedHost || url.hostname.toLowerCase() !== expectedHost ||
      env.RAILWAY_ENVIRONMENT_NAME !== "sktech-fresh" ||
      !/^\/[a-zA-Z0-9_-]{1,63}$/.test(url.pathname) || /supabase/i.test(raw)) {
    throw new Error("Not a fresh Railway PostgreSQL proxy target.");
  }
  return raw;
}

function key(name) {
  return name.normalize("NFC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function aliasKey(name) {
  return key(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\bsta\.?(?=\s|$)/g, "santa").replace(/\bsto\.?(?=\s|$)/g, "santo")
    .replace(/^(villa|barangay) /, "").replace(/[^a-z0-9]/g, "");
}

function classifyBarangays(lgu, existing) {
  const exactMatches = [];
  const aliasMatches = [];
  const missingCanonicalNames = [];
  const blockedCanonicalNames = [];
  const matchedRows = new Set();

  for (const name of lgu.barangays) {
    const exact = existing.filter((row) => key(row.name) === key(name));
    if (exact.length === 1) {
      exactMatches.push({ canonical: name, existing: exact[0].name });
      matchedRows.add(exact[0]);
      continue;
    }
    if (exact.length > 1) {
      blockedCanonicalNames.push(name);
      continue;
    }

    const hasCanonicalAliasCollision = lgu.barangays.some((other) =>
      key(other) !== key(name) && aliasKey(other) === aliasKey(name));
    const aliases = hasCanonicalAliasCollision ? [] : existing.filter((row) => aliasKey(row.name) === aliasKey(name));
    if (aliases.length === 1) {
      aliasMatches.push({ canonical: name, existing: aliases[0].name });
      matchedRows.add(aliases[0]);
    } else if (aliases.length > 1) {
      blockedCanonicalNames.push(name);
    } else {
      missingCanonicalNames.push(name);
    }
  }

  return {
    exactMatches,
    aliasMatches,
    missingCanonicalNames,
    blockedCanonicalNames,
    legacyOnlyRecords: existing.filter((row) => !matchedRows.has(row)).map((row) => row.name),
  };
}

async function syncGeography(prisma, data, apply) {
  const counts = async () => ({
    municipalities: await prisma.municipality.count({ where: { province: "Oriental Mindoro" } }),
    barangays: await prisma.barangay.count({ where: { municipality: { province: "Oriental Mindoro" } } }),
  });
  const summary = { dryRun: !apply, targetMunicipalities: 15, targetBarangays: 426,
    before: await counts(), after: {}, municipalitiesToCreate: 0, municipalitiesCreated: 0,
    barangaysToCreate: 0, barangaysCreated: 0,
    canonicalExactMatches: 0, canonicalAliasMatches: 0, canonicalBarangaysPresent: 0,
    canonicalBarangaysMissing: 0, canonicalBarangaysBlocked: 0, legacyOnlyBarangays: 0,
    exactMatchesByLgu: [], aliasMatches: [], missingCanonicalNames: [],
    blockedCanonicalNames: [], legacyOnlyRecords: [], completeLgus: 0,
    incompleteLgus: [], conflicts: [], perLgu: [] };
  for (const lgu of data.lgus) {
    const names = [lgu.name, ...(lgu.aliases || [])];
    const matches = await prisma.municipality.findMany({
      where: { OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" } })) },
      select: { id: true, name: true, province: true },
    });
    if (matches.length > 1) {
      summary.conflicts.push({ lgu: lgu.name, reason: "Multiple city/municipality alias rows exist" });
      summary.canonicalBarangaysBlocked += lgu.barangays.length;
      summary.blockedCanonicalNames.push(...lgu.barangays.map((name) => ({ lgu: lgu.name, name })));
      summary.incompleteLgus.push({ name: lgu.name, missing: 0, blocked: lgu.barangays.length });
      summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
        exactMatches: 0, aliasMatches: 0, present: 0, missingCanonical: 0,
        blockedCanonical: lgu.barangays.length, legacyOnly: 0, pendingInsert: 0 });
      continue;
    }
    let municipality = matches[0];
    if (!municipality) {
      summary.municipalitiesToCreate++;
      if (apply) {
        municipality = await prisma.municipality.create({
          data: { name: lgu.name, province: "Oriental Mindoro" }, select: { id: true, name: true, province: true },
        });
        summary.municipalitiesCreated++;
      }
    } else if (municipality.province !== "Oriental Mindoro") {
      summary.conflicts.push({ lgu: lgu.name, reason: "Existing alias belongs to another province" });
      summary.canonicalBarangaysBlocked += lgu.barangays.length;
      summary.blockedCanonicalNames.push(...lgu.barangays.map((name) => ({ lgu: lgu.name, name })));
      summary.incompleteLgus.push({ name: lgu.name, missing: 0, blocked: lgu.barangays.length });
      summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
        exactMatches: 0, aliasMatches: 0, present: 0, missingCanonical: 0,
        blockedCanonical: lgu.barangays.length, legacyOnly: 0, pendingInsert: 0 });
      continue;
    }
    const existing = municipality ? await prisma.barangay.findMany({
      where: { municipalityId: municipality.id }, select: { name: true },
    }) : [];
    const initialClassification = classifyBarangays(lgu, existing);
    for (const name of initialClassification.blockedCanonicalNames) {
      summary.conflicts.push({ lgu: lgu.name, requested: name, reason: "Multiple existing barangay records match this canonical name" });
    }
    const missing = initialClassification.missingCanonicalNames;
    summary.barangaysToCreate += missing.length;
    if (apply && missing.length) {
      const created = await prisma.barangay.createMany({
        data: missing.map((name) => ({ name, municipalityId: municipality.id })), skipDuplicates: true,
      });
      summary.barangaysCreated += created.count;
    }
    const finalRows = apply ? await prisma.barangay.findMany({
      where: { municipalityId: municipality.id }, select: { name: true },
    }) : existing;
    const classification = classifyBarangays(lgu, finalRows);
    const present = classification.exactMatches.length + classification.aliasMatches.length;
    summary.canonicalExactMatches += classification.exactMatches.length;
    summary.canonicalAliasMatches += classification.aliasMatches.length;
    summary.canonicalBarangaysPresent += present;
    summary.canonicalBarangaysMissing += classification.missingCanonicalNames.length;
    summary.canonicalBarangaysBlocked += classification.blockedCanonicalNames.length;
    summary.legacyOnlyBarangays += classification.legacyOnlyRecords.length;
    summary.exactMatchesByLgu.push({ name: lgu.name, count: classification.exactMatches.length });
    summary.aliasMatches.push(...classification.aliasMatches.map((match) => ({
      lgu: lgu.name, requested: match.canonical, existing: match.existing,
    })));
    summary.missingCanonicalNames.push(...classification.missingCanonicalNames.map((name) => ({ lgu: lgu.name, name })));
    summary.blockedCanonicalNames.push(...classification.blockedCanonicalNames.map((name) => ({ lgu: lgu.name, name })));
    summary.legacyOnlyRecords.push(...classification.legacyOnlyRecords.map((name) => ({ lgu: lgu.name, name })));
    summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
      exactMatches: classification.exactMatches.length, aliasMatches: classification.aliasMatches.length,
      present, missingCanonical: classification.missingCanonicalNames.length,
      blockedCanonical: classification.blockedCanonicalNames.length,
      legacyOnly: classification.legacyOnlyRecords.length, barangaysToCreate: missing.length });
    if (classification.missingCanonicalNames.length === 0 && classification.blockedCanonicalNames.length === 0) {
      summary.completeLgus++;
    } else {
      summary.incompleteLgus.push({ name: lgu.name,
        missing: classification.missingCanonicalNames.length,
        blocked: classification.blockedCanonicalNames.length });
    }
  }
  summary.after = apply ? await counts() : {
    municipalities: summary.before.municipalities + summary.municipalitiesToCreate,
    barangays: summary.before.barangays + summary.barangaysToCreate,
  };
  if (apply && summary.conflicts.length) throw new Error("Geography conflicts require review before applying.");
  return summary;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const url = validateTarget(process.env.RAILWAY_FRESH_DATABASE_URL);
  const data = loadData();
  const { PrismaClient } = require("@prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const summary = apply
      ? await prisma.$transaction((tx) => syncGeography(tx, data, true), { timeout: 30000 })
      : await syncGeography(prisma, data, false);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error("Geography import failed. Check target and dataset; connection details are suppressed.");
    process.exitCode = 1;
  });
}

module.exports = { loadData, validateTarget, syncGeography };
