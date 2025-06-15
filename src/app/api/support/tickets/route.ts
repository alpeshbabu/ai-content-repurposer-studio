import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/support/tickets - List all tickets for the user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse query parameters for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    try {
      // Build the where clause
      const whereClause: any = {
        userId: userId
      };

      if (status) {
        whereClause.status = status;
      }

      // Execute queries using Prisma client
      const [tickets, totalCount] = await Promise.all([
        prisma.supportTicket.findMany({
          where: whereClause,
          select: {
            id: true,
            subject: true,
            description: true,
            status: true,
            priority: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                replies: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          skip: skip,
          take: limit
        }),
        prisma.supportTicket.count({
          where: whereClause
        })
      ]);

      // Transform the data to match the expected format
      const transformedTickets = tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        replyCount: ticket._count.replies
      }));

      return NextResponse.json({
        tickets: transformedTickets,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });

    } catch (dbError) {
      console.error('[DB_QUERY_ERROR]', dbError);
      // Return empty results with helpful message
      return NextResponse.json({
        tickets: [],
        pagination: { total: 0, page, limit, pages: 0 },
        message: 'Could not retrieve tickets at this time. Please try again later.'
      });
    }
  } catch (error) {
    console.error('[TICKETS_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/support/tickets - Create a new ticket
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { subject, description, category, priority = 'medium' } = await req.json();

    // Validate required fields
    if (!subject || !description || !category) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate field values
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validCategories = ['account', 'subscription', 'billing', 'content', 'technical', 'other'];

    if (!validPriorities.includes(priority)) {
      return new NextResponse('Invalid priority', { status: 400 });
    }

    if (!validCategories.includes(category)) {
      return new NextResponse('Invalid category', { status: 400 });
    }

    try {
      // Create ticket using Prisma client
      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'open'
        },
        select: {
          id: true,
          subject: true,
          description: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        ticket: {
          ...ticket,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString()
        }
      }, { status: 201 });

    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while creating ticket', { status: 500 });
    }
  } catch (error) {
    console.error('[TICKET_CREATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 