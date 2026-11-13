import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScriptModule(source, context = {}) {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(code, { exports, ...context });
  return exports;
}

const design = loadTypeScriptModule(readFileSync(
  new URL("../src/components/id-template/provincial-id-template.ts", import.meta.url), "utf8",
));
const provincialTemplate = design.SKTECH_PROVINCIAL_ID_TEMPLATE;

test("provincial ID template is two-sided, editable, and uses supported field styles", () => {
  assert.equal(provincialTemplate.canvas.width, 856);
  assert.equal(provincialTemplate.canvas.height, 539.8);

  const allFields = [
    ...provincialTemplate.sides.front.fields,
    ...provincialTemplate.sides.back.fields,
  ];
  const ids = allFields.map((field) => field.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(provincialTemplate.sides.front.fields.length >= 20);
  assert.ok(provincialTemplate.sides.back.fields.length >= 20);
  assert.ok(allFields.some((field) => field.type === "qr" && field.sourceKey === "qrValue"));
  assert.ok(allFields.some((field) => field.id === "back-signature-line" && field.type === "shape"));

  const dynamicSources = new Set(allFields.map((field) => field.sourceKey).filter(Boolean));
  for (const key of ["fullName", "displayPosition", "municipality", "barangay", "serviceTerm", "documentId", "photoUrl", "qrValue"]) {
    assert.ok(dynamicSources.has(key), `missing dynamic source ${key}`);
  }
  for (const field of allFields) {
    assert.ok(["staticText", "text", "image", "qr", "shape"].includes(field.type));
    assert.ok(field.xPercent >= 0 && field.xPercent <= 100);
    assert.ok(field.yPercent >= 0 && field.yPercent <= 100);
    assert.ok(field.widthPercent > 0 && field.widthPercent <= 100);
    assert.ok(field.heightPercent > 0 && field.heightPercent <= 100);
    assert.ok(!field.assetId, `${field.id} should use the existing public branding source, not a missing DB asset`);
    for (const value of Object.values(field.style ?? {})) {
      if (typeof value === "string") assert.ok(!value.includes("gradient("), `${field.id} contains a save-unsupported gradient`);
    }
  }
  assert.ok(allFields.some((field) => field.type === "image" && field.sourceKey === "sktechLogoUrl"));
  assert.ok(allFields.some((field) => field.type === "image" && field.sourceKey === "skfedLogoUrl"));
  assert.ok(allFields.some((field) => field.type === "image" && field.sourceKey === "provincialSealUrl"));

  const validatorSource = readFileSync(
    new URL("../src/lib/id-template/validate-template.ts", import.meta.url), "utf8",
  ).replace('import { DEFAULT_ID_TEMPLATE } from "@/components/id-template/default-template";',
    "const DEFAULT_ID_TEMPLATE = globalThis.__fallback;");
  const validator = loadTypeScriptModule(validatorSource, { __fallback: provincialTemplate });
  const validated = validator.validateIdTemplateOrDefault(provincialTemplate);
  assert.equal(validated.sides.front.fields.length, provincialTemplate.sides.front.fields.length);
  assert.equal(validated.sides.back.fields.length, provincialTemplate.sides.back.fields.length);
});

test("provincial draft creation is inactive, stable-ID, and never overwrites an existing draft", async () => {
  const converterSource = readFileSync(
    new URL("../src/lib/id-template/default-template-to-db.ts", import.meta.url), "utf8",
  ).replace('import { IdTemplateFieldType, IdTemplateSide as DbIdTemplateSide } from "@prisma/client";',
    'const DbIdTemplateSide = { FRONT: "FRONT", BACK: "BACK" };');
  const converter = loadTypeScriptModule(converterSource);
  const helperSource = readFileSync(
    new URL("../src/lib/id-template/create-provincial-id-template-draft.ts", import.meta.url), "utf8",
  ).replace(/import\s*\{[\s\S]*?\}\s*from\s*"@\/components\/id-template\/provincial-id-template";/,
    "const { SKTECH_PROVINCIAL_ID_TEMPLATE, SKTECH_PROVINCIAL_ID_TEMPLATE_ID, SKTECH_PROVINCIAL_ID_TEMPLATE_NAME } = globalThis.__design;")
    .replace('import { extractFields } from "@/lib/id-template/default-template-to-db";',
      "const { extractFields } = globalThis.__converter;");
  const helper = loadTypeScriptModule(helperSource, { __design: design, __converter: converter });

  let stored = null;
  let createCount = 0;
  const tx = {
    idTemplate: {
      findUnique: async () => stored ? {
        id: stored.id, name: stored.name, status: stored.status, isActive: stored.isActive,
      } : null,
      findFirst: async () => null,
      create: async ({ data }) => {
        createCount++;
        stored = { id: data.id, name: data.name, status: data.status, isActive: data.isActive, data };
        return { id: stored.id, name: stored.name, status: stored.status, isActive: stored.isActive };
      },
    },
  };

  const first = await helper.createProvincialIdTemplateDraft(tx, "admin-1");
  assert.equal(first.created, true);
  assert.equal(first.id, design.SKTECH_PROVINCIAL_ID_TEMPLATE_ID);
  assert.equal(first.status, "DRAFT");
  assert.equal(first.isActive, false);
  assert.equal(stored.data.fields.create.length,
    provincialTemplate.sides.front.fields.length + provincialTemplate.sides.back.fields.length);
  assert.equal(stored.data.createdById, "admin-1");
  assert.ok(stored.data.fields.create.every((field) => field.visible === true));

  const second = await helper.createProvincialIdTemplateDraft(tx, "admin-2");
  assert.equal(second.created, false);
  assert.equal(createCount, 1);
  assert.equal(stored.data.createdById, "admin-1");

  stored.status = "ACTIVE";
  stored.isActive = true;
  await assert.rejects(helper.createProvincialIdTemplateDraft(tx, "admin-3"), /non-draft template/);
  assert.equal(createCount, 1);
});

test("field dimension clamp enforces the API minimum for existing and newly added elements", () => {
  const dimensionSource = readFileSync(
    new URL("../src/lib/id-template/field-dimensions.ts", import.meta.url), "utf8",
  );
  const dimensions = loadTypeScriptModule(dimensionSource);

  for (const belowMinimum of [0, 0.05, -2]) {
    assert.equal(dimensions.clampFieldDimensionPercent(belowMinimum, 12.5), 0.1);
  }
  assert.equal(dimensions.clampFieldDimensionPercent(Number.NaN, 12.5), 12.5);
  assert.equal(dimensions.clampFieldDimensionPercent(Number.NaN, 0.05), 0.1);
  assert.equal(dimensions.clampFieldDimensionPercent(0, 12.5), 0.1);
  assert.equal(dimensions.clampFieldDimensionPercent(0.05, 12.5), 0.1);
  assert.equal(dimensions.clampFieldDimensionPercent(101, 12.5), 100);
  assert.equal(dimensions.clampFieldDimensionPercent(17.25, 12.5), 17.25);

  for (const invalid of [0, 0.05, Number.NaN, Number.POSITIVE_INFINITY, 100.1]) {
    assert.throws(
      () => dimensions.validateFieldDimensionPercent(invalid, "name-value", "FRONT", "heightPercent"),
      /front field "name-value" heightPercent must be a finite number from 0\.1 to 100; received/,
    );
  }
  assert.throws(
    () => dimensions.validateFieldDimensionPercent(0, "local-image-new", "BACK", "heightPercent"),
    /back field "local-image-new" heightPercent .*received 0\./,
  );
});

test("valid manually edited front and back fields keep precise dimensions and styles", () => {
  const dimensionSource = readFileSync(
    new URL("../src/lib/id-template/field-dimensions.ts", import.meta.url), "utf8",
  );
  const dimensions = loadTypeScriptModule(dimensionSource);
  const manuallyEditedFields = [
    {
      id: "front-name", side: "FRONT", xPercent: 18.25, yPercent: 32.5,
      widthPercent: 68.75, heightPercent: 12.35, staticValue: "EDITED NAME",
      styleJson: { fontSize: 14, fontWeight: 700, color: "#123456" },
    },
    {
      id: "back-qr", side: "BACK", xPercent: 7.5, yPercent: 24,
      widthPercent: 31.25, heightPercent: 45.5, assetId: "qr-asset-id",
      styleJson: { imageZoom: 1.25, objectPositionX: 48, objectPositionY: 52 },
    },
    {
      id: "local-shape-new", side: "BACK", xPercent: 42, yPercent: 79,
      widthPercent: 49.5, heightPercent: 8.25, styleJson: { background: "#13579B" },
    },
  ];
  const snapshot = structuredClone(manuallyEditedFields);
  for (const field of manuallyEditedFields) {
    dimensions.validateFieldDimensionPercent(field.widthPercent, field.id, field.side, "widthPercent");
    dimensions.validateFieldDimensionPercent(field.heightPercent, field.id, field.side, "heightPercent");
  }
  assert.deepEqual(manuallyEditedFields, snapshot);
});
