import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadModule(source, context = {}) {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(code, { exports, ...context });
  return exports;
}

function toRendererTemplate(template) {
  const types = { STATIC_TEXT: "staticText", TEXT: "text", IMAGE: "image", QR: "qr", SHAPE: "shape" };
  const convert = (field) => ({
    id: field.id,
    type: types[field.type],
    ...(field.sourceKey ? { sourceKey: field.sourceKey } : {}),
    ...(field.staticValue !== null ? { value: field.staticValue } : {}),
    xPercent: field.xPercent,
    yPercent: field.yPercent,
    widthPercent: field.widthPercent,
    heightPercent: field.heightPercent,
    zIndex: field.zIndex,
    visible: field.visible,
    ...(field.fit ? { fit: field.fit } : {}),
    ...(field.radius !== null ? { radius: `${field.radius}rem` } : {}),
    ...(field.styleJson ? { style: field.styleJson } : {}),
  });
  return {
    version: template.version,
    canvas: { width: template.canvasWidth, height: template.canvasHeight },
    sides: {
      front: { fields: template.fields.filter((field) => field.side === "FRONT").map(convert) },
      back: { fields: template.fields.filter((field) => field.side === "BACK").map(convert) },
    },
  };
}

const activationSource = readFileSync(
  new URL("../src/lib/id-template/template-activation.ts", import.meta.url), "utf8",
)
  .replace('import "server-only";', "")
  .replace(/import\s*\{[^}]*\}\s*from\s*"@\/lib\/id-template\/db-to-renderer-converter";/, "")
  .replace(/import\s*\{[^}]*\}\s*from\s*"@\/lib\/id-template\/validate-template";/, "")
  .replace('import { validateFieldDimensionPercent } from "@/lib/id-template/field-dimensions";', "")
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*"@\/lib\/id-template\/id-template-asset-storage";/,
    "const { downloadIdTemplateImageAsset, isIdTemplateAssetObjectPath, resolveIdTemplateAssetMimeType } = globalThis.__deps;")
  .replace('import { hasFileSignature } from "@/lib/file-signatures";',
    "const { hasFileSignature } = globalThis.__deps;")
  .replace("!isAllowedTemplateSourceKey(field.sourceKey)", "!globalThis.__deps.isAllowedTemplateSourceKey(field.sourceKey)")
  .replace("const converted = convertDbTemplateToRendererTemplate(template);", "const converted = globalThis.__deps.convertDbTemplateToRendererTemplate(template);")
  .replace("const validated = validateIdTemplateOrDefault(converted);", "const validated = globalThis.__deps.validateIdTemplateOrDefault(converted);");
const activation = loadModule(activationSource, {
  __deps: {
    convertDbTemplateToRendererTemplate: toRendererTemplate,
    validateIdTemplateOrDefault: (template) => template,
    isAllowedTemplateSourceKey: (key) => !key || new Set([
      "fullName", "qrValue", "photoUrl", "provincialSealUrl", "skfedLogoUrl", "sktechLogoUrl",
    ]).has(key),
    downloadIdTemplateImageAsset: async () => new Blob(["mock"]),
    isIdTemplateAssetObjectPath: () => true,
    resolveIdTemplateAssetMimeType: () => "image/png",
    hasFileSignature: () => true,
  },
  validateFieldDimensionPercent: (value, fieldId, side, dimension) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0.1 || value > 100) {
      throw new Error(`${side.toLowerCase()} field "${fieldId}" ${dimension} must be a finite number from 0.1 to 100; received ${String(value)}.`);
    }
    return value;
  },
  Error,
});

const templateUpdatedAt = "2026-11-13T10:00:00.000Z";

function makeField(id, side, type, extras = {}) {
  return {
    id,
    templateId: "draft-id",
    side,
    type,
    assetId: null,
    asset: null,
    sourceKey: null,
    staticValue: type === "STATIC_TEXT" ? "Test" : null,
    label: null,
    xPercent: 5,
    yPercent: 5,
    widthPercent: 20,
    heightPercent: 10,
    zIndex: 1,
    fit: null,
    radius: null,
    styleJson: null,
    visible: true,
    createdAt: new Date(templateUpdatedAt),
    updatedAt: new Date(templateUpdatedAt),
    ...extras,
  };
}

function makeTemplate({ id, name, status, isActive, updatedAt = templateUpdatedAt, fields } = {}) {
  return {
    id: id ?? "draft-id",
    name: name ?? "Editable ID Draft",
    description: null,
    status: status ?? "DRAFT",
    isActive: isActive ?? false,
    version: 2,
    canvasWidth: 856,
    canvasHeight: 539.8,
    createdById: "admin-1",
    updatedById: "admin-1",
    archivedAt: null,
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    updatedAt: new Date(updatedAt),
    fields: fields ?? [
      makeField("front-title", "FRONT", "STATIC_TEXT"),
      makeField("back-qr", "BACK", "QR", { staticValue: null, sourceKey: "qrValue" }),
    ],
    assets: [],
  };
}

function makeTransaction(rows) {
  let lockCalls = 0;
  let updateCalls = 0;
  const clone = (value) => structuredClone(value);
  const tx = {
    $queryRaw: async () => { lockCalls++; return []; },
    idTemplate: {
      findUnique: async ({ where }) => clone(rows.find((row) => row.id === where.id) ?? null),
      findMany: async ({ where }) => clone(rows.filter((row) => row.isActive === where.isActive && row.status === where.status)),
      update: async ({ where, data }) => {
        updateCalls++;
        const row = rows.find((item) => item.id === where.id);
        if (!row) throw new Error("row missing");
        Object.assign(row, data);
        return clone(row);
      },
    },
  };
  return { tx, rows, get lockCalls() { return lockCalls; }, get updateCalls() { return updateCalls; } };
}

test("activation atomically switches active flags and preserves every saved field", async () => {
  const previous = makeTemplate({ id: "previous", name: "Previous active", status: "ACTIVE", isActive: true });
  const draft = makeTemplate();
  const previousFields = structuredClone(previous.fields);
  const draftFields = structuredClone(draft.fields);
  const database = makeTransaction([previous, draft]);

  const result = await activation.activateSavedTemplate(database.tx, {
    templateId: draft.id,
    expectedUpdatedAt: templateUpdatedAt,
    adminUserId: "admin-1",
  }, async () => {});

  assert.equal(result.activated.id, draft.id);
  assert.equal(database.rows.find((row) => row.id === draft.id).status, "ACTIVE");
  assert.equal(database.rows.find((row) => row.id === draft.id).isActive, true);
  assert.equal(database.rows.find((row) => row.id === previous.id).status, "DRAFT");
  assert.equal(database.rows.find((row) => row.id === previous.id).isActive, false);
  assert.deepEqual(database.rows.find((row) => row.id === draft.id).fields, draftFields);
  assert.deepEqual(database.rows.find((row) => row.id === previous.id).fields, previousFields);
  assert.equal(database.lockCalls, 1);

  const reactivated = await activation.activateSavedTemplate(database.tx, {
    templateId: previous.id,
    expectedUpdatedAt: templateUpdatedAt,
    adminUserId: "admin-1",
  }, async () => {});
  assert.equal(reactivated.activated.id, previous.id);
  assert.equal(database.rows.find((row) => row.id === previous.id).isActive, true);
  assert.equal(database.rows.find((row) => row.id === draft.id).isActive, false);
  assert.deepEqual(database.rows.find((row) => row.id === previous.id).fields, previousFields);
  assert.equal(database.lockCalls, 2);

  const repeated = await activation.activateSavedTemplate(database.tx, {
    templateId: previous.id,
    expectedUpdatedAt: templateUpdatedAt,
    adminUserId: "admin-1",
  }, async () => {});
  assert.equal(repeated.alreadyActive, true);
  assert.equal(database.updateCalls, 4);
});

test("invalid dimensions, QR bindings, and missing assets block activation before writes", async () => {
  const badDimension = makeTemplate({ fields: [
    makeField("small", "FRONT", "STATIC_TEXT", { heightPercent: 0 }),
    makeField("qr", "BACK", "QR", { staticValue: null, sourceKey: "qrValue" }),
  ] });
  const dimensionDb = makeTransaction([badDimension]);
  await assert.rejects(activation.activateSavedTemplate(dimensionDb.tx, {
    templateId: badDimension.id, expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }), /front field "small" heightPercent/);
  assert.equal(dimensionDb.updateCalls, 0);
  assert.equal(badDimension.isActive, false);

  const badQr = makeTemplate({ fields: [
    makeField("front", "FRONT", "STATIC_TEXT"),
    makeField("qr", "BACK", "QR", { staticValue: null, sourceKey: "documentId" }),
  ] });
  const qrDb = makeTransaction([badQr]);
  await assert.rejects(activation.activateSavedTemplate(qrDb.tx, {
    templateId: badQr.id, expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }), /unsupported dynamic binding/);
  assert.equal(qrDb.updateCalls, 0);

  const unsupportedStyle = makeTemplate({ fields: [
    makeField("front-name", "FRONT", "TEXT", { sourceKey: "fullName", staticValue: null, styleJson: { fontFamily: "Arial" } }),
    makeField("qr", "BACK", "QR", { staticValue: null, sourceKey: "qrValue" }),
  ] });
  const styleDb = makeTransaction([unsupportedStyle]);
  await assert.rejects(activation.activateSavedTemplate(styleDb.tx, {
    templateId: unsupportedStyle.id, expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }), /unsupported or invalid style property/);
  assert.equal(styleDb.updateCalls, 0);

  const mixedImageBinding = makeTemplate({ fields: [
    makeField("photo", "FRONT", "IMAGE", { assetId: "asset-1", sourceKey: "photoUrl" }),
    makeField("qr", "BACK", "QR", { staticValue: null, sourceKey: "qrValue" }),
  ] });
  mixedImageBinding.assets = [{
    id: "asset-1", templateId: mixedImageBinding.id, side: "FRONT", kind: "IMAGE",
    objectPath: "id-templates/draft-id/asset-1/00000000-0000-4000-8000-000000000000.png",
    publicUrl: null, mimeType: "image/png", width: 10, height: 10, createdAt: new Date(templateUpdatedAt),
  }];
  const mixedDb = makeTransaction([mixedImageBinding]);
  await assert.rejects(activation.activateSavedTemplate(mixedDb.tx, {
    templateId: mixedImageBinding.id, expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }), /cannot mix an uploaded asset/);
  assert.equal(mixedDb.updateCalls, 0);

  const missingAsset = makeTemplate({ fields: [
    makeField("photo", "FRONT", "IMAGE", { assetId: "missing-asset", sourceKey: null }),
    makeField("qr", "BACK", "QR", { staticValue: null, sourceKey: "qrValue" }),
  ] });
  const assetDb = makeTransaction([missingAsset]);
  await assert.rejects(activation.activateSavedTemplate(assetDb.tx, {
    templateId: missingAsset.id, expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }), /invalid template asset/);
  assert.equal(assetDb.updateCalls, 0);
});

test("stale template versions are rejected and rollback returns production to code default", async () => {
  const previous = makeTemplate({ id: "active-id", name: "Active", status: "ACTIVE", isActive: true });
  const draft = makeTemplate();
  const database = makeTransaction([previous, draft]);
  await assert.rejects(activation.activateSavedTemplate(database.tx, {
    templateId: draft.id,
    expectedUpdatedAt: "2026-11-13T09:00:00.000Z",
    adminUserId: "admin-1",
  }), /changed after it was loaded/);
  assert.equal(database.updateCalls, 0);

  const rollback = await activation.deactivateToCodeDefault(database.tx, {
    expectedActiveTemplateId: previous.id,
    expectedUpdatedAt: templateUpdatedAt,
  });
  assert.equal(rollback.productionUses, "CODE_DEFAULT");
  assert.equal(previous.status, "DRAFT");
  assert.equal(previous.isActive, false);
  assert.deepEqual(previous.fields, makeTemplate({ id: "active-id", name: "Active", status: "ACTIVE", isActive: true }).fields);
});

test("activation API checks Admin role on both saved-version listing and mutation routes", () => {
  const route = readFileSync(new URL("../src/app/api/admin/id-template/activate/route.ts", import.meta.url), "utf8");
  const activationSource = readFileSync(new URL("../src/lib/id-template/template-activation.ts", import.meta.url), "utf8");
  assert.match(route, /export async function GET\(\)[\s\S]*?requireApiRole\(\[Role\.ADMIN\]\)/);
  assert.match(route, /export async function POST\(request: Request\)[\s\S]*?requireApiRole\(\[Role\.ADMIN\]\)/);
  assert.match(route, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.match(activationSource, /pg_advisory_xact_lock/);
  assert.match(activationSource, /SELECT 1 FROM pg_advisory_xact_lock/);
});

test("activation lock returns an integer rather than PostgreSQL void", async () => {
  const database = makeTransaction([makeTemplate()]);
  database.tx.$queryRaw = async (segments) => {
    const sql = Array.from(segments).join("?");
    if (/SELECT pg_advisory_xact_lock/.test(sql)) {
      throw new Error("Raw query failed. Code: `N/A`. Message: `Failed to deserialize column of type 'void'.`");
    }
    assert.match(sql, /SELECT 1 FROM pg_advisory_xact_lock/);
    return [{ "?column?": 1 }];
  };
  const result = await activation.activateSavedTemplate(database.tx, {
    templateId: "draft-id", expectedUpdatedAt: templateUpdatedAt, adminUserId: "admin-1",
  }, async () => {});
  assert.equal(result.activated.id, "draft-id");
});

test("activation database failures get safe actionable categories", () => {
  const source = readFileSync(new URL("../src/lib/id-template/activation-error.ts", import.meta.url), "utf8");
  const failures = loadModule(source);
  assert.equal(failures.classifyActivationDatabaseError({ code: "P2010", message: "secret connection string" }).status, 503);
  assert.equal(failures.classifyActivationDatabaseError({ code: "P2028" }).status, 503);
  assert.equal(failures.classifyActivationDatabaseError({ code: "P2034" }).status, 409);
  assert.equal(failures.classifyActivationDatabaseError({ code: "P2003" }).status, 409);
  const unknown = failures.classifyActivationDatabaseError(new Error("password=secret"));
  assert.equal(unknown.code, "UNKNOWN");
  assert.doesNotMatch(unknown.message, /password|secret|connection string/i);
});

test("production active-template loader filters out drafts and requires both active flags", async () => {
  const source = readFileSync(new URL("../src/lib/id-template/load-active-id-template.ts", import.meta.url), "utf8")
    .replace('import { prisma } from "@/lib/db";', "const prisma = globalThis.__prisma;");
  const active = makeTemplate({ id: "active-id", status: "ACTIVE", isActive: true });
  let query;
  const loader = loadModule(source, {
    __prisma: { idTemplate: { findFirst: async (args) => { query = args; return active; } } },
  });
  const resolved = await loader.loadActiveIdTemplate();
  assert.equal(resolved.id, active.id);
  assert.equal(JSON.stringify(query.where), JSON.stringify({ isActive: true, status: "ACTIVE" }));
});
