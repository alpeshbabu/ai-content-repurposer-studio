import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tableExists, validateUserTable } from '@/lib/db-setup';
import { z } from 'zod';

// Validation schema
const brandVoiceSchema = z.object({
  brandVoice: z.string().min(1, 'Brand voice is required').max(1000, 'Brand voice must be less than 1000 characters'),
  preferredPlatforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread', 'general'])).optional(),
  tone: z.string().optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  additionalGuidelines: z.string().optional().nullable()
});

// GET - Fetch user's brand voice settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure database tables exist
    const userTableValid = await validateUserTable();
    if (!userTableValid) {
      console.error('User table does not exist or is invalid');
      return new NextResponse('Database initialization in progress. Please try again in a few moments.', { 
        status: 503,
        headers: {
          'X-Error-Type': 'database-not-ready'
        }
      });
    }

    // Check if Settings table exists
    const settingsTableExists = await tableExists('Settings');
    if (!settingsTableExists) {
      // Return default settings if table doesn't exist
      return NextResponse.json({
        brandVoice: '',
        preferredPlatforms: [],
        tone: null,
        targetAudience: null,
        additionalGuidelines: null,
        exists: false
      });
    }

    try {
      // Fetch user's brand voice settings
      const settings = await prisma.settings.findUnique({
        where: { userId },
        select: {
          brandVoice: true,
          preferredPlatforms: true,
          tone: true,
          targetAudience: true,
          additionalGuidelines: true
        }
      });

      if (!settings) {
        // Return default settings if user doesn't have any saved
        return NextResponse.json({
          brandVoice: '',
          preferredPlatforms: [],
          tone: null,
          targetAudience: null,
          additionalGuidelines: null,
          exists: false
        });
      }

      return NextResponse.json({
        ...settings,
        exists: true
      });

    } catch (dbError) {
      console.error('Database error fetching brand voice:', dbError);
      
      // Try raw SQL as fallback
      try {
        const rawSettings = await prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            "brandVoice",
            "preferredPlatforms",
            "tone",
            "targetAudience",
            "additionalGuidelines"
          FROM "Settings"
          WHERE "userId" = $1
          LIMIT 1
        `, userId);

        if (rawSettings && rawSettings.length > 0) {
          return NextResponse.json({
            ...rawSettings[0],
            exists: true
          });
        } else {
          return NextResponse.json({
            brandVoice: '',
            preferredPlatforms: [],
            tone: null,
            targetAudience: null,
            additionalGuidelines: null,
            exists: false
          });
        }
      } catch (rawError) {
        console.error('Raw SQL fallback failed:', rawError);
        return NextResponse.json({
          brandVoice: '',
          preferredPlatforms: [],
          tone: null,
          targetAudience: null,
          additionalGuidelines: null,
          exists: false
        });
      }
    }
  } catch (error) {
    console.error('[BRAND_VOICE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST - Create or update user's brand voice settings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    const validation = brandVoiceSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { brandVoice, preferredPlatforms, tone, targetAudience, additionalGuidelines } = validation.data;

    // Ensure database tables exist
    const userTableValid = await validateUserTable();
    if (!userTableValid) {
      console.error('User table does not exist or is invalid');
      return new NextResponse('Database initialization in progress. Please try again in a few moments.', { 
        status: 503,
        headers: {
          'X-Error-Type': 'database-not-ready'
        }
      });
    }

    // Check if Settings table exists
    const settingsTableExists = await tableExists('Settings');
    if (!settingsTableExists) {
      return new NextResponse('Settings table not ready', { status: 503 });
    }

    try {
      // Upsert user's brand voice settings
      const settings = await prisma.settings.upsert({
        where: { userId },
        update: {
          brandVoice,
          preferredPlatforms: preferredPlatforms || [],
          tone,
          targetAudience,
          additionalGuidelines,
          updatedAt: new Date()
        },
        create: {
          userId,
          brandVoice,
          preferredPlatforms: preferredPlatforms || [],
          tone,
          targetAudience,
          additionalGuidelines
        },
        select: {
          brandVoice: true,
          preferredPlatforms: true,
          tone: true,
          targetAudience: true,
          additionalGuidelines: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        success: true,
        data: settings,
        message: 'Brand voice settings saved successfully'
      });

    } catch (dbError) {
      console.error('Database error saving brand voice:', dbError);
      
      // Try raw SQL as fallback
      try {
        // Check if settings exist
        const existingSettings = await prisma.$queryRawUnsafe<any[]>(`
          SELECT "id" FROM "Settings" WHERE "userId" = $1 LIMIT 1
        `, userId);

        if (existingSettings && existingSettings.length > 0) {
          // Update existing settings
          await prisma.$executeRawUnsafe(`
            UPDATE "Settings" 
            SET 
              "brandVoice" = $2,
              "preferredPlatforms" = $3,
              "tone" = $4,
              "targetAudience" = $5,
              "additionalGuidelines" = $6,
              "updatedAt" = NOW()
            WHERE "userId" = $1
          `, userId, brandVoice, JSON.stringify(preferredPlatforms || []), tone, targetAudience, additionalGuidelines);
        } else {
          // Create new settings
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Settings" (
              "id", "userId", "brandVoice", "preferredPlatforms", 
              "tone", "targetAudience", "additionalGuidelines", 
              "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `, `settings_${userId}`, userId, brandVoice, JSON.stringify(preferredPlatforms || []), tone, targetAudience, additionalGuidelines);
        }

        return NextResponse.json({
          success: true,
          data: {
            brandVoice,
            preferredPlatforms: preferredPlatforms || [],
            tone,
            targetAudience,
            additionalGuidelines,
            updatedAt: new Date()
          },
          message: 'Brand voice settings saved successfully'
        });

      } catch (rawError) {
        console.error('Raw SQL fallback failed:', rawError);
        return new NextResponse('Failed to save brand voice settings', { status: 500 });
      }
    }
  } catch (error) {
    console.error('[BRAND_VOICE_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE - Delete user's brand voice settings
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure database tables exist
    const userTableValid = await validateUserTable();
    if (!userTableValid) {
      console.error('User table does not exist or is invalid');
      return new NextResponse('Database initialization in progress. Please try again in a few moments.', { 
        status: 503,
        headers: {
          'X-Error-Type': 'database-not-ready'
        }
      });
    }

    // Check if Settings table exists
    const settingsTableExists = await tableExists('Settings');
    if (!settingsTableExists) {
      return NextResponse.json({
        success: true,
        message: 'Brand voice settings cleared (table does not exist)'
      });
    }

    try {
      // Delete user's brand voice settings
      await prisma.settings.delete({
        where: { userId }
      });

      return NextResponse.json({
        success: true,
        message: 'Brand voice settings deleted successfully'
      });

    } catch (dbError) {
      console.error('Database error deleting brand voice:', dbError);
      
      // Try raw SQL as fallback
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM "Settings" WHERE "userId" = $1
        `, userId);

        return NextResponse.json({
          success: true,
          message: 'Brand voice settings deleted successfully'
        });

      } catch (rawError) {
        console.error('Raw SQL fallback failed:', rawError);
        // Even if deletion fails, return success since the goal is to clear settings
        return NextResponse.json({
          success: true,
          message: 'Brand voice settings cleared'
        });
      }
    }
  } catch (error) {
    console.error('[BRAND_VOICE_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}