import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com";
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must be configured and at least 8 characters long.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.SUPER_ADMIN, isActive: true },
    create: { name, email, passwordHash, role: Role.SUPER_ADMIN, isActive: true },
  });
  console.log(`Super admin seeded: ${email}`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });