import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Role definitions with permissions
const ROLE_DEFINITIONS = {
  owner: {
    name: 'Owner',
    description: 'Full platform access and control',
    permissions: ['all'],
    color: 'yellow',
    icon: 'crown'
  },
  admin: {
    name: 'Administrator',
    description: 'User management, analytics, content, support',
    permissions: ['users', 'content', 'analytics', 'support', 'settings', 'team'],
    color: 'purple',
    icon: 'shield'
  },
  support: {
    name: 'Support Manager',
    description: 'Support tickets, user assistance, content review',
    permissions: ['support', 'users:read', 'analytics:support', 'content:read'],
    color: 'blue',
    icon: 'headphones'
  },
  marketing: {
    name: 'Marketing Manager',
    description: 'Analytics, content, marketing campaigns',
    permissions: ['analytics', 'content', 'marketing'],
    color: 'green',
    icon: 'megaphone'
  },
  finance: {
    name: 'Finance Manager',
    description: 'Billing, subscriptions, financial reports',
    permissions: ['billing', 'analytics:financial', 'users:read'],
    color: 'orange',
    icon: 'dollar-sign'
  },
  content_developer: {
    name: 'Content Developer',
    description: 'Content creation and management',
    permissions: ['content', 'analytics:content'],
    color: 'indigo',
    icon: 'edit'
  }
};

// GET - Fetch all admin credentials
export async function GET(req: Request) {
  try {
    // Validate admin authentication and require owner/admin privileges
    const { isValid, error, payload } = await validateAdminRequest(req, {
      allowedRoles: ['owner', 'admin']
    });
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';

    try {
      // Fetch admin credentials from database
      let whereClause: any = {};

      // Apply search filter
      if (search) {
        whereClause.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Apply role filter
      if (role !== 'all') {
        whereClause.role = role;
      }

      // Apply status filter
      if (status !== 'all') {
        whereClause.isActive = status === 'active';
      }

      const adminCredentials = await prisma.adminCredential.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true
        },
        orderBy: [
          { role: 'desc' }, // Owner first
          { createdAt: 'desc' }
        ]
      });

      // Transform data to include role information
      const formattedCredentials = adminCredentials.map(cred => ({
        ...cred,
        roleInfo: ROLE_DEFINITIONS[cred.role as keyof typeof ROLE_DEFINITIONS] || {
          name: cred.role,
          description: 'Custom role',
          permissions: cred.permissions,
          color: 'gray',
          icon: 'user'
        },
        status: cred.isActive ? 'active' : 'suspended',
        lastLoginFormatted: cred.lastLogin ? new Date(cred.lastLogin).toLocaleDateString() : 'Never'
      }));

      return NextResponse.json({
        success: true,
        credentials: formattedCredentials,
        totalCount: formattedCredentials.length,
        roleDefinitions: ROLE_DEFINITIONS
      });

    } catch (dbError) {
      console.error('[ADMIN_CREDENTIALS_DB_ERROR]', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error while fetching admin credentials'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_CREDENTIALS_GET_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new admin credential
export async function POST(req: Request) {
  try {
    // Validate admin authentication and require owner privileges for creating admins
    const { isValid, error, payload } = await validateAdminRequest(req, {
      allowedRoles: ['owner']
    });
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Only owners can create admin credentials' 
      }, { status: 401 });
    }

    const { username, password, name, email, role } = await req.json();

    // Validate input
    if (!username || !password || !name || !email || !role) {
      return NextResponse.json({
        success: false,
        error: 'All fields (username, password, name, email, role) are required'
      }, { status: 400 });
    }

    // Validate role
    if (!ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role specified'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate username format (letters, numbers, underscore, dash only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'Username can only contain letters, numbers, underscore, and dash'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    try {
      // Check if username or email already exists
      const existingCredential = await prisma.adminCredential.findFirst({
        where: {
          OR: [
            { username: username.toLowerCase() },
            { email: email.toLowerCase() }
          ]
        }
      });

      if (existingCredential) {
        return NextResponse.json({
          success: false,
          error: existingCredential.username === username.toLowerCase() 
            ? 'Username already exists' 
            : 'Email already exists'
        }, { status: 400 });
      }

      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Get role permissions
      const rolePermissions = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS].permissions;

      // Create new admin credential
      const newCredential = await prisma.adminCredential.create({
        data: {
          username: username.toLowerCase(),
          passwordHash,
          name,
          email: email.toLowerCase(),
          role,
          permissions: rolePermissions,
          isActive: true,
          createdBy: payload?.username || 'system'
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true
        }
      });

      console.log(`Admin credential created: ${newCredential.username} (${newCredential.role}) by ${payload?.username}`);

      return NextResponse.json({
        success: true,
        message: 'Admin credential created successfully',
        credential: {
          ...newCredential,
          roleInfo: ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]
        }
      });

    } catch (dbError: any) {
      console.error('[ADMIN_CREDENTIALS_CREATE_DB_ERROR]', dbError);
      
      if (dbError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'Username or email already exists'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Database error while creating admin credential'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_CREDENTIALS_POST_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 