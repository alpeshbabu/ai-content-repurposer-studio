// Test script for database setup
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testDatabaseSetup() {
  console.log('Testing database setup...');
  
  try {
    // Check if tables exist
    const tables = ['User', 'Content', 'RepurposedContent', 'DailyUsage', 'OverageCharge'];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, table);
        
        const exists = result && result[0] && result[0].exists;
        console.log(`Table ${table}: ${exists ? 'Exists' : 'Does not exist'}`);
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
      }
    }
    
    // Try to create some tables if they don't exist
    try {
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
        );
        
        CREATE INDEX IF NOT EXISTS "Content_userId_idx" ON "Content"("userId");
      `);
      console.log('Content table created or already exists');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RepurposedContent" (
          "id" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "contentId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "RepurposedContent_pkey" PRIMARY KEY ("id")
        );
        
        CREATE INDEX IF NOT EXISTS "RepurposedContent_contentId_idx" ON "RepurposedContent"("contentId");
      `);
      console.log('RepurposedContent table created or already exists');
      
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
        );
        
        CREATE INDEX IF NOT EXISTS "DailyUsage_userId_idx" ON "DailyUsage"("userId");
      `);
      console.log('DailyUsage table created or already exists');
      
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
        );
        
        CREATE INDEX IF NOT EXISTS "OverageCharge_userId_date_idx" ON "OverageCharge"("userId", "date");
      `);
      console.log('OverageCharge table created or already exists');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
    
    // Check tables again after creation attempt
    console.log('\nChecking tables after creation attempt:');
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, table);
        
        const exists = result && result[0] && result[0].exists;
        console.log(`Table ${table}: ${exists ? 'Exists' : 'Does not exist'}`);
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
      }
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseSetup()
  .then(() => console.log('Done'))
  .catch(error => console.error('Fatal error:', error)); 