import { getPrismaClient, withPrisma } from './prisma-dynamic';

/**
 * Check if a specific table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await withPrisma(async (prisma) => 
      await prisma.$queryRawUnsafe<any[]>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        tableName
      )
    );
    
    return result && result[0] && result[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Generate a random ID for records
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Create the Content table if it doesn't exist
 */
export async function ensureContentTableExists(): Promise<boolean> {
  try {
    const exists = await tableExists('Content');
    if (exists) return true;
    
    // Create the Content table - execute statements one at a time
    await withPrisma(async (prisma) => 
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Content" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "originalContent" TEXT NOT NULL,
          "contentType" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
        )
      `)
    );
    
    // Create index in a separate statement
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Content_userId_idx" ON "Content"("userId")
      `)
    );
    
    return true;
  } catch (error) {
    console.error('Error creating Content table:', error);
    return false;
  }
}

/**
 * Create the RepurposedContent table if it doesn't exist
 */
export async function ensureRepurposedContentTableExists(): Promise<boolean> {
  try {
    const exists = await tableExists('RepurposedContent');
    if (exists) return true;
    
    // Create the RepurposedContent table - execute statements one at a time
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RepurposedContent" (
          "id" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "contentId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "RepurposedContent_pkey" PRIMARY KEY ("id")
        )
      `)
    );
    
    // Create index in a separate statement
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "RepurposedContent_contentId_idx" ON "RepurposedContent"("contentId")
      `)
    );
    
    return true;
  } catch (error) {
    console.error('Error creating RepurposedContent table:', error);
    return false;
  }
}

/**
 * Create the DailyUsage table if it doesn't exist
 */
export async function ensureDailyUsageTableExists(): Promise<boolean> {
  try {
    const exists = await tableExists('DailyUsage');
    if (exists) return true;
    
    // Create the DailyUsage table - execute statements one at a time
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DailyUsage" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "count" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "DailyUsage_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "DailyUsage_userId_date_key" UNIQUE ("userId", "date")
        )
      `)
    );
    
    // Create index in a separate statement
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId")
      `)
    );
    
    return true;
  } catch (error) {
    console.error('Error creating DailyUsage table:', error);
    return false;
  }
}

/**
 * Create the OverageCharge table if it doesn't exist
 */
export async function ensureOverageChargeTableExists(): Promise<boolean> {
  try {
    const exists = await tableExists('OverageCharge');
    if (exists) return true;
    
    // Create the OverageCharge table - execute statements one at a time
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OverageCharge" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "count" INTEGER NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "invoiceId" TEXT,
          
          CONSTRAINT "OverageCharge_pkey" PRIMARY KEY ("id")
        )
      `)
    );
    
    // Create index in a separate statement
    await withPrisma(async (prisma) =>
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "OverageCharge_userId_date_idx" ON "OverageCharge"("userId", "date")
      `)
    );
    
    return true;
  } catch (error) {
    console.error('Error creating OverageCharge table:', error);
    return false;
  }
}

/**
 * Check if User table exists and if it has the required columns
 */
export async function validateUserTable(): Promise<boolean> {
  try {
    // Check if User table exists
    const userExists = await tableExists('User');
    if (!userExists) return false;
    
    // Check if User table has the required columns
    const result = await withPrisma(async (prisma) =>
      await prisma.$queryRawUnsafe<any[]>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      `)
    );
    
    const columns = result.map(r => r.column_name.toLowerCase());
    const requiredColumns = [
      'id', 
      'email', 
      'subscriptionplan', 
      'usagethismonth', 
      'subscriptionstatus'
    ];
    
    const hasAllColumns = requiredColumns.every(col => columns.includes(col.toLowerCase()));
    return hasAllColumns;
  } catch (error) {
    console.error('Error validating User table:', error);
    return false;
  }
}

/**
 * Ensure all necessary tables exist for the subscription and content system
 */
export async function ensureAllTablesExist(): Promise<{
  success: boolean;
  userTable: boolean;
  contentTable: boolean;
  repurposedContentTable: boolean;
  dailyUsageTable: boolean;
  overageChargeTable: boolean;
}> {
  try {
    // Check User table first - we can't create this dynamically
    const userValid = await validateUserTable();
    
    // Create the other tables if they don't exist
    const contentExists = await ensureContentTableExists();
    const repurposedContentExists = await ensureRepurposedContentTableExists();
    const dailyUsageExists = await ensureDailyUsageTableExists();
    const overageChargeExists = await ensureOverageChargeTableExists();
    
    return {
      success: userValid && contentExists && repurposedContentExists,
      userTable: userValid,
      contentTable: contentExists,
      repurposedContentTable: repurposedContentExists,
      dailyUsageTable: dailyUsageExists,
      overageChargeTable: overageChargeExists
    };
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return {
      success: false,
      userTable: false,
      contentTable: false,
      repurposedContentTable: false,
      dailyUsageTable: false,
      overageChargeTable: false
    };
  }
} 