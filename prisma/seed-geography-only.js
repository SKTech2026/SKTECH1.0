/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadData() {
  const source = fs.readFileSync(path.join(__dirname, "../src/data/oriental-mindoro-locations.ts"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports }, { timeout: 1000 });
  const data = exports.ORIENTAL_MINDORO_LOCATIONS;
  const validation = exports.ORIENTAL_MINDORO_LOCATION_VALIDATION;
  if (!validation.valid || validation.totals.lguCount !== 15 || validation.totals.barangayCount !== 426) {
    throw new Error("Invalid geography dataset.");
  }
  return data;
}

function validateTarget(raw) {
  if (!raw) throw new Error("RAILWAY_FRESH_DATABASE_URL is required.");
  const url = new URL(raw);
  if (!/^(postgres|postgresql):$/.test(url.protocol) ||
      !/^[a-z0-9-]+\.proxy\.rlwy\.net$/i.test(url.hostname) ||
      url.pathname !== "/railway" || /supabase/i.test(raw)) {
    throw new Error("Not a fresh Railway PostgreSQL proxy target.");
  }
  return raw;
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
  const summary = { dryRun: !apply, targetMunicipalities: 15, targetBarangays: 426,
    before: {}, after: {}, municipalitiesCreated: 0, barangaysCreated: 0 };
  try {
    const counts = async () => ({
      municipalities: await prisma.municipality.count({ where: { province: "Oriental Mindoro" } }),
      barangays: await prisma.barangay.count({ where: { municipality: { province: "Oriental Mindoro" } } }),
    });
    summary.before = await counts();
    for (const lgu of data.lgus) {
      const names = [lgu.name, ...(lgu.aliases || [])];
      const matches = await prisma.municipality.findMany({
        where: { OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" } })) },
        select: { id: true, name: true, province: true },
      });
      if (matches.length > 1) throw new Error(`Conflicting municipality aliases for ${lgu.name}.`);
      let municipality = matches[0];
      if (!municipality) {
        summary.municipalitiesCreated++;
        if (apply) municipality = await prisma.municipality.create({
          data: { name: lgu.name, province: "Oriental Mindoro" }, select: { id: true, name: true, province: true },
        });
      } else if (municipality.province !== "Oriental Mindoro") {
        throw new Error(`Existing ${lgu.name} belongs to another province.`);
      }
      const existing = municipality ? await prisma.barangay.findMany({
        where: { municipalityId: municipality.id }, select: { name: true },
      }) : [];
      const existingNames = new Set(existing.map((row) => row.name.trim().toLowerCase()));
      const missing = lgu.barangays.filter((name) => !existingNames.has(name.trim().toLowerCase()));
      summary.barangaysCreated += missing.length;
      if (apply && missing.length) await prisma.barangay.createMany({
        data: missing.map((name) => ({ name, municipalityId: municipality.id })), skipDuplicates: true,
      });
    }
    summary.after = apply ? await counts() : {
      municipalities: summary.before.municipalities + summary.municipalitiesCreated,
      barangays: summary.before.barangays + summary.barangaysCreated,
    };
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

module.exports = { loadData, validateTarget };
