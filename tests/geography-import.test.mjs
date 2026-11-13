import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { loadData, validateTarget, syncGeography } = require("../prisma/seed-geography-only.js");

test("dependent barangay selection keeps valid values and clears values from other LGUs", () => {
  const source = readFileSync(new URL("../src/lib/locations/dropdown-selection.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  runInNewContext(code, { exports });
  const lgus = [
    { id: "naujan", barangays: [{ id: "n1" }, { id: "n2" }] },
    { id: "calapan", barangays: [{ id: "c1" }] },
  ];
  assert.equal(exports.validBarangaySelection("naujan", "n2", lgus), "n2");
  assert.equal(exports.validBarangaySelection("calapan", "n2", lgus), "");
  assert.equal(exports.validBarangaySelection("calapan", "c1", lgus), "c1");
});

test("validated geography contains Calapan and all 426 barangays", () => {
  const data = loadData();
  assert.equal(data.lgus.length, 15);
  assert.equal(data.lgus.reduce((count, lgu) => count + lgu.barangays.length, 0), 426);
  assert.equal(data.lgus.find((lgu) => lgu.name === "City of Calapan").barangays.length, 62);
  const expectedCounts = [27, 13, 36, 15, 62, 27, 17, 70, 37, 23, 13, 20, 8, 26, 32];
  assert.deepEqual(Array.from(data.lgus, (lgu) => lgu.barangays.length), expectedCounts);
  assert.equal(data.lgus.filter((lgu) => lgu.type === "city").length, 1);
  assert.deepEqual(data.lgus.find((lgu) => lgu.name === "City of Calapan").aliases, ["Calapan City"]);
  for (const lgu of data.lgus) {
    assert.equal(new Set(lgu.barangays.map((name) => name.normalize("NFC").toLowerCase())).size,
      lgu.barangayCount, `duplicate barangay in ${lgu.name}`);
  }
  assert.ok(data.lgus.some((lgu) => lgu.barangays.includes("Piñahan")));
  assert.ok(data.lgus.some((lgu) => lgu.barangays.includes("Santo Niño")));
});

test("Calapan City existing row is reused without creating City of Calapan", async () => {
  const rows = [{ id: "calapan", name: "Calapan City", province: "Oriental Mindoro" }];
  const barangays = [];
  const store = {
    municipality: {
      count: async () => rows.length,
      findMany: async ({ where }) => rows.filter((row) => where.OR.some(({ name }) =>
        row.name.toLowerCase() === name.equals.toLowerCase())),
      create: async () => { throw new Error("duplicate city creation"); },
    },
    barangay: {
      count: async () => barangays.length,
      findMany: async ({ where }) => barangays.filter((row) => row.municipalityId === where.municipalityId),
      createMany: async ({ data }) => { barangays.push(...data); return { count: data.length }; },
    },
  };
  const calapan = loadData().lgus.find((lgu) => lgu.name === "City of Calapan");
  const data = { lgus: [calapan] };
  const preview = await syncGeography(store, data, false);
  assert.equal(preview.municipalitiesCreated, 0);
  const applied = await syncGeography(store, data, true);
  assert.equal(rows.length, 1);
  assert.equal(applied.barangaysCreated, 62);
  assert.equal((await syncGeography(store, data, true)).barangaysCreated, 0);
});

test("duplicate Calapan alias rows block apply and appear in the dry-run report", async () => {
  const rows = [
    { id: "a", name: "Calapan City", province: "Oriental Mindoro" },
    { id: "b", name: "City of Calapan", province: "Oriental Mindoro" },
  ];
  const store = {
    municipality: {
      count: async () => rows.length,
      findMany: async () => rows,
    },
    barangay: { count: async () => 0 },
  };
  const data = { lgus: [loadData().lgus.find((lgu) => lgu.name === "City of Calapan")] };
  const preview = await syncGeography(store, data, false);
  assert.equal(preview.conflicts.length, 1);
  await assert.rejects(syncGeography(store, data, true), /conflicts require review/);
});

test("geography importer refuses non Railway targets", () => {
  const env = { RAILWAY_ENVIRONMENT_NAME: "sktech-fresh", RAILWAY_FRESH_DATABASE_HOST: "fresh.proxy.rlwy.net" };
  assert.throws(() => validateTarget("postgresql://user:secret@db.supabase.co/postgres", env));
  assert.throws(() => validateTarget("postgresql://user:secret@localhost/railway", env));
  assert.throws(() => validateTarget("postgresql://user:secret@fresh.proxy.rlwy.net/railway", { ...env, RAILWAY_ENVIRONMENT_NAME: "production" }));
  assert.throws(() => validateTarget("postgresql://user:secret@fresh.proxy.rlwy.net/railway", { ...env, RAILWAY_FRESH_DATABASE_HOST: "other.proxy.rlwy.net" }));
  assert.equal(validateTarget("postgresql://user:secret@fresh.proxy.rlwy.net/railway", env),
    "postgresql://user:secret@fresh.proxy.rlwy.net/railway");
});

test("geography sync inserts the complete reference dataset without touching users", async () => {
  const data = loadData();
  const municipalities = [];
  const barangays = [];
  const store = {
    municipality: {
      count: async () => municipalities.length,
      findMany: async ({ where }) => municipalities.filter((row) =>
        where.OR.some(({ name }) => row.name.toLowerCase() === name.equals.toLowerCase())),
      create: async ({ data: row }) => {
        const created = { ...row, id: String(municipalities.length + 1) };
        municipalities.push(created);
        return created;
      },
    },
    barangay: {
      count: async () => barangays.length,
      findMany: async ({ where }) => barangays.filter((row) => row.municipalityId === where.municipalityId),
      createMany: async ({ data: rows }) => { barangays.push(...rows); return { count: rows.length }; },
    },
  };
  const preview = await syncGeography(store, data, false);
  assert.equal(preview.barangaysCreated, 426);
  assert.equal(barangays.length, 0);
  const applied = await syncGeography(store, data, true);
  assert.equal(applied.after.municipalities, 15);
  assert.equal(applied.after.barangays, 426);
  assert.equal(applied.completeLgus, 15);
  assert.equal(applied.canonicalBarangaysPresent, 426);
  const repeated = await syncGeography(store, data, true);
  assert.equal(repeated.barangaysCreated, 0);
  assert.equal(repeated.after.barangays, 426);
});

test("Naujan spelling alias is reported and never inserted as a duplicate", async () => {
  const municipalities = [{ id: "naujan", name: "Naujan", province: "Oriental Mindoro" }];
  const barangays = [{ municipalityId: "naujan", name: "Villa Magsaysay" }];
  const store = {
    municipality: {
      count: async () => municipalities.length,
      findMany: async () => municipalities,
    },
    barangay: {
      count: async () => barangays.length,
      findMany: async () => barangays,
      createMany: async ({ data }) => { barangays.push(...data); return { count: data.length }; },
    },
  };
  const data = { lgus: [{ name: "Naujan", barangays: ["Magsaysay"] }] };
  const preview = await syncGeography(store, data, false);
  assert.deepEqual(preview.possibleAliases, [
    { lgu: "Naujan", requested: "Magsaysay", existing: "Villa Magsaysay" },
  ]);
  assert.equal(preview.barangaysCreated, 0);
  await syncGeography(store, data, true);
  assert.equal(barangays.length, 1);
});
