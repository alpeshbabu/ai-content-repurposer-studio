import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      tableName
    );
    
    return result && result[0] && result[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// GET /api/support/tickets/[ticketId] - Get a specific ticket with replies
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ticketId } = await params;

    // Check if required tables exist
    const supportTicketExists = await tableExists('SupportTicket');
    const ticketReplyExists = await tableExists('TicketReply');
    
    if (!supportTicketExists) {
      console.error('SupportTicket table does not exist');
      return NextResponse.json({ 
        ticket: null,
        replies: [],
        message: 'Support system is not initialized yet' 
      });
    }

    try {
      // Get ticket with replies
      const ticket = await prisma.$queryRawUnsafe(`
        SELECT 
          t.id, t.subject, t.description, t.status, t.priority, t.category, 
          t."createdAt", t."updatedAt", t."userId"
        FROM "SupportTicket" t
        WHERE t.id = $1 AND t."userId" = $2
      `, ticketId, userId);
      
      if (!ticket || !Array.isArray(ticket) || ticket.length === 0) {
        return new NextResponse('Ticket not found', { status: 404 });
      }
  
      // Get ticket replies if the table exists
      let replies: any[] = [];
      if (ticketReplyExists) {
        replies = await prisma.$queryRawUnsafe(`
          SELECT 
            r.id, r.message, r."isStaff", r."createdAt", r."attachmentUrl",
            u.name, u.email
          FROM "TicketReply" r
          JOIN "User" u ON r."userId" = u.id
          WHERE r."ticketId" = $1
          ORDER BY r."createdAt" ASC
        `, ticketId);
      }
  
      return NextResponse.json({
        ticket: ticket[0],
        replies: replies || []
      });
    } catch (dbError) {
      console.error('[DB_QUERY_ERROR]', dbError);
      return NextResponse.json({ 
        ticket: null,
        replies: [],
        message: 'Could not retrieve ticket details at this time' 
      });
    }
  } catch (error) {
    console.error('[TICKET_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/support/tickets/[ticketId] - Update a ticket
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ticketId } = await params;
    const { status } = await req.json();

    // Check if SupportTicket table exists
    const supportTicketExists = await tableExists('SupportTicket');
    
    if (!supportTicketExists) {
      console.error('SupportTicket table does not exist');
      return new NextResponse('Support system is not initialized yet', { status: 503 });
    }

    try {
      // Check if the ticket exists and belongs to the user
      const ticketExists = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM "SupportTicket" WHERE id = $1 AND "userId" = $2
      `, ticketId, userId);
  
      if (!ticketExists || ticketExists.length === 0) {
        return new NextResponse('Ticket not found', { status: 404 });
      }
  
      // Update ticket status
      if (status) {
        await prisma.$executeRawUnsafe(`
          UPDATE "SupportTicket" 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, status, ticketId);
      }
  
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while updating ticket', { status: 500 });
    }
  } catch (error) {
    console.error('[TICKET_UPDATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/support/tickets/[ticketId] - Delete a ticket
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ticketId } = await params;

    // Check if required tables exist
    const supportTicketExists = await tableExists('SupportTicket');
    const ticketReplyExists = await tableExists('TicketReply');
    
    if (!supportTicketExists) {
      console.error('SupportTicket table does not exist');
      return new NextResponse('Support system is not initialized yet', { status: 503 });
    }

    try {
      // Check if the ticket exists and belongs to the user
      const ticketExists = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM "SupportTicket" WHERE id = $1 AND "userId" = $2
      `, ticketId, userId);
  
      if (!ticketExists || ticketExists.length === 0) {
        return new NextResponse('Ticket not found', { status: 404 });
      }
  
      // Delete all replies first if the table exists
      if (ticketReplyExists) {
        await prisma.$executeRawUnsafe(`
          DELETE FROM "TicketReply" WHERE "ticketId" = $1
        `, ticketId);
      }
  
      // Then delete the ticket
      await prisma.$executeRawUnsafe(`
        DELETE FROM "SupportTicket" WHERE id = $1
      `, ticketId);
  
      return new NextResponse(null, { status: 204 });
    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while deleting ticket', { status: 500 });
    }
  } catch (error) {
    console.error('[TICKET_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 