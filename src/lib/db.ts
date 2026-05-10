import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "5432"),
    database: u.pathname.slice(1),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
}

function createAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new pg.Pool({ ...parseDbUrl(url), max: 3, idleTimeoutMillis: 10000 });
  return new PrismaPg(pool);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
