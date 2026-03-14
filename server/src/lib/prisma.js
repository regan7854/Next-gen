import { PrismaClient } from '@prisma/client';

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function connectPrismaIfConfigured() {
  if (!process.env.DATABASE_URL) {
    console.log('Prisma/PostgreSQL skipped: DATABASE_URL is not set');
    return null;
  }

  try {
    const client = getPrisma();
    await client.$connect();
    await client.$queryRaw`SELECT 1`;
    console.log('Prisma connected to PostgreSQL');
    return client;
  } catch (error) {
    console.error('Prisma PostgreSQL connection failed:', error.message);
    throw error;
  }
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
