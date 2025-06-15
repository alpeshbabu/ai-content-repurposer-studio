// Script to upgrade the current user to Agency plan for testing purposes
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function upgradeUserToAgency() {
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
    
    // Create a team for the user
    const team = await prisma.team.create({
      data: {
        name: `${user.name}'s Agency`,
        ownerId: user.id,
        memberLimit: 3,
      }
    });
    
    // Update the user to Agency plan and associate with team
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        subscriptionPlan: 'agency',
        subscriptionStatus: 'active',
        subscriptionRenewalDate: renewalDate,
        teamId: team.id,
        role: 'owner'
      }
    });
    
    console.log('\nSuccessfully upgraded user to Agency plan!');
    console.log(`User: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`New plan: ${updatedUser.subscriptionPlan}`);
    console.log(`Status: ${updatedUser.subscriptionStatus}`);
    console.log(`Renewal date: ${updatedUser.subscriptionRenewalDate.toLocaleDateString()}`);
    console.log(`Team: ${team.name} (ID: ${team.id})`);
    console.log(`Team member limit: ${team.memberLimit}`);
    console.log('\nYou can now test Agency features, including team management and unlimited content repurposing!');
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

upgradeUserToAgency(); 