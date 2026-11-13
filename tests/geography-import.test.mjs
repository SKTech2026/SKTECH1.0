import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { loadData, validateTarget, syncGeography } = require("../prisma/seed-geography-only.js");

test("validated geography contains Calapan and all 426 barangays", () => {
  const data = loadData();
  assert.equal(data.lgus.length, 15);
  assert.equal(data.lgus.reduce((count, lgu) => count + lgu.barangays.length, 0), 426);
  assert.equal(data.lgus.find((lgu) => lgu.name === "City of Calapan").barangays.length, 62);
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
  const repeated = await syncGeography(store, data, true);
  assert.equal(repeated.barangaysCreated, 0);
  assert.equal(repeated.after.barangays, 426);
});
