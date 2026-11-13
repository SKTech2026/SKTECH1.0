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
  assert.equal(preview.barangaysToCreate, 62);
  assert.equal(preview.barangaysCreated, 0);
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
  assert.equal(preview.barangaysToCreate, 426);
  assert.equal(preview.barangaysCreated, 0);
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
  assert.deepEqual(preview.aliasMatches, [
    { lgu: "Naujan", requested: "Magsaysay", existing: "Villa Magsaysay" },
  ]);
  assert.equal(preview.barangaysCreated, 0);
  await syncGeography(store, data, true);
  assert.equal(barangays.length, 1);
});

test("reported 264-row geography imports to 456 rows with 426 canonical options", async () => {
  const data = loadData();
  const aliasNames = new Map([
    ["Baco|Lumang Bayan", "Lumangbayan"],
    ["Pinamalayan|Sta. Isabel", "Santa Isabel"],
    ["Pinamalayan|Sta. Maria", "Santa Maria"],
    ["Pinamalayan|Sta. Rita", "Santa Rita"],
    ["Pinamalayan|Sto. Niño", "Santo Nino"],
  ]);
  const municipalities = data.lgus.map((lgu, index) => ({
    id: `municipality-${index}`, name: lgu.name, province: "Oriental Mindoro",
  }));
  const barangays = [];
  let exactCount = 0;
  for (const [lguIndex, lgu] of data.lgus.entries()) {
    for (const name of lgu.barangays) {
      const alias = aliasNames.get(`${lgu.name}|${name}`);
      if (alias) {
        barangays.push({ id: `alias-${barangays.length}`, municipalityId: municipalities[lguIndex].id, name: alias });
      } else if (exactCount < 229) {
        barangays.push({ id: `exact-${barangays.length}`, municipalityId: municipalities[lguIndex].id, name });
        exactCount++;
      }
    }
  }
  for (let index = 0; index < 30; index++) {
    barangays.push({ id: `legacy-${index}`, municipalityId: municipalities[0].id, name: `Legacy Barangay ${index + 1}` });
  }
  assert.equal(exactCount, 229);
  const originalAliasIds = new Map(barangays.filter((row) => row.id.startsWith("alias-"))
    .map((row) => [row.name, row.id]));
  const store = {
    municipality: {
      count: async () => municipalities.length,
      findMany: async ({ where }) => municipalities.filter((row) =>
        where.OR.some(({ name }) => row.name.toLowerCase() === name.equals.toLowerCase())),
      create: async ({ data: row }) => {
        const created = { ...row, id: `municipality-${municipalities.length}` };
        municipalities.push(created);
        return created;
      },
    },
    barangay: {
      count: async () => barangays.length,
      findMany: async ({ where }) => barangays.filter((row) => row.municipalityId === where.municipalityId),
      createMany: async ({ data: rows }) => {
        barangays.push(...rows.map((row, index) => ({ ...row, id: `inserted-${barangays.length + index}` })));
        return { count: rows.length };
      },
    },
  };

  const preview = await syncGeography(store, data, false);
  assert.equal(preview.before.municipalities, 15);
  assert.equal(preview.before.barangays, 264);
  assert.equal(preview.canonicalExactMatches, 229);
  assert.equal(preview.canonicalAliasMatches, 5);
  assert.equal(preview.canonicalBarangaysPresent, 234);
  assert.equal(preview.canonicalBarangaysMissing, 192);
  assert.equal(preview.canonicalBarangaysBlocked, 0);
  assert.equal(preview.legacyOnlyBarangays, 30);
  assert.equal(preview.barangaysToCreate, 192);
  assert.equal(preview.barangaysCreated, 0);
  assert.equal(preview.after.barangays, 456);
  assert.equal(preview.canonicalExactMatches + preview.canonicalAliasMatches +
    preview.canonicalBarangaysMissing + preview.canonicalBarangaysBlocked, 426);
  assert.equal(preview.before.barangays, preview.canonicalExactMatches +
    preview.canonicalAliasMatches + preview.legacyOnlyBarangays);
  assert.equal(preview.after.barangays, 426 + preview.legacyOnlyBarangays);
  assert.deepEqual(preview.aliasMatches, [
    { lgu: "Baco", requested: "Lumang Bayan", existing: "Lumangbayan" },
    { lgu: "Pinamalayan", requested: "Sta. Isabel", existing: "Santa Isabel" },
    { lgu: "Pinamalayan", requested: "Sta. Maria", existing: "Santa Maria" },
    { lgu: "Pinamalayan", requested: "Sta. Rita", existing: "Santa Rita" },
    { lgu: "Pinamalayan", requested: "Sto. Niño", existing: "Santo Nino" },
  ]);
  assert.equal(preview.missingCanonicalNames.length, 192);
  assert.equal(preview.legacyOnlyRecords.length, 30);

  const applied = await syncGeography(store, data, true);
  assert.equal(applied.barangaysToCreate, 192);
  assert.equal(applied.barangaysCreated, 192);
  assert.equal(applied.after.barangays, 456);
  assert.equal(applied.canonicalExactMatches, 421);
  assert.equal(applied.canonicalAliasMatches, 5);
  assert.equal(applied.canonicalBarangaysPresent, 426);
  assert.equal(applied.canonicalBarangaysMissing, 0);
  assert.equal(applied.legacyOnlyBarangays, 30);
  assert.equal(applied.completeLgus, 15);
  assert.deepEqual(applied.incompleteLgus, []);
  for (const [name, id] of originalAliasIds) {
    assert.equal(barangays.find((row) => row.id === id).name, name);
  }
  const bansudBarangays = barangays.filter((row) => row.municipalityId === municipalities[1].id);
  assert.ok(bansudBarangays.some((row) => row.name === "Pag-Asa"));
  assert.ok(bansudBarangays.some((row) => row.name === "Villa Pag-Asa"));

  const source = readFileSync(new URL("../src/lib/locations/canonical-options.ts", import.meta.url), "utf8")
    .replace('import { ORIENTAL_MINDORO_LOCATIONS } from "@/data/oriental-mindoro-locations";',
      "const ORIENTAL_MINDORO_LOCATIONS = globalThis.__data;");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  runInNewContext(code, { exports, __data: data });
  const storedRows = municipalities.map((municipality) => ({
    ...municipality,
    barangays: barangays.filter((row) => row.municipalityId === municipality.id),
  }));
  const options = exports.canonicalLocationOptions(storedRows);
  const optionsBarangays = options.flatMap((lgu) => lgu.barangays);
  assert.equal(options.length, 15);
  assert.equal(optionsBarangays.length, 426);
  assert.equal(new Set(optionsBarangays.map((row) => row.id)).size, 426);
  assert.equal(optionsBarangays.filter((row) => row.legacy).length, 0);
  for (const [name, id] of originalAliasIds) {
    const canonicalName = [...aliasNames.entries()].find(([, alias]) => alias === name)?.[0].split("|")[1];
    const lguName = [...aliasNames.entries()].find(([, alias]) => alias === name)?.[0].split("|")[0];
    assert.equal(options.find((lgu) => lgu.name === lguName).barangays.find((row) => row.name === canonicalName).id, id);
  }

  const repeated = await syncGeography(store, data, true);
  assert.equal(repeated.barangaysCreated, 0);
  assert.equal(repeated.after.barangays, 456);
  assert.equal(repeated.canonicalExactMatches, 421);
  assert.equal(repeated.canonicalAliasMatches, 5);
  assert.equal(repeated.canonicalBarangaysPresent, 426);
  assert.equal(repeated.canonicalBarangaysMissing, 0);
  assert.equal(repeated.legacyOnlyBarangays, 30);
});

