import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { aiService } from '@/lib/ai-service';

const bulkRepurposeSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item must be selected'),
  platforms: z.array(z.string()).optional().default(['Twitter', 'LinkedIn', 'Instagram'])
});

// POST - Bulk repurpose content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user with plan details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionPlan: true,
        usageThisMonth: true,
        settings: {
          select: {
            brandVoice: true,
            preferredPlatforms: true
          }
        }
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await request.json();
    const { ids, platforms } = bulkRepurposeSchema.parse(body);

    // Check usage limits
    const monthlyLimit = getMonthlyLimit(user.subscriptionPlan);
    const requiredUsage = ids.length * platforms.length;
    
    if (user.usageThisMonth + requiredUsage > monthlyLimit) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          message: `This bulk operation would require ${requiredUsage} repurposes, but you only have ${monthlyLimit - user.usageThisMonth} remaining this month.`
        },
        { status: 429 }
      );
    }

    // Verify all content items belong to the user
    const userContent = await prisma.content.findMany({
      where: {
        id: { in: ids },
        userId: user.id
      },
      select: { 
        id: true, 
        title: true, 
        originalContent: true, 
        contentType: true,
        repurposed: {
          select: { platform: true }
        }
      }
    });

    if (userContent.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some content items not found or not owned by user' },
        { status: 404 }
      );
    }

    const results = [];
    let totalRepurposed = 0;
    let errors = [];

    // Process each content item
    for (const content of userContent) {
      try {
        // Filter platforms that haven't been repurposed yet
        const existingPlatforms = content.repurposed.map(r => r.platform);
        const platformsToRepurpose = platforms.filter(p => !existingPlatforms.includes(p));
        
        if (platformsToRepurpose.length === 0) {
          results.push({
            contentId: content.id,
            title: content.title,
            status: 'skipped',
            message: 'Already repurposed for all selected platforms'
          });
          continue;
        }

        const repurposedItems = [];

        // Generate repurposed content for each platform
        for (const platform of platformsToRepurpose) {
          try {
            const repurposeRequest = {
              originalContent: content.originalContent,
              platforms: [platform],
              brandVoice: user.settings?.brandVoice || undefined
            };
            
            const repurposedResults = await aiService.repurposeContent(repurposeRequest);
            const repurposedContent = repurposedResults[0]?.content || '';

            // Save to database
            const savedRepurpose = await prisma.repurposedContent.create({
              data: {
                contentId: content.id,
                platform,
                content: repurposedContent
              }
            });

            repurposedItems.push({
              platform,
              content: repurposedContent,
              id: savedRepurpose.id
            });

            totalRepurposed++;
          } catch (platformError) {
            console.error(`Error repurposing for ${platform}:`, platformError);
            errors.push({
              contentId: content.id,
              platform,
              error: `Failed to repurpose for ${platform}`
            });
          }
        }

        results.push({
          contentId: content.id,
          title: content.title,
          status: repurposedItems.length > 0 ? 'success' : 'failed',
          repurposed: repurposedItems,
          platformsProcessed: platformsToRepurpose.length,
          platformsSuccess: repurposedItems.length
        });

      } catch (contentError) {
        console.error(`Error processing content ${content.id}:`, contentError);
        errors.push({
          contentId: content.id,
          error: 'Failed to process content'
        });
        
        results.push({
          contentId: content.id,
          title: content.title,
          status: 'failed',
          message: 'Failed to process content'
        });
      }
    }

    // Update user usage
    if (totalRepurposed > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          usageThisMonth: {
            increment: totalRepurposed
          }
        }
      });
    }

    // Log audit trail
    await logBulkAction(user.id, 'BULK_REPURPOSE', {
      contentIds: ids,
      platforms,
      totalRepurposed,
      successCount: results.filter(r => r.status === 'success').length,
      failureCount: results.filter(r => r.status === 'failed').length,
      skipCount: results.filter(r => r.status === 'skipped').length
    });

    return NextResponse.json({
      success: true,
      totalProcessed: ids.length,
      totalRepurposed,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    });

  } catch (error) {
    console.error('[BULK_REPURPOSE_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk repurpose operation' },
      { status: 500 }
    );
  }
}

// Helper functions
function getMonthlyLimit(plan: string): number {
  switch (plan) {
    case 'basic': return 60;
    case 'pro': return 150;
    case 'agency': return 450;
    default: return 5; // free plan
  }
}

async function logBulkAction(userId: string, action: string, details: any) {
  console.log('[AUDIT_LOG]', {
    userId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
} 