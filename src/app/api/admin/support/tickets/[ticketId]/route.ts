import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

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
      // Fetch ticket details with user information and replies
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          subject: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          replies: {
            select: {
              id: true,
              message: true,
              createdAt: true,
              isStaff: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!ticket) {
        return new NextResponse('Ticket not found', { status: 404 });
      }

      // Transform the data
      const transformedTicket = {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        userId: ticket.userId,
        user: ticket.user,
        replies: ticket.replies.map(reply => ({
          id: reply.id,
          message: reply.message,
          createdAt: reply.createdAt.toISOString(),
          isStaff: reply.isStaff,
          user: reply.user
        }))
      };

      return NextResponse.json({
        ticket: transformedTicket
      });

    } catch (dbError) {
      console.error('[ADMIN_TICKET_DETAIL_DB_ERROR]', dbError);
      return new NextResponse('Database error while fetching ticket', { status: 500 });
    }
  } catch (error) {
    console.error('[ADMIN_TICKET_DETAIL_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 