test("distinct Pag-Asa and Villa Pag-Asa remain separate Bansud choices", async () => {
  const row = { id: "bansud", name: "Bansud", province: "Oriental Mindoro" };
  const barangays = [{ municipalityId: row.id, id: "one", name: "Pag-Asa" }];
  const store = {
    municipality: { count: async () => 1, findMany: async () => [row] },
    barangay: {
      count: async () => barangays.length,
      findMany: async () => barangays,
      createMany: async ({ data }) => { barangays.push(...data); return { count: data.length }; },
    },
  };
  const data = { lgus: [{ name: "Bansud", barangays: ["Pag-Asa", "Villa Pag-Asa"] }] };
  const preview = await syncGeography(store, data, false);
  assert.equal(preview.barangaysToCreate, 1);
  assert.equal(preview.barangaysCreated, 0);
  assert.deepEqual(preview.aliasMatches, []);
});

test("canonical dropdown projection excludes legacy rows and retains saved legacy labels", () => {
  const source = readFileSync(new URL("../src/lib/locations/canonical-options.ts", import.meta.url), "utf8")
    .replace('import { ORIENTAL_MINDORO_LOCATIONS } from "@/data/oriental-mindoro-locations";',
      "const ORIENTAL_MINDORO_LOCATIONS = globalThis.__data;");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const data = loadData();
  runInNewContext(code, { exports, __data: data });
  const rows = data.lgus.map((lgu, index) => ({
    id: String(index), name: lgu.name === "City of Calapan" ? "Calapan City" : lgu.name,
    province: "Oriental Mindoro",
    barangays: lgu.barangays.map((name, i) => ({ id: `${index}-${i}`, name })),
  }));
  const naujan = rows.find((row) => row.name === "Naujan");
  naujan.barangays.push({ id: "legacy", name: "Villa Magsaysay" });
  const options = exports.canonicalLocationOptions(rows);
  assert.equal(options.length, 15);
  assert.equal(options.reduce((total, lgu) => total + lgu.barangays.length, 0), 426);
  assert.equal(options.find((lgu) => lgu.name === "Naujan").barangays.length, 70);
  assert.equal(options.find((lgu) => lgu.name === "City of Calapan").barangays.length, 62);
  assert.equal(options.find((lgu) => lgu.name === "Naujan").barangays.some((b) => b.id === "legacy"), false);
  const saved = exports.canonicalLocationOptions(rows, { municipalityId: naujan.id, barangayId: "legacy" });
  assert.equal(saved.find((lgu) => lgu.name === "Naujan").barangays.find((b) => b.id === "legacy").legacy, true);
});

