import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Admin@12345", 10);

  await prisma.user.upsert({
    where: { employeeId: "admin001" },
    update: {
      name: "System Administrator",
      email: "admin001@skdg.local",
      role: "ADMIN",
      status: "APPROVED",
      password: passwordHash,
    },
    create: {
      employeeId: "admin001",
      name: "System Administrator",
      email: "admin001@skdg.local",
      role: "ADMIN",
      status: "APPROVED",
      password: passwordHash,
    },
  });

  console.log("✅ admin seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());