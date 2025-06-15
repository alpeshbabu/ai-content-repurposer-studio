import { NextResponse } from 'next/server';
import { validateAdminRequest, verifyAdminToken, extractTokenFromHeader } from '@/lib/admin-auth';
import { getUserPermissions, getRoleInfo } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error, payload } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    if (!payload) {
      return new NextResponse('No payload in token', { status: 401 });
    }

    // Use the admin JWT token data directly (contains correct user info)
    const user = {
      id: `admin-${payload.username}`,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      username: payload.username,
      permissions: payload.permissions,
      createdAt: new Date('2024-01-01').toISOString(),
      emailVerified: new Date('2024-01-01').toISOString(),
      loginTime: new Date(payload.loginTime).toISOString()
    };

    // Get role information
    const roleInfo = getRoleInfo(user.role);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        roleInfo,
        isOwner: user.role === 'owner',
        isAdmin: ['owner', 'admin'].includes(user.role),
        hasFullAccess: user.role === 'owner' || user.permissions.includes('all'),
        accessLevel: user.role === 'owner' ? 'full' : 
                    user.role === 'admin' ? 'admin' : 
                    user.role === 'support' ? 'support' : 'limited'
      }
    });

  } catch (error) {
    console.error('[ADMIN_ME_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 