import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'partnership', 'media'], {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim()
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { name, email, subject, category, message } = validation.data;

    // Log the contact message
    const contactData = {
      timestamp: new Date().toISOString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category,
      message: message.trim(),
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('[CONTACT_MESSAGE_RECEIVED]', contactData);

    // Here you could integrate with email services like:
    // - Send notification email to support team
    // - Add to external CRM or helpdesk system
    // - Send auto-reply email to the user
    // For now, we'll just log and return success

    return NextResponse.json(
      {
        success: true,
        message: 'Contact message received successfully',
        id: contactData.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[CONTACT_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 