import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiContentAnalyzer } from '@/lib/ai-content-analyzer';
import { rateLimiter } from '@/lib/rate-limit';
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  contentType: z.string().optional(),
  analysisType: z.enum(['quality', 'optimization', 'keywords', 'plagiarism', 'multilang']).default('quality'),
  targetPlatform: z.string().optional(),
  targetAudience: z.string().optional(),
  targetLanguages: z.array(z.string()).optional(),
  industry: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - more restrictive for AI operations
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'ai_analysis');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = analyzeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      content, 
      contentType, 
      analysisType, 
      targetPlatform, 
      targetAudience, 
      targetLanguages,
      industry 
    } = validationResult.data;

    let result;

    switch (analysisType) {
      case 'quality':
        result = await aiContentAnalyzer.analyzeContent(content, session.user.id, contentType);
        break;

      case 'optimization':
        if (!targetPlatform) {
          return NextResponse.json(
            { error: 'Target platform required for optimization analysis' },
            { status: 400 }
          );
        }
        result = await aiContentAnalyzer.generateOptimizationSuggestions(
          content, 
          targetPlatform, 
          session.user.id
        );
        break;

      case 'keywords':
        if (!targetAudience) {
          return NextResponse.json(
            { error: 'Target audience required for keyword analysis' },
            { status: 400 }
          );
        }
        result = await aiContentAnalyzer.generateKeywordSuggestions(
          content, 
          targetAudience, 
          session.user.id
        );
        break;

      case 'plagiarism':
        result = await aiContentAnalyzer.checkPlagiarism(content, session.user.id);
        break;

      case 'multilang':
        if (!targetLanguages || targetLanguages.length === 0) {
          return NextResponse.json(
            { error: 'Target languages required for multi-language analysis' },
            { status: 400 }
          );
        }
        result = await aiContentAnalyzer.analyzeMultiLanguageContent(
          content, 
          targetLanguages, 
          session.user.id
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      analysisType,
      data: result,
      metadata: {
        contentLength: content.length,
        analysisTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

// Get trending topics endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'ai_analysis');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'general';

    const trendingTopics = await aiContentAnalyzer.getTrendingTopics(industry, session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        industry,
        topics: trendingTopics,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
} 