test("canonical dropdowns show missing names as unavailable without inventing database IDs", () => {
  const source = readFileSync(new URL("../src/lib/locations/canonical-options.ts", import.meta.url), "utf8")
    .replace('import { ORIENTAL_MINDORO_LOCATIONS } from "@/data/oriental-mindoro-locations";',
      "const ORIENTAL_MINDORO_LOCATIONS = globalThis.__data;");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const data = loadData();
  runInNewContext(code, { exports, __data: data });
  const rows = data.lgus.map((lgu, index) => ({
    id: String(index), name: lgu.name, province: "Oriental Mindoro",
    barangays: lgu.barangays.map((name, barangayIndex) => ({ id: `${index}-${barangayIndex}`, name })),
  }));
  const naujan = rows.find((row) => row.name === "Naujan");
  naujan.barangays.pop();
  const calapan = rows.find((row) => row.name === "City of Calapan");
  calapan.barangays.splice(0, 2);
  const bansud = rows.find((row) => row.name === "Bansud");
  bansud.barangays = bansud.barangays.filter((barangay) => barangay.name === "Pag-Asa");

  const options = exports.canonicalLocationOptions(rows);
  const naujanOptions = options.find((lgu) => lgu.name === "Naujan").barangays;
  const calapanOptions = options.find((lgu) => lgu.name === "City of Calapan").barangays;
  const bansudOptions = options.find((lgu) => lgu.name === "Bansud").barangays;
  assert.equal(naujanOptions.length, 70);
  assert.equal(calapanOptions.length, 62);
  assert.equal(naujanOptions.filter((option) => option.unavailable).length, 1);
  assert.ok(calapanOptions.some((option) => option.unavailable));
  assert.equal(bansudOptions.length, 13);
  assert.equal(bansudOptions.filter((option) => option.name === "Pag-Asa").length, 1);
  assert.equal(bansudOptions.filter((option) => option.name.startsWith("Villa Pag-Asa")).length, 1);
  assert.ok(bansudOptions.find((option) => option.name.startsWith("Villa Pag-Asa"))?.unavailable);
  assert.ok(!naujan.barangays.some((barangay) => barangay.id === naujanOptions.at(-1).id));
});
