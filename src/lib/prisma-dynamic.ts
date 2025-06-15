// Dynamic Prisma client loader to prevent build-time execution
import type { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export async function getPrismaClient(): Promise<PrismaClient> {
  if (!prismaInstance) {
    const { PrismaClient } = await import('@prisma/client');
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// Helper function for API routes that need database access
export async function withPrisma<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = await getPrismaClient();
  try {
    return await callback(prisma);
  } finally {
    // Don't disconnect here - keep connection for reuse in serverless
    // Only disconnect on explicit cleanup
  }
}