/* eslint-disable @typescript-eslint/no-require-imports */
// Offline one-time command. Never imported by the application.
const bcrypt = require("bcryptjs");

class BootstrapError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const guidance = Object.freeze({
  CONFIRMATION: "Set the exact bootstrap confirmation value.",
  TARGET: "Check the sktech-fresh environment marker, public proxy URL, exact expected host, and DATABASE_URL equality.",
  IDENTITY: "Provide a new 4-64 character admin username using letters, digits, dots, underscores, or hyphens.",
  PASSWORD: "Provide a 16-256 character password with upper and lower case letters, a digit, and a symbol.",
  ADMIN_EXISTS: "An administrator already exists; do not retry bootstrap.",
  IDENTITY_EXISTS: "The username belongs to an existing account; choose a different username without modifying that account.",
  LOCK_BUSY: "Another bootstrap is in progress; wait and recheck the admin count before retrying.",
  CONNECTION: "Check public TCP proxy host and port, network access, and database availability.",
  DATABASE_AUTH: "Check the fresh Railway database username and password.",
  DATABASE_NAME: "Check the database name in the fresh Railway public URL.",
  DATABASE_PERMISSION: "Check that the fresh database user can read and insert User rows and acquire advisory locks.",
  PRISMA_QUERY: "A Prisma database query failed. Check schema, adapter, and database permissions for the fresh target.",
  TRANSACTION: "The database transaction failed. Recheck the admin count before retrying.",
  TLS: "Check the public URL SSL settings and Railway certificate configuration.",
  SCHEMA: "Check that the fresh database has the Prisma migrations applied.",
  CONFLICT: "An account or concurrent transaction conflicted; recheck the admin count and identity before retrying.",
  UNKNOWN: "Check the fresh Railway database connection and schema; no database changes should be assumed.",
});

function classifyError(error) {
  if (error instanceof BootstrapError) return error.code;
  const codes = [];
  const messages = [];
  const names = [];
  const pending = [error];
  for (let examined = 0; pending.length && examined < 12; examined++) {
    const current = pending.shift();
    if (!current || typeof current !== "object") continue;
    if (typeof current.code === "string") codes.push(current.code);
    if (typeof current.meta?.code === "string") codes.push(current.meta.code);
    if (typeof current.message === "string") messages.push(current.message);
    if (typeof current.constructor?.name === "string") names.push(current.constructor.name);
    if (current.cause) pending.push(current.cause);
    if (Array.isArray(current.errors)) pending.push(...current.errors.slice(0, 5));
  }
  if (codes.some((code) => ["28P01", "28000", "P1000"].includes(code))) return "DATABASE_AUTH";
  if (codes.some((code) => ["3D000", "P1003"].includes(code))) return "DATABASE_NAME";
  if (codes.some((code) => ["42P01", "42703", "P1014", "P2021", "P2022"].includes(code))) return "SCHEMA";
  if (codes.includes("42501")) return "DATABASE_PERMISSION";
  if (codes.includes("P2010")) return "PRISMA_QUERY";
  if (codes.includes("P2028")) return "TRANSACTION";
  if (codes.some((code) => ["23505", "P2002", "40001", "P2034"].includes(code))) return "CONFLICT";
  if (codes.some((code) => ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "P1001", "P1002", "P1008", "P1017", "P2024"].includes(code))) return "CONNECTION";
  if (names.includes("PrismaClientInitializationError")) return "CONNECTION";
  if (names.includes("PrismaClientUnknownRequestError")) return "PRISMA_QUERY";
  const message = messages.join(" ");
  if (/certificate|self.signed|unable to verify|ssl|tls/i.test(message)) return "TLS";
  if (/password authentication failed|authentication failed/i.test(message)) return "DATABASE_AUTH";
  if (/relation .* does not exist|column .* does not exist/i.test(message)) return "SCHEMA";
  if (/connect|timeout|network|host/i.test(message)) return "CONNECTION";
  return "UNKNOWN";
}

function validateConfig(env) {
  if (env.SKTECH_ADMIN_BOOTSTRAP_CONFIRM !== "CREATE_FIRST_ADMIN_ON_SKTECH_FRESH") {
    throw new BootstrapError("CONFIRMATION");
  }
  const url = env.RAILWAY_FRESH_DATABASE_URL;
  const expectedHost = env.RAILWAY_FRESH_DATABASE_HOST?.trim().toLowerCase();
  if (!url || env.RAILWAY_ENVIRONMENT_NAME !== "sktech-fresh" ||
      !expectedHost ||
      (env.DATABASE_URL && url !== env.DATABASE_URL)) {
    throw new BootstrapError("TARGET");
  }
  let target;
  try { target = new URL(url); } catch { throw new BootstrapError("TARGET"); }
  if (!/^(postgres|postgresql):$/.test(target.protocol) ||
      !/^[a-z0-9-]+\.proxy\.rlwy\.net$/i.test(target.hostname) ||
      target.hostname.toLowerCase() !== expectedHost ||
      !/^\/[a-zA-Z0-9_-]{1,63}$/.test(target.pathname) || /supabase/i.test(url)) {
    throw new BootstrapError("TARGET");
  }
  const username = env.SKTECH_BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = env.SKTECH_BOOTSTRAP_ADMIN_PASSWORD;
  if (!username || !/^[a-zA-Z0-9._-]{4,64}$/.test(username)) {
    throw new BootstrapError("IDENTITY");
  }
  if (!password || password.length < 16 || password.length > 256 ||
      !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    throw new BootstrapError("PASSWORD");
  }
  return { url, username, password };
}

async function writeFirstAdmin(tx, config, passwordHash, Role, UserStatus) {
  // The boolean result is supported by Prisma; pg_advisory_xact_lock returns void.
  const [lock] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(7326814901) AS acquired`;
  if (!lock?.acquired) throw new BootstrapError("LOCK_BUSY");
  if (await tx.user.count({ where: { role: Role.ADMIN } }) > 0) {
    throw new BootstrapError("ADMIN_EXISTS");
  }
  if (await tx.user.findFirst({ where: {
    employeeId: { equals: config.username, mode: "insensitive" },
  }, select: { id: true } })) {
    throw new BootstrapError("IDENTITY_EXISTS");
  }
  await tx.user.create({ data: {
    employeeId: config.username,
    email: null,
    name: config.username,
    password: passwordHash,
    role: Role.ADMIN,
    status: UserStatus.APPROVED,
  } });
}

async function main() {
  const config = validateConfig(process.env);
  const { PrismaClient, Role, UserStatus, Prisma } = require("@prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: config.url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    // Hash before opening the transaction to keep its lock duration short.
    const passwordHash = await bcrypt.hash(config.password, 12);
    await prisma.$transaction(async (tx) => {
      // Serialize concurrent bootstrap attempts across separate processes.
      await writeFirstAdmin(tx, config, passwordHash, Role, UserStatus);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log("First administrator created successfully.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    const code = classifyError(error);
    console.error(`BOOTSTRAP_${code}: ${guidance[code]}`);
    process.exitCode = 1;
  });
}

module.exports = { validateConfig, classifyError, BootstrapError, guidance, writeFirstAdmin };
