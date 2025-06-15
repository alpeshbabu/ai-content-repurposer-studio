// Script to reset the current user back to Free plan
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function resetUserToFreePlan() {
  try {
    console.log('Resetting user to Free subscription plan...');
    
    // Find the most recently created user (likely the development user)
    const user = await prisma.user.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!user) {
      console.error('No user found in the database');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current plan: ${user.subscriptionPlan}, Status: ${user.subscriptionStatus}`);
    
    // Reset usage and subscription
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        subscriptionPlan: 'free',
        subscriptionStatus: 'inactive',
        subscriptionRenewalDate: null,
        usageThisMonth: 0,
        teamId: null,
        role: 'member'
      }
    });
    
    // If user was part of a team, find it and delete it
    if (user.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: user.teamId }
      });
      
      if (team) {
        await prisma.team.delete({
          where: { id: team.id }
        });
        console.log(`Deleted team: ${team.name}`);
      }
    }
    
    console.log('\nSuccessfully reset user to Free plan!');
    console.log(`User: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`New plan: ${updatedUser.subscriptionPlan}`);
    console.log(`Status: ${updatedUser.subscriptionStatus}`);
    console.log(`Usage this month: ${updatedUser.usageThisMonth}`);
    console.log('\nThe user now has the Free plan with 5 repurposes per month.');
    
  } catch (error) {
    console.error('Error resetting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserToFreePlan(); 