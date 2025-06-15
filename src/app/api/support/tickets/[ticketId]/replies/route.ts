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

// GET /api/support/tickets/[ticketId]/replies - Get all replies for a ticket
export async function GET(
  req: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ticketId } = await context.params;

    // Check if required tables exist
    const supportTicketExists = await tableExists('SupportTicket');
    const ticketReplyExists = await tableExists('TicketReply');
    
    if (!supportTicketExists || !ticketReplyExists) {
      console.error('Required tables do not exist');
      return NextResponse.json({ 
        replies: [],
        message: 'Support system is not fully initialized yet' 
      });
    }

    try {
      // Check if the ticket exists and belongs to the user
      const ticketExists = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM "SupportTicket" WHERE id = $1 AND "userId" = $2
      `, ticketId, userId);
  
      if (!ticketExists || ticketExists.length === 0) {
        return new NextResponse('Ticket not found', { status: 404 });
      }
  
      // Get replies
      const replies = await prisma.$queryRawUnsafe(`
        SELECT 
          r.id, r.message, r."isStaff", r."createdAt", r."attachmentUrl",
          u.name, u.email
        FROM "TicketReply" r
        JOIN "User" u ON r."userId" = u.id
        WHERE r."ticketId" = $1
        ORDER BY r."createdAt" ASC
      `, ticketId);
  
      return NextResponse.json({ replies: replies || [] });
    } catch (dbError) {
      console.error('[DB_QUERY_ERROR]', dbError);
      return NextResponse.json({ 
        replies: [],
        message: 'Could not retrieve replies at this time' 
      });
    }
  } catch (error) {
    console.error('[REPLIES_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/support/tickets/[ticketId]/replies - Add a reply to a ticket
export async function POST(
  req: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ticketId } = await context.params;
    const { message, attachmentUrl } = await req.json();

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // Check if required tables exist
    const supportTicketExists = await tableExists('SupportTicket');
    const ticketReplyExists = await tableExists('TicketReply');
    
    if (!supportTicketExists || !ticketReplyExists) {
      console.error('Required tables do not exist');
      return new NextResponse('Support system is not fully initialized yet', { status: 503 });
    }

    try {
      // Check if the ticket exists and belongs to the user
      const ticketExists = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM "SupportTicket" WHERE id = $1 AND "userId" = $2
      `, ticketId, userId);
  
      if (!ticketExists || ticketExists.length === 0) {
        return new NextResponse('Ticket not found', { status: 404 });
      }
  
      // Create reply
      const newReplyId = `cuid_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "TicketReply" 
        (id, "ticketId", "userId", message, "isStaff", "createdAt", "attachmentUrl") 
        VALUES ($1, $2, $3, $4, false, NOW(), $5)
      `, newReplyId, ticketId, userId, message, attachmentUrl || null);
  
      // Update ticket status to "in-progress" if it was "open"
      await prisma.$executeRawUnsafe(`
        UPDATE "SupportTicket" 
        SET status = 'in-progress', "updatedAt" = NOW()
        WHERE id = $1 AND status = 'open'
      `, ticketId);
  
      // Get the created reply
      const reply = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(`
        SELECT 
          r.id, r.message, r."isStaff", r."createdAt", r."attachmentUrl",
          u.name, u.email
        FROM "TicketReply" r
        JOIN "User" u ON r."userId" = u.id
        WHERE r.id = $1
      `, newReplyId);
  
      return NextResponse.json({ reply: reply && reply.length > 0 ? reply[0] : null }, { status: 201 });
    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while creating reply', { status: 500 });
    }
  } catch (error) {
    console.error('[REPLY_CREATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 