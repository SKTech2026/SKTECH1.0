import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const allowSelfSignedTls =
  process.env.PGSSL_ALLOW_SELF_SIGNED === "true" ||
  process.env.NODE_ENV !== "production";

const getPoolConnectionString = () => {
  if (!allowSelfSignedTls) {
    return connectionString;
  }

  const parsed = new URL(connectionString);
  [
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "sslaccept",
    "ssl_min_protocol_version",
    "ssl_max_protocol_version",
  ].forEach((key) => parsed.searchParams.delete(key));

  return parsed.toString();
};

const pool = new Pool({
  connectionString: getPoolConnectionString(),
  ...(allowSelfSignedTls ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
