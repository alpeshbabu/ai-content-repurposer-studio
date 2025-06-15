import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    // Validate admin authentication (optional for logout, but good for logging)
    const validation = await validateAdminRequest(request);
    
    if (validation.isValid && validation.payload) {
      // Log successful logout
      console.log(`Admin logout for username: ${validation.payload.username} at ${new Date().toISOString()}`);
    }

    // Since we're using localStorage-based tokens, logout is handled client-side
    // This endpoint is mainly for logging purposes and can be extended for
    // server-side token blacklisting if needed
    
    return NextResponse.json(
      { 
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Admin logout error:', error);
    // Even if there's an error, we should allow logout to proceed
    return NextResponse.json(
      { 
        message: 'Logout completed',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
} 