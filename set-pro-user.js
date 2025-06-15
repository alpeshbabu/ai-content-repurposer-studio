// Script to upgrade the current user to Pro plan for testing purposes
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function upgradeUserToPro() {
  try {
    console.log('Looking for existing user or creating a new one...');
    
    // Find the most recently created user (likely the development user)
    let user = await prisma.user.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // If no user exists, create one
    if (!user) {
      console.log('No user found. Creating a development user...');
      
      user = await prisma.user.create({
        data: {
          id: "dev-user-1",
          name: "Dev User",
          email: "dev@example.com",
          subscriptionPlan: "free",
          subscriptionStatus: "inactive",
          usageThisMonth: 0
        }
      });
      
      console.log(`Created new user: ${user.name} (${user.email})`);
    } else {
      console.log(`Found existing user: ${user.name} (${user.email})`);
    }
    
    console.log(`Current plan: ${user.subscriptionPlan}, Status: ${user.subscriptionStatus}`);
    
    // Calculate renewal date (1 month from now)
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);
    
    // Update the user to Pro plan
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionRenewalDate: renewalDate
      }
    });
    
    console.log('\nSuccessfully upgraded user to Pro plan!');
    console.log(`User: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`New plan: ${updatedUser.subscriptionPlan}`);
    console.log(`Status: ${updatedUser.subscriptionStatus}`);
    console.log(`Renewal date: ${updatedUser.subscriptionRenewalDate.toLocaleDateString()}`);
    console.log('\nYou can now test Pro features, including unlimited content repurposing!');
    console.log('\nTo use this account:');
    console.log('1. Sign out if you\'re currently signed in');
    console.log('2. Sign in with:');
    console.log('   - Name: Dev User');
    console.log('   - Email: dev@example.com');
    
  } catch (error) {
    console.error('Error upgrading user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeUserToPro(); 