import { PrismaClient } from "@prisma/client";

// Fallback: load .env langsung di sini untuk standalone builds
// (instrumentation.ts harusnya sudah handle, tapi ini sebagai safety net)
try {
  const { config } = require("dotenv");
  const { resolve } = require("path");
  config({ path: resolve(process.cwd(), ".env") });
} catch {}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
