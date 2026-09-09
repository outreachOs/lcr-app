import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPhone = "07000000000";
  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (existing) {
    console.log("Admin already exists — skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.user.create({
    data: {
      name: "AB (Admin)",
      phone: adminPhone,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seeded admin login:");
  console.log("  phone:    07000000000");
  console.log("  password: changeme123");
  console.log("Change this password before going anywhere near production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
