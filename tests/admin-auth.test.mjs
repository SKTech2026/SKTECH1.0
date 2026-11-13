import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { Role, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { validInternalCredentials } from "../src/lib/internal-credential-policy.ts";
import { resolveAuthSecret } from "../src/lib/auth-config.ts";

const require = createRequire(import.meta.url);
const { validateConfig, classifyError, BootstrapError, guidance, writeFirstAdmin } = require("../scripts/bootstrap-fresh-admin.cjs");

test("admin credential policy accepts only approved admin with valid password and role", async () => {
  const user = { role: Role.ADMIN, status: UserStatus.APPROVED,
    password: await hash("Example-passphrase-2026!", 4) };
  assert.equal(await validInternalCredentials(user, "Example-passphrase-2026!", "ADMIN"), true);
  assert.equal(await validInternalCredentials(user, "wrong", "ADMIN"), false);
  assert.equal(await validInternalCredentials(null, "Example-passphrase-2026!", "ADMIN"), false);
  assert.equal(await validInternalCredentials({ ...user, status: UserStatus.PENDING }, "Example-passphrase-2026!", "ADMIN"), false);
  assert.equal(await validInternalCredentials({ ...user, status: UserStatus.INACTIVE }, "Example-passphrase-2026!", "ADMIN"), false);
  assert.equal(await validInternalCredentials({ ...user, role: Role.STAFF }, "Example-passphrase-2026!", "ADMIN"), false);
  assert.equal(await validInternalCredentials({ ...user, role: Role.KK_MEMBER }, "Example-passphrase-2026!", "ADMIN"), false);
  assert.equal(await validInternalCredentials({ ...user, role: Role.STAFF }, "Example-passphrase-2026!", "STAFF"), true);
});

test("admin bootstrap requires username, strong password, confirmation, and fresh Railway target", () => {
  const env = {
    SKTECH_ADMIN_BOOTSTRAP_CONFIRM: "CREATE_FIRST_ADMIN_ON_SKTECH_FRESH",
    RAILWAY_ENVIRONMENT_NAME: "sktech-fresh",
    DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/railway",
    RAILWAY_FRESH_DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/railway",
    RAILWAY_FRESH_DATABASE_HOST: "fresh.proxy.rlwy.net",
    SKTECH_BOOTSTRAP_ADMIN_USERNAME: "ADMIN",
    SKTECH_BOOTSTRAP_ADMIN_PASSWORD: "Example-passphrase-2026!",
  };
  assert.equal(validateConfig(env).username, "ADMIN");
  assert.throws(() => validateConfig({ ...env, SKTECH_ADMIN_BOOTSTRAP_CONFIRM: "" }));
  assert.throws(() => validateConfig({ ...env, SKTECH_BOOTSTRAP_ADMIN_PASSWORD: "short" }));
  assert.throws(() => validateConfig({ ...env, RAILWAY_ENVIRONMENT_NAME: "production" }));
  assert.throws(() => validateConfig({ ...env, RAILWAY_FRESH_DATABASE_HOST: "other.proxy.rlwy.net" }));
  assert.throws(() => validateConfig({ ...env, SKTECH_BOOTSTRAP_ADMIN_USERNAME: "a" }));
  assert.throws(() => validateConfig({ ...env, DATABASE_URL: "postgresql://user:placeholder@db.supabase.co/postgres" }));
  assert.equal(validateConfig({ ...env,
    DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/custom",
    RAILWAY_FRESH_DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/custom",
  }).username, "ADMIN");
});

test("bootstrap errors are actionable categories without error details", () => {
  assert.equal(classifyError(new BootstrapError("ADMIN_EXISTS")), "ADMIN_EXISTS");
  assert.equal(classifyError(new BootstrapError("IDENTITY_EXISTS")), "IDENTITY_EXISTS");
  assert.equal(classifyError({ code: "28P01", message: "password authentication failed for user secret" }), "DATABASE_AUTH");
  assert.equal(classifyError({ code: "P2010", meta: { code: "42P01" } }), "SCHEMA");
  assert.equal(classifyError({ code: "ENOTFOUND" }), "CONNECTION");
  assert.equal(classifyError(new AggregateError([{ code: "ECONNREFUSED" }], "failed")), "CONNECTION");
  assert.equal(classifyError({ code: "42501" }), "DATABASE_PERMISSION");
  assert.equal(classifyError({ message: "self signed certificate" }), "TLS");
  assert.equal(classifyError(new Error("secret URL")), "UNKNOWN");
  for (const value of Object.values(guidance)) {
    assert.doesNotMatch(value, /secret URL|password authentication failed for user secret/);
  }
});

test("bootstrap never changes an existing OFFICIAL account or creates a second admin", async () => {
  const existingOfficial = { id: "official-1", role: Role.OFFICIAL, email: "official@example.org" };
  const writes = [];
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    user: {
      count: async () => 0,
      findFirst: async () => existingOfficial,
      create: async (record) => writes.push(record),
      update: async (record) => writes.push(record),
    },
  };
  const config = { username: "ADMIN" };
  await assert.rejects(writeFirstAdmin(tx, config, "hashed", Role, UserStatus),
    (error) => error.code === "IDENTITY_EXISTS");
  assert.deepEqual(writes, []);
  tx.user.count = async () => 1;
  await assert.rejects(writeFirstAdmin(tx, config, "hashed", Role, UserStatus),
    (error) => error.code === "ADMIN_EXISTS");
  assert.deepEqual(writes, []);
});

test("bootstrap creates only one approved admin after checks pass", async () => {
  const writes = [];
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    user: {
      count: async () => 0,
      findFirst: async () => null,
      create: async (record) => writes.push(record),
    },
  };
  await writeFirstAdmin(tx,
    { username: "ADMIN" },
    "hashed", Role, UserStatus);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].data.role, Role.ADMIN);
  assert.equal(writes[0].data.status, UserStatus.APPROVED);
  assert.equal(writes[0].data.password, "hashed");
  assert.equal(writes[0].data.employeeId, "ADMIN");
  assert.equal(writes[0].data.name, "ADMIN");
  assert.equal(writes[0].data.email, null);
});

test("bootstrap stops without writes when the transaction lock is busy", async () => {
  let queriedUsers = false;
  const tx = {
    $queryRaw: async () => [{ acquired: false }],
    user: { count: async () => { queriedUsers = true; return 0; } },
  };
  await assert.rejects(writeFirstAdmin(tx, {}, "hashed", Role, UserStatus),
    (error) => error.code === "LOCK_BUSY");
  assert.equal(queriedUsers, false);
});

test("authentication secret cannot fall back to the Face AI shared secret", () => {
  assert.equal(resolveAuthSecret({ FACE_SECRET: "face-only" }), undefined);
  assert.equal(resolveAuthSecret({ NEXTAUTH_SECRET: " session-secret ", FACE_SECRET: "face-only" }), "session-secret");
});
