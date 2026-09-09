import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton so hot reload doesn't exhaust
// connections by creating a new PrismaClient on every file change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
