import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { loadData, validateTarget } = require("../prisma/seed-geography-only.js");

test("validated geography contains Calapan and all 426 barangays", () => {
  const data = loadData();
  assert.equal(data.lgus.length, 15);
  assert.equal(data.lgus.reduce((count, lgu) => count + lgu.barangays.length, 0), 426);
  assert.equal(data.lgus.find((lgu) => lgu.name === "City of Calapan").barangays.length, 62);
});

test("geography importer refuses non Railway targets", () => {
  assert.throws(() => validateTarget("postgresql://user:secret@db.supabase.co/postgres"));
  assert.throws(() => validateTarget("postgresql://user:secret@localhost/railway"));
  assert.equal(validateTarget("postgresql://user:secret@fresh.proxy.rlwy.net/railway"),
    "postgresql://user:secret@fresh.proxy.rlwy.net/railway");
});
