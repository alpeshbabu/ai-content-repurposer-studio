import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PATCH - Update admin credential
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error, payload } = await validateAdminRequest(req, {
      allowedRoles: ['owner', 'admin']
    });
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { credentialId } = await params;
    const { name, email, role, isActive, password, resetPassword } = await req.json();

    try {
      // Check if credential exists
      const existingCredential = await prisma.adminCredential.findUnique({
        where: { id: credentialId },
        select: { 
          id: true, 
          username: true, 
          role: true, 
          email: true,
          name: true,
          isActive: true
        }
      });

      if (!existingCredential) {
        return NextResponse.json({
          success: false,
          error: 'Admin credential not found'
        }, { status: 404 });
      }

      // Prevent non-owners from modifying owner accounts
      if (existingCredential.role === 'owner' && payload?.role !== 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Only owners can modify owner accounts'
        }, { status: 403 });
      }

      // Prevent non-owners from creating owner roles
      if (role === 'owner' && payload?.role !== 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Only owners can assign owner role'
        }, { status: 403 });
      }

      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Handle password reset
      if (password || resetPassword) {
        const newPassword = password || generateRandomPassword();
        
        // Validate password strength
        if (newPassword.length < 8) {
          return NextResponse.json({
            success: false,
            error: 'Password must be at least 8 characters long'
          }, { status: 400 });
        }

        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }

      // Update the credential
      const updatedCredential = await prisma.adminCredential.update({
        where: { id: credentialId },
        data: updateData,
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
          updatedAt: true
        }
      });

      console.log(`Admin credential ${credentialId} updated by ${payload?.username}`);

      const response: any = {
        success: true,
        message: 'Admin credential updated successfully',
        credential: updatedCredential
      };

      // Include new password in response if it was reset
      if (password || resetPassword) {
        response.newPassword = password || generateRandomPassword();
        response.passwordReset = true;
      }

      return NextResponse.json(response);

    } catch (dbError: any) {
      console.error('[ADMIN_CREDENTIALS_UPDATE_DB_ERROR]', dbError);
      
      if (dbError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'Email already exists'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Database error while updating admin credential'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_CREDENTIALS_PATCH_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Remove admin credential
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    // Validate admin authentication - only owners can delete
    const { isValid, error, payload } = await validateAdminRequest(req, {
      allowedRoles: ['owner']
    });
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Only owners can delete admin credentials' 
      }, { status: 401 });
    }

    const { credentialId } = await params;

    try {
      // Check if credential exists
      const existingCredential = await prisma.adminCredential.findUnique({
        where: { id: credentialId },
        select: { 
          id: true, 
          username: true, 
          role: true, 
          email: true,
          name: true
        }
      });

      if (!existingCredential) {
        return NextResponse.json({
          success: false,
          error: 'Admin credential not found'
        }, { status: 404 });
      }

      // Prevent deleting owner accounts
      if (existingCredential.role === 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete owner accounts'
        }, { status: 403 });
      }

      // Prevent deleting yourself
      if (existingCredential.username === payload?.username) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete your own account'
        }, { status: 403 });
      }

      // Delete the credential
      await prisma.adminCredential.delete({
        where: { id: credentialId }
      });

      console.log(`Admin credential ${credentialId} (${existingCredential.username}) deleted by ${payload?.username}`);

      return NextResponse.json({
        success: true,
        message: 'Admin credential deleted successfully'
      });

    } catch (dbError) {
      console.error('[ADMIN_CREDENTIALS_DELETE_DB_ERROR]', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error while deleting admin credential'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_CREDENTIALS_DELETE_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Reset password for admin credential
export async function POST(
  req: Request,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error, payload } = await validateAdminRequest(req, {
      allowedRoles: ['owner', 'admin']
    });
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { credentialId } = await params;
    const { action, newPassword } = await req.json();

    if (action !== 'reset_password') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

    try {
      // Check if credential exists
      const existingCredential = await prisma.adminCredential.findUnique({
        where: { id: credentialId },
        select: { 
          id: true, 
          username: true, 
          role: true, 
          email: true,
          name: true
        }
      });

      if (!existingCredential) {
        return NextResponse.json({
          success: false,
          error: 'Admin credential not found'
        }, { status: 404 });
      }

      // Prevent non-owners from resetting owner passwords
      if (existingCredential.role === 'owner' && payload?.role !== 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Only owners can reset owner passwords'
        }, { status: 403 });
      }

      // Generate new password or use provided one
      const password = newPassword || generateRandomPassword();
      
      // Validate password strength
      if (password.length < 8) {
        return NextResponse.json({
          success: false,
          error: 'Password must be at least 8 characters long'
        }, { status: 400 });
      }

      // Hash the new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password
      await prisma.adminCredential.update({
        where: { id: credentialId },
        data: { passwordHash }
      });

      console.log(`Password reset for admin credential ${existingCredential.username} by ${payload?.username}`);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
        newPassword: password,
        credential: {
          username: existingCredential.username,
          name: existingCredential.name,
          email: existingCredential.email
        }
      });

    } catch (dbError) {
      console.error('[ADMIN_CREDENTIALS_RESET_DB_ERROR]', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error while resetting password'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_CREDENTIALS_RESET_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Utility function to generate random passwords
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 