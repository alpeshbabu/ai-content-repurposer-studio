import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { z } from 'zod'
import { withCache } from '@/lib/cache-dynamic'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const settingsSchema = z.object({
  brandVoice: z.string().max(1000, 'Brand voice must be less than 1000 characters').optional().nullable(),
  preferredPlatforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread'])).optional().default([])
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check cache first
    const cachedSettings = await withCache(async (cache) => {
      return await cache.getUserSettings(userId);
    })
    if (cachedSettings) {
      return NextResponse.json(cachedSettings)
    }

    const settings = await withPrisma(async (prisma) => {
      return await prisma.settings.findUnique({ 
        where: { userId } 
      });
    });
    
    // Cache the settings
    if (settings) {
      await withCache(async (cache) => {
        await cache.setUserSettings(userId, settings);
      });
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      return new NextResponse('Invalid JSON', { status: 400 })
    }

    const validation = settingsSchema.safeParse(body)
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
      )
    }

    const { brandVoice, preferredPlatforms } = validation.data

    const settings = await withPrisma(async (prisma) => {
      return await prisma.settings.upsert({
        where: { userId },
        update: { 
          brandVoice, 
          preferredPlatforms,
          updatedAt: new Date()
        },
        create: { 
          userId, 
          brandVoice, 
          preferredPlatforms 
        },
      });
    });
    
    // Invalidate user settings cache
    await withCache(async (cache) => {
      await cache.invalidateUserSettings(userId);
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SETTINGS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 