import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { Role, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { validInternalCredentials } from "../src/lib/internal-credential-policy.ts";
import { resolveAuthSecret } from "../src/lib/auth-config.ts";

const require = createRequire(import.meta.url);
const { validateConfig } = require("../scripts/bootstrap-fresh-admin.cjs");

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

test("admin bootstrap requires explicit identity, strong password, confirmation, and exact Railway target", () => {
  const env = {
    SKTECH_ADMIN_BOOTSTRAP_CONFIRM: "CREATE_FIRST_ADMIN_ON_SKTECH_FRESH",
    DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/railway",
    RAILWAY_FRESH_DATABASE_URL: "postgresql://user:placeholder@fresh.proxy.rlwy.net/railway",
    RAILWAY_FRESH_DATABASE_HOST: "fresh.proxy.rlwy.net",
    SKTECH_BOOTSTRAP_ADMIN_ID: "admin2026",
    SKTECH_BOOTSTRAP_ADMIN_EMAIL: "admin@example.org",
    SKTECH_BOOTSTRAP_ADMIN_NAME: "Example Administrator",
    SKTECH_BOOTSTRAP_ADMIN_PASSWORD: "Example-passphrase-2026!",
  };
  assert.equal(validateConfig(env).employeeId, "admin2026");
  assert.throws(() => validateConfig({ ...env, SKTECH_ADMIN_BOOTSTRAP_CONFIRM: "" }));
  assert.throws(() => validateConfig({ ...env, SKTECH_BOOTSTRAP_ADMIN_PASSWORD: "short" }));
  assert.throws(() => validateConfig({ ...env, RAILWAY_FRESH_DATABASE_HOST: "other.proxy.rlwy.net" }));
  assert.throws(() => validateConfig({ ...env, DATABASE_URL: "postgresql://user:placeholder@db.supabase.co/postgres" }));
});

test("authentication secret cannot fall back to the Face AI shared secret", () => {
  assert.equal(resolveAuthSecret({ FACE_SECRET: "face-only" }), undefined);
  assert.equal(resolveAuthSecret({ NEXTAUTH_SECRET: " session-secret ", FACE_SECRET: "face-only" }), "session-secret");
});
