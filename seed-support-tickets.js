// Script to create seed data for support tickets
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script for support tickets...');
  
  try {
    // First, check if tables exist
    const supportTicketExists = await checkTableExists('SupportTicket');
    const ticketReplyExists = await checkTableExists('TicketReply');
    
    if (!supportTicketExists) {
      console.error('SupportTicket table does not exist. Please run `npx prisma db push` first.');
      return;
    }
    
    // Create a test user if one doesn't exist
    const user = await findOrCreateUser();
    console.log(`Using user with ID: ${user.id}`);
    
    // Create test tickets
    const tickets = await createTestTickets(user.id);
    
    // Add replies if the TicketReply table exists
    if (ticketReplyExists) {
      for (const ticket of tickets) {
        await createTestReplies(ticket.id, user.id);
      }
    } else {
      console.log('TicketReply table does not exist. Skipping reply creation.');
    }
    
    console.log('Seed data created successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
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

async function findOrCreateUser() {
  // Try to find an existing user
  let user = await prisma.user.findFirst();
  
  // If no user exists, create a test user
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'seed-user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
      },
    });
    console.log('Created test user');
  }
  
  return user;
}

async function createTestTickets(userId) {
  const categories = ['account', 'subscription', 'billing', 'content', 'technical', 'other'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];
  
  const ticketData = [
    {
      subject: 'Cannot access my account',
      description: 'I am having trouble logging into my account. I keep getting an error message.',
      category: 'account',
      priority: 'high',
      status: 'open',
    },
    {
      subject: 'Billing question about my subscription',
      description: 'I was charged twice for my last subscription payment. Can you please help?',
      category: 'billing',
      priority: 'medium',
      status: 'in-progress',
    },
    {
      subject: 'Feature request for content repurposing',
      description: 'It would be great if you could add support for repurposing content to TikTok.',
      category: 'content',
      priority: 'low',
      status: 'open',
    },
    {
      subject: 'Technical issue with AI generation',
      description: 'The AI is generating irrelevant content for my blog posts. Can you please investigate?',
      category: 'technical',
      priority: 'urgent',
      status: 'in-progress',
    },
    {
      subject: 'Help with team management',
      description: 'I need help understanding how to add team members to my account.',
      category: 'account',
      priority: 'medium',
      status: 'resolved',
    },
  ];
  
  const tickets = [];
  
  for (const data of ticketData) {
    // Check if a ticket with this subject already exists
    const existingTicket = await prisma.$queryRawUnsafe(
      `SELECT id FROM "SupportTicket" WHERE subject = $1 AND "userId" = $2 LIMIT 1`,
      data.subject, userId
    );
    
    if (existingTicket && existingTicket.length > 0) {
      console.log(`Ticket "${data.subject}" already exists, skipping`);
      tickets.push({ id: existingTicket[0].id, ...data });
      continue;
    }
    
    // Create a new ticket
    const ticketId = `seed-ticket-${Math.random().toString(36).substring(2, 10)}`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "SupportTicket" 
      (id, "userId", subject, description, category, priority, status, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, ticketId, userId, data.subject, data.description, data.category, data.priority, data.status);
    
    console.log(`Created ticket: ${data.subject}`);
    tickets.push({ id: ticketId, ...data });
  }
  
  return tickets;
}

async function createTestReplies(ticketId, userId) {
  // Check if this ticket already has replies
  const existingReplies = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "TicketReply" WHERE "ticketId" = $1`,
    ticketId
  );
  
  if (existingReplies && existingReplies[0] && existingReplies[0].count > 0) {
    console.log(`Ticket ${ticketId} already has ${existingReplies[0].count} replies, skipping`);
    return;
  }
  
  // Sample replies
  const replies = [
    {
      message: 'I am experiencing this issue on both desktop and mobile browsers.',
      isStaff: false,
    },
    {
      message: 'Thank you for contacting us. We are looking into this issue and will get back to you shortly.',
      isStaff: true,
    },
    {
      message: 'Could you provide more details about when this started happening?',
      isStaff: true,
    },
    {
      message: 'The problem started yesterday after I updated my subscription plan.',
      isStaff: false,
    },
  ];
  
  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    const replyId = `seed-reply-${ticketId}-${i}`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TicketReply" 
      (id, "ticketId", "userId", message, "isStaff", "createdAt", "attachmentUrl") 
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} HOURS', NULL)
    `, replyId, ticketId, userId, reply.message, reply.isStaff);
  }
  
  console.log(`Created ${replies.length} replies for ticket ${ticketId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 