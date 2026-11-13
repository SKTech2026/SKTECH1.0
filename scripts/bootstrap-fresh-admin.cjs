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
  TARGET: "Check the fresh Railway public URL, its exact proxy hostname, and DATABASE_URL equality.",
  IDENTITY: "Provide a new valid employee ID, email, and display name.",
  PASSWORD: "Provide a 16-256 character password with upper and lower case letters, a digit, and a symbol.",
  ADMIN_EXISTS: "An administrator already exists; do not retry bootstrap.",
  IDENTITY_EXISTS: "The employee ID or email belongs to an existing account; choose a different identity without modifying that account.",
  LOCK_BUSY: "Another bootstrap is in progress; wait and recheck the admin count before retrying.",
  CONNECTION: "Check public TCP proxy host and port, network access, and database availability.",
  DATABASE_AUTH: "Check the fresh Railway database username and password.",
  DATABASE_NAME: "Check the database name in the fresh Railway public URL.",
  TLS: "Check the public URL SSL settings and Railway certificate configuration.",
  SCHEMA: "Check that the fresh database has the Prisma migrations applied.",
  CONFLICT: "An account or concurrent transaction conflicted; recheck the admin count and identity before retrying.",
  UNKNOWN: "Check the fresh Railway database connection and schema; no database changes should be assumed.",
});

function classifyError(error) {
  if (error instanceof BootstrapError) return error.code;
  const codes = [];
  const messages = [];
  for (let current = error, depth = 0; current && depth < 5; current = current.cause, depth++) {
    if (typeof current.code === "string") codes.push(current.code);
    if (typeof current.meta?.code === "string") codes.push(current.meta.code);
    if (typeof current.message === "string") messages.push(current.message);
  }
  if (codes.some((code) => ["28P01", "28000", "P1000"].includes(code))) return "DATABASE_AUTH";
  if (codes.some((code) => ["3D000", "P1003"].includes(code))) return "DATABASE_NAME";
  if (codes.some((code) => ["42P01", "42703", "P2022"].includes(code))) return "SCHEMA";
  if (codes.some((code) => ["23505", "P2002", "40001", "P2034"].includes(code))) return "CONFLICT";
  if (codes.some((code) => ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "P1001"].includes(code))) return "CONNECTION";
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
  const expectedDatabase = env.RAILWAY_FRESH_DATABASE_NAME?.trim();
  if (!url || !expectedHost || !/^[a-zA-Z0-9_-]{1,63}$/.test(expectedDatabase || "") ||
      url !== env.DATABASE_URL) {
    throw new BootstrapError("TARGET");
  }
  let target;
  try { target = new URL(url); } catch { throw new BootstrapError("TARGET"); }
  if (!/^(postgres|postgresql):$/.test(target.protocol) ||
      !/^[a-z0-9-]+\.proxy\.rlwy\.net$/i.test(target.hostname) ||
      target.hostname.toLowerCase() !== expectedHost ||
      target.pathname !== `/${expectedDatabase}` || /supabase/i.test(url)) {
    throw new BootstrapError("TARGET");
  }
  const employeeId = env.SKTECH_BOOTSTRAP_ADMIN_ID?.trim();
  const email = env.SKTECH_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = env.SKTECH_BOOTSTRAP_ADMIN_NAME?.trim();
  const password = env.SKTECH_BOOTSTRAP_ADMIN_PASSWORD;
  if (!employeeId || !/^[a-zA-Z0-9._-]{4,64}$/.test(employeeId) ||
      !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !name || name.length < 2 || name.length > 120) {
    throw new BootstrapError("IDENTITY");
  }
  if (!password || password.length < 16 || password.length > 256 ||
      !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    throw new BootstrapError("PASSWORD");
  }
  return { url, employeeId, email, name, password };
}

async function writeFirstAdmin(tx, config, passwordHash, Role, UserStatus) {
  // The boolean result is supported by Prisma; pg_advisory_xact_lock returns void.
  const [lock] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(7326814901) AS acquired`;
  if (!lock?.acquired) throw new BootstrapError("LOCK_BUSY");
  if (await tx.user.count({ where: { role: Role.ADMIN } }) > 0) {
    throw new BootstrapError("ADMIN_EXISTS");
  }
  if (await tx.user.findFirst({ where: { OR: [
    { employeeId: config.employeeId }, { email: config.email },
  ] }, select: { id: true } })) {
    throw new BootstrapError("IDENTITY_EXISTS");
  }
  await tx.user.create({ data: {
    employeeId: config.employeeId,
    email: config.email,
    name: config.name,
    password: passwordHash,
    role: Role.ADMIN,
    status: UserStatus.APPROVED,
    emailVerified: new Date(),
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
