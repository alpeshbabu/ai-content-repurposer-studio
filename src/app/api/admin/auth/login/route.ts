import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Fallback credentials from environment variables (matching .env.local)
const FALLBACK_CREDENTIALS = {
  [process.env.ADMIN_USERNAME || 'mainboss']: {
    username: process.env.ADMIN_USERNAME || 'mainboss',
    password: process.env.ADMIN_PASSWORD || '@Alp21Gay15',
    name: 'Alpesh Patel',
    role: 'owner',
    email: 'alpesh@aicontentrepurposer.com',
    permissions: ['all']
  }
};

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    try {
      // First, try to find credentials in database
      const adminCredential = await prisma.adminCredential.findUnique({
        where: { 
          username: username.toLowerCase(),
          isActive: true
        },
        select: {
          id: true,
          username: true,
          passwordHash: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true
        }
      });

      let member = null;
      let isValidPassword = false;

      if (adminCredential) {
        // Use database credentials
        isValidPassword = await bcrypt.compare(password, adminCredential.passwordHash);
        
        if (isValidPassword) {
          member = {
            username: adminCredential.username,
            name: adminCredential.name,
            email: adminCredential.email,
            role: adminCredential.role,
            permissions: adminCredential.permissions
          };

          // Update last login time
          await prisma.adminCredential.update({
            where: { id: adminCredential.id },
            data: { lastLogin: new Date() }
          }).catch(error => {
            console.log('Failed to update last login:', error);
          });
        }
      } else {
        // Fallback to hardcoded credentials (for existing system)
        const fallbackMember = FALLBACK_CREDENTIALS[username.toLowerCase()];
        
        if (fallbackMember) {
          isValidPassword = password === fallbackMember.password;
          
          if (isValidPassword) {
            member = {
              ...fallbackMember,
              username: username
            };
            
            // Log that fallback credentials were used
            console.log(`Using fallback credentials for ${username} - consider migrating to database`);
          }
        }
      }

      if (!member) {
        console.log(`Failed admin login attempt - unknown username: ${username} at ${new Date().toISOString()}`);
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      if (!isValidPassword) {
        console.log(`Failed admin login attempt - wrong password for ${username} at ${new Date().toISOString()}`);
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate JWT token with role and permissions
      const token = jwt.sign(
        { 
          username: member.username,
          role: member.role,
          name: member.name,
          email: member.email,
          permissions: member.permissions,
          loginTime: Date.now()
        },
        JWT_SECRET,
        { expiresIn: '8h' } // Token expires in 8 hours
      );

      // Log successful login
      console.log(`Successful admin login for ${member.name} (${member.username}, ${member.role}) at ${new Date().toISOString()}`);

      return NextResponse.json(
        { 
          message: 'Login successful',
          token,
          user: {
            username: member.username,
            name: member.name,
            role: member.role,
            email: member.email,
            permissions: member.permissions
          },
          expiresIn: '8h',
          usingFallback: !adminCredential // Indicate if fallback was used
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error during login, falling back to hardcoded credentials:', dbError);
      
      // Fallback to hardcoded credentials if database fails
      const fallbackMember = FALLBACK_CREDENTIALS[username.toLowerCase()];
      
      if (!fallbackMember) {
        console.log(`Failed admin login attempt - unknown username: ${username} at ${new Date().toISOString()}`);
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = password === fallbackMember.password;
      
      if (!isValidPassword) {
        console.log(`Failed admin login attempt - wrong password for ${username} at ${new Date().toISOString()}`);
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          username: username,
          role: fallbackMember.role,
          name: fallbackMember.name,
          email: fallbackMember.email,
          permissions: fallbackMember.permissions,
          loginTime: Date.now()
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      console.log(`Successful admin login (fallback) for ${fallbackMember.name} (${username}, ${fallbackMember.role}) at ${new Date().toISOString()}`);

      return NextResponse.json(
        { 
          message: 'Login successful',
          token,
          user: {
            username: username,
            name: fallbackMember.name,
            role: fallbackMember.role,
            email: fallbackMember.email,
            permissions: fallbackMember.permissions
          },
          expiresIn: '8h',
          usingFallback: true
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 