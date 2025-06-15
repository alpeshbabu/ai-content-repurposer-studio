import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

export interface AdminTokenPayload {
  username: string;
  role: string;
  name: string;
  email: string;
  permissions: string[];
  loginTime: number;
  iat: number;
  exp: number;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    // Check if token is properly formatted
    if (!token || typeof token !== 'string') {
      console.error('Invalid token format: token is empty or not a string');
      return null;
    }

    // Basic JWT format check (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid JWT format: token does not have 3 parts');
      return null;
    }

    const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    
    // Validate payload has required fields
    if (!payload.username || !payload.role || !payload.email) {
      console.error('Invalid token payload: missing required fields');
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid admin token (JWT error):', error.message);
      if (error.message === 'jwt malformed') {
        console.error('Token appears to be corrupted. Please clear localStorage and log in again.');
      }
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('Admin token expired:', error.message);
    } else if (error instanceof jwt.NotBeforeError) {
      console.error('Admin token not active yet:', error.message);
    } else {
      console.error('Unknown token verification error:', error);
    }
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid authorization header format. Expected "Bearer <token>"');
    return null;
  }
  
  const token = authHeader.substring(7);
  if (!token || token.length === 0) {
    console.error('Empty token in authorization header');
    return null;
  }
  
  return token;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  owner: 100,
  admin: 80,
  support: 60,
  user: 20
};

// Check if user has specific permission
export function hasPermission(payload: AdminTokenPayload, requiredPermission: string): boolean {
  // Owner has all permissions
  if (payload.role === 'owner' || payload.permissions.includes('all')) {
    return true;
  }

  // Check exact permission match
  if (payload.permissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions (e.g., 'users' covers 'users:read', 'users:write')
  const basePermission = requiredPermission.split(':')[0];
  if (payload.permissions.includes(basePermission)) {
    return true;
  }

  return false;
}

// Check if user has required role level or higher
export function hasRoleLevel(payload: AdminTokenPayload, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[payload.role as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  
  return userLevel >= requiredLevel;
}

export async function validateAdminRequest(
  request: Request, 
  options?: {
    requiredPermission?: string;
    requiredRole?: string;
    allowedRoles?: string[];
  }
): Promise<{
  isValid: boolean;
  payload?: AdminTokenPayload;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        isValid: false,
        error: 'No authentication token provided'
      };
    }

    const payload = verifyAdminToken(token);

    if (!payload) {
      return {
        isValid: false,
        error: 'Invalid or expired authentication token'
      };
    }

    // Check if user is a valid company member
    const validRoles = ['owner', 'admin', 'support'];
    if (!validRoles.includes(payload.role)) {
      return {
        isValid: false,
        error: 'Invalid user role for admin access'
      };
    }

    // Check specific permission if required
    if (options?.requiredPermission) {
      if (!hasPermission(payload, options.requiredPermission)) {
        return {
          isValid: false,
          error: `Insufficient permissions. Required: ${options.requiredPermission}`
        };
      }
    }

    // Check role level if required
    if (options?.requiredRole) {
      if (!hasRoleLevel(payload, options.requiredRole)) {
        return {
          isValid: false,
          error: `Insufficient role level. Required: ${options.requiredRole}`
        };
      }
    }

    // Check allowed roles if specified
    if (options?.allowedRoles) {
      if (!options.allowedRoles.includes(payload.role)) {
        return {
          isValid: false,
          error: `Role not allowed. Allowed roles: ${options.allowedRoles.join(', ')}`
        };
      }
    }

    return {
      isValid: true,
      payload
    };

  } catch (error) {
    console.error('Admin request validation error:', error);
    return {
      isValid: false,
      error: 'Authentication validation failed'
    };
  }
} 