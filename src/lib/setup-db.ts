import { prisma } from './prisma';

/**
 * Initialize the database with required tables for usage tracking
 */
export async function setupDatabase() {
  try {
    // Check if tables exist by trying to access them
    await prisma.$transaction(async (tx) => {
      // Check User table
      const userCount = await tx.user.count();
      console.log(`Found ${userCount} users in database`);
      
      // Ensure DailyUsage table exists - will throw if not
      try {
        await tx.dailyUsage.count();
        console.log('DailyUsage table exists');
      } catch (error) {
        console.error('Error accessing DailyUsage table:', error);
        throw new Error('DailyUsage table does not exist or is not accessible');
      }
      
      // Ensure OverageCharge table exists - will throw if not
      try {
        await tx.overageCharge.count();
        console.log('OverageCharge table exists');
      } catch (error) {
        console.error('Error accessing OverageCharge table:', error);
        throw new Error('OverageCharge table does not exist or is not accessible');
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Database setup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 