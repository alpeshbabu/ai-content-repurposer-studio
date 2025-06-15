import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tableExists } from '@/lib/db-setup';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the OverageCharge table exists
    const tableExistsResult = await tableExists('OverageCharge');
    
    if (!tableExistsResult) {
      // Return empty charges if table doesn't exist - this is not an error
      return NextResponse.json({
        charges: [],
        totalPending: 0,
        message: 'Overage charges table not yet available'
      });
    }

    // Get user's overage charges
    const charges = await prisma.overageCharge.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    // Calculate total pending amount
    const totalPending = charges
      .filter(charge => charge.status === 'pending')
      .reduce((sum, charge) => sum + charge.amount, 0);

    return NextResponse.json({
      charges,
      totalPending
    });
  } catch (error) {
    console.error('[OVERAGE_CHARGES_GET_ERROR]', error);
    
    // Handle the specific case of table not existing more gracefully
    if (error instanceof Error && 
        (error.message.includes('does not exist') || 
         error.message.includes('relation') || 
         error.message.includes('table'))) {
      return NextResponse.json({
        charges: [],
        totalPending: 0,
        message: 'Overage charges not yet available'
      });
    }
    
    return NextResponse.json({
      charges: [],
      totalPending: 0,
      message: 'Failed to retrieve overage charges'
    }, { status: 500 });
  }
} 