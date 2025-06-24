import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { addTeamMemberBilling } from '@/lib/team-billing';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get current user with team info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (currentUser.subscriptionPlan !== 'agency') {
      return new NextResponse('Agency subscription required', { status: 403 });
    }

    if (!currentUser.team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return new NextResponse('Only team owners and admins can add members', { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return new NextResponse('Name, email, and password are required', { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse('Invalid email format', { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return new NextResponse('Password must be at least 8 characters long', { status: 400 });
    }

    // Validate role
    const validRoles = ['member', 'admin'];
    if (role && !validRoles.includes(role)) {
      return new NextResponse('Invalid role specified', { status: 400 });
    }

    // Only owners can create admin members
    if (role === 'admin' && currentUser.role !== 'owner') {
      return new NextResponse('Only team owners can create admin members', { status: 403 });
    }

    // Check if team has capacity
    if (currentUser.team.members.length >= currentUser.team.memberLimit) {
      return new NextResponse('Team member limit reached', { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return new NextResponse('A user with this email already exists', { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user account and add to team in a transaction
    const newMember = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          emailVerified: new Date(), // Auto-verify since admin is creating
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          usageThisMonth: 0,
          teamId: currentUser.team!.id,
          role: role || 'member'
        }
      });

      // Create credentials account for the user
      await tx.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
          refresh_token: hashedPassword, // Store hashed password
        }
      });

      return user;
    });

    console.log(`Team member added: ${newMember.email} by ${currentUser.email}`);

    // Handle billing for additional team members (Agency plan only)
    let billingResult = null;
    if (currentUser.subscriptionPlan === 'agency' && currentUser.stripeCustomerId) {
      try {
        // Get user's subscription
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: currentUser.id,
            status: 'active'
          }
        });

        if (subscription && subscription.stripeSubscriptionId) {
          billingResult = await addTeamMemberBilling(
            currentUser.id,
            currentUser.stripeCustomerId,
            subscription.stripeSubscriptionId
          );
          
          if (!billingResult.success) {
            console.warn('[TEAM_MEMBER_BILLING_WARNING]', billingResult.message);
          }
        }
      } catch (billingError) {
        console.error('[TEAM_MEMBER_BILLING_ERROR]', billingError);
        // Don't fail the entire request if billing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team member added successfully',
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        createdAt: newMember.createdAt
      },
      billing: billingResult ? {
        success: billingResult.success,
        message: billingResult.message
      } : null
    });

  } catch (error) {
    console.error('[TEAM_ADD_MEMBER_ERROR]', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return new NextResponse('A user with this email already exists', { status: 400 });
    }

    return new NextResponse('Internal Error', { status: 500 });
  }
} 