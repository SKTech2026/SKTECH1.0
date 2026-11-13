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

function possibleAlias(name, existing, canonicalNames) {
  const canonical = key(name);
  if (canonicalNames.some((other) => key(other) !== canonical && aliasKey(other) === aliasKey(name))) {
    return undefined;
  }
  return existing.find((row) => {
    const candidate = key(row.name);
    return candidate !== canonical && aliasKey(candidate) === aliasKey(canonical);
  });
}

async function syncGeography(prisma, data, apply) {
  const counts = async () => ({
    municipalities: await prisma.municipality.count({ where: { province: "Oriental Mindoro" } }),
    barangays: await prisma.barangay.count({ where: { municipality: { province: "Oriental Mindoro" } } }),
  });
  const summary = { dryRun: !apply, targetMunicipalities: 15, targetBarangays: 426,
    before: await counts(), after: {}, municipalitiesCreated: 0, barangaysCreated: 0,
    canonicalBarangaysPresent: 0, completeLgus: 0, incompleteLgus: [],
    possibleAliases: [], conflicts: [], perLgu: [] };
  for (const lgu of data.lgus) {
    const names = [lgu.name, ...(lgu.aliases || [])];
    const matches = await prisma.municipality.findMany({
      where: { OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" } })) },
      select: { id: true, name: true, province: true },
    });
    if (matches.length > 1) {
      summary.conflicts.push({ lgu: lgu.name, reason: "Multiple city/municipality alias rows exist" });
      summary.incompleteLgus.push({ name: lgu.name, missing: lgu.barangays.length });
      summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
        present: 0, pendingInsert: 0, blocked: true });
      continue;
    }
    let municipality = matches[0];
    if (!municipality) {
      summary.municipalitiesCreated++;
      if (apply) municipality = await prisma.municipality.create({
        data: { name: lgu.name, province: "Oriental Mindoro" }, select: { id: true, name: true, province: true },
      });
    } else if (municipality.province !== "Oriental Mindoro") {
      summary.conflicts.push({ lgu: lgu.name, reason: "Existing alias belongs to another province" });
      summary.incompleteLgus.push({ name: lgu.name, missing: lgu.barangays.length });
      summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
        present: 0, pendingInsert: 0, blocked: true });
      continue;
    }
    const existing = municipality ? await prisma.barangay.findMany({
      where: { municipalityId: municipality.id }, select: { name: true },
    }) : [];
    const existingNames = new Set(existing.map((row) => key(row.name)));
    const missing = lgu.barangays.filter((name) => !existingNames.has(key(name)) &&
      !possibleAlias(name, existing, lgu.barangays));
    for (const name of lgu.barangays) {
      if (existingNames.has(key(name))) continue;
      const alias = possibleAlias(name, existing, lgu.barangays);
      if (alias) summary.possibleAliases.push({ lgu: lgu.name, requested: name, existing: alias.name });
    }
    summary.barangaysCreated += missing.length;
    if (apply && missing.length) await prisma.barangay.createMany({
      data: missing.map((name) => ({ name, municipalityId: municipality.id })), skipDuplicates: true,
    });
    const finalRows = apply ? await prisma.barangay.findMany({
      where: { municipalityId: municipality.id }, select: { name: true },
    }) : existing;
    const finalNames = new Set(finalRows.map((row) => key(row.name)));
    const stillMissing = lgu.barangays.filter((name) => !finalNames.has(key(name)));
    summary.canonicalBarangaysPresent += lgu.barangays.length - stillMissing.length;
    summary.perLgu.push({ name: lgu.name, expected: lgu.barangays.length,
      present: lgu.barangays.length - stillMissing.length, pendingInsert: missing.length });
    if (stillMissing.length === 0) summary.completeLgus++;
    else summary.incompleteLgus.push({ name: lgu.name, missing: stillMissing.length });
  }
  summary.after = apply ? await counts() : {
    municipalities: summary.before.municipalities + summary.municipalitiesCreated,
    barangays: summary.before.barangays + summary.barangaysCreated,
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
