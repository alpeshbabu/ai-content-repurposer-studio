import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/support/tickets/[ticketId]/replies - Get all replies for a ticket
export async function GET(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    // Verify admin JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Authorization header required', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const adminPayload = verifyAdminToken(token);
    
    if (!adminPayload) {
      return new NextResponse('Invalid or expired admin token', { status: 401 });
    }

    const { ticketId } = await params;

    if (!ticketId) {
      return new NextResponse('Ticket ID is required', { status: 400 });
    }

    try {
      // Check if ticket exists
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { id: true }
      });

      if (!ticket) {
        return new NextResponse('Ticket not found', { status: 404 });
      }

      // Fetch replies with user information
      const replies = await prisma.ticketReply.findMany({
        where: { ticketId },
        select: {
          id: true,
          message: true,
          isStaff: true,
          createdAt: true,
          attachmentUrl: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Transform the data
      const transformedReplies = replies.map(reply => ({
        id: reply.id,
        message: reply.message,
        isStaff: reply.isStaff,
        createdAt: reply.createdAt.toISOString(),
        attachmentUrl: reply.attachmentUrl,
        name: reply.user.name || reply.user.email,
        email: reply.user.email
      }));

      return NextResponse.json({
        replies: transformedReplies
      });

    } catch (dbError) {
      console.error('[ADMIN_REPLIES_GET_DB_ERROR]', dbError);
      return new NextResponse('Database error while fetching replies', { status: 500 });
    }
  } catch (error) {
    console.error('[ADMIN_REPLIES_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/admin/support/tickets/[ticketId]/replies - Create a new reply as admin
export async function POST(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    // Verify admin JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Authorization header required', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const adminPayload = verifyAdminToken(token);
    
    if (!adminPayload) {
      return new NextResponse('Invalid or expired admin token', { status: 401 });
    }

    const { ticketId } = await params;
    const { message, isStaff = true } = await req.json();

    if (!ticketId) {
      return new NextResponse('Ticket ID is required', { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new NextResponse('Message is required', { status: 400 });
    }

    try {
      // Check if ticket exists
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { id: true, status: true, subject: true, userId: true }
      });

      if (!ticket) {
        return new NextResponse('Ticket not found', { status: 404 });
      }

      // Create the reply and update ticket in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the reply using the ticket's original user ID for replies
        const reply = await tx.ticketReply.create({
          data: {
            ticketId,
            userId: ticket.userId, // Use the original ticket creator's ID
            message: message.trim(),
            isStaff: true, // Admin replies are always marked as staff
          },
          select: {
            id: true,
            message: true,
            isStaff: true,
            createdAt: true,
            attachmentUrl: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });

        // Update ticket status if it was closed/resolved, move it back to in-progress
        if (ticket.status === 'closed' || ticket.status === 'resolved') {
          await tx.supportTicket.update({
            where: { id: ticketId },
            data: { 
              status: 'in-progress',
              updatedAt: new Date()
            }
          });
        } else {
          // Just update the updatedAt timestamp
          await tx.supportTicket.update({
            where: { id: ticketId },
            data: { updatedAt: new Date() }
          });
        }

        return reply;
      });

      console.log(`Admin reply added to ticket ${ticketId} by ${adminPayload.username}`);

      // Transform the reply data
      const transformedReply = {
        id: result.id,
        message: result.message,
        isStaff: result.isStaff,
        createdAt: result.createdAt.toISOString(),
        attachmentUrl: result.attachmentUrl,
        name: result.user.name || result.user.email,
        email: result.user.email
      };

      return NextResponse.json({
        success: true,
        reply: transformedReply
      }, { status: 201 });

    } catch (dbError) {
      console.error('[ADMIN_REPLIES_POST_DB_ERROR]', dbError);
      return new NextResponse('Database error while creating reply', { status: 500 });
    }
  } catch (error) {
    console.error('[ADMIN_REPLIES_POST_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 