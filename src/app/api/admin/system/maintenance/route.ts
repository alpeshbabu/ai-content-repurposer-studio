import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';

// In a real application, you would store this in a database or persistent storage
// For now, we'll use a simple in-memory variable
let maintenanceMode = false;

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    return NextResponse.json({
      success: true,
      maintenanceMode,
      lastToggled: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MAINTENANCE_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return new NextResponse('Invalid maintenance mode value', { status: 400 });
    }

    // Toggle maintenance mode
    maintenanceMode = enabled;

    // In a real application, you would:
    // 1. Store this in a database
    // 2. Update environment variables
    // 3. Notify all running instances
    // 4. Update load balancer configuration

    return NextResponse.json({
      success: true,
      maintenanceMode,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MAINTENANCE_TOGGLE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 