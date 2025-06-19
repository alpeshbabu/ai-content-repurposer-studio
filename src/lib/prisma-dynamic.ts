// Dynamic Prisma client loader to prevent build-time execution
import { PrismaClient as ImportedPrismaClient } from '../generated/prisma/client';
import type { PrismaClient } from '@prisma/client';

let prismaInstance: ImportedPrismaClient | undefined;

export async function getPrismaClient(): Promise<ImportedPrismaClient> {
  if (!prismaInstance) {
    // Dynamically import PrismaClient only when needed
    const { PrismaClient } = await import('../generated/prisma/client');
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Test the connection
    try {
      await prismaInstance.$connect();
      console.log('[PRISMA] Successfully connected to database');
    } catch (error) {
      console.error('[PRISMA] Failed to connect to database:', error);
      throw error;
    }
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
  }
}

// Helper function for API routes that need database access
export async function withPrisma<T>(
  callback: (prisma: PrismaClient) => Promise<T>,
  retries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const prisma = await getPrismaClient();
      return await callback(prisma);
    } catch (error) {
      lastError = error as Error;
      console.error(`[PRISMA] Attempt ${attempt}/${retries} failed:`, error);
      
      // If it's a connection error and we haven't exhausted retries, reset the instance
      if (attempt < retries && prismaInstance && 
          (error as any)?.code === 'P1001' || // Can't reach database server
          (error as any)?.code === 'P1002' || // Database server timeout
          (error as any)?.code === 'P2024'    // Timed out fetching a new connection from pool
      ) {
        console.log('[PRISMA] Resetting connection and retrying...');
        await disconnectPrisma();
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Failed after all retries');
}