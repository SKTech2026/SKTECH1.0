/* eslint-disable @typescript-eslint/no-require-imports */
// Offline one-time command. Never imported by the application.
const bcrypt = require("bcryptjs");

function validateConfig(env) {
  if (env.SKTECH_ADMIN_BOOTSTRAP_CONFIRM !== "CREATE_FIRST_ADMIN_ON_SKTECH_FRESH") {
    throw new Error("Explicit bootstrap confirmation is required.");
  }
  const url = env.RAILWAY_FRESH_DATABASE_URL;
  const expectedHost = env.RAILWAY_FRESH_DATABASE_HOST?.trim().toLowerCase();
  if (!url || !expectedHost || url !== env.DATABASE_URL) {
    throw new Error("Fresh database URL and exact expected host are required.");
  }
  const target = new URL(url);
  if (!/^(postgres|postgresql):$/.test(target.protocol) ||
      !/^[a-z0-9-]+\.proxy\.rlwy\.net$/i.test(target.hostname) ||
      target.hostname.toLowerCase() !== expectedHost ||
      target.pathname !== "/railway" || /supabase/i.test(url)) {
    throw new Error("Refusing unexpected or Supabase database target.");
  }
  const employeeId = env.SKTECH_BOOTSTRAP_ADMIN_ID?.trim();
  const email = env.SKTECH_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = env.SKTECH_BOOTSTRAP_ADMIN_NAME?.trim();
  const password = env.SKTECH_BOOTSTRAP_ADMIN_PASSWORD;
  if (!employeeId || !/^[a-zA-Z0-9._-]{4,64}$/.test(employeeId) ||
      !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !name || name.length < 2 || name.length > 120 ||
      !password || password.length < 16 || password.length > 256 ||
      !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    throw new Error("Explicit admin ID, email, name, and strong password are required.");
  }
  return { url, employeeId, email, name, password };
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
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7326814901)`;
      if (await tx.user.count({ where: { role: Role.ADMIN } }) > 0) {
        throw new Error("An administrator already exists.");
      }
      if (await tx.user.findFirst({ where: { OR: [
        { employeeId: config.employeeId }, { email: config.email },
      ] }, select: { id: true } })) {
        throw new Error("Identity already belongs to an account.");
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log("First administrator created successfully.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error("Admin bootstrap failed or an administrator already exists. No connection details are printed.");
    process.exitCode = 1;
  });
}

module.exports = { validateConfig };
