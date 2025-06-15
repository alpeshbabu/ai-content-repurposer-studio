import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiService } from '@/lib/ai-service';
import { PLATFORM_LIMITS } from '@/lib/ai-prompts';
import { z } from 'zod';

// Validation schema
const validateContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['blog', 'article', 'social_post', 'email', 'video_transcript', 'general']),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread', 'general'])).optional(),
  keywords: z.string().optional()
});

// POST - Validate content for AI processing
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

    const validation = validateContentSchema.safeParse(body);
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

    const { content, contentType, platforms, keywords } = validation.data;

    // Content length analysis
    const contentLength = content.length;
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Content quality checks
    const validationResults = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      suggestions: [] as string[],
      metrics: {
        characterCount: contentLength,
        wordCount,
        estimatedReadingTime,
        sentences: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
      }
    };

    // Length validations
    if (contentLength < 50) {
      validationResults.errors.push('Content is too short. Minimum 50 characters required for quality repurposing.');
      validationResults.isValid = false;
    } else if (contentLength < 100) {
      validationResults.warnings.push('Content is quite short. Consider adding more detail for better repurposing results.');
    }

    if (contentLength > 10000) {
      validationResults.warnings.push('Content is very long. Consider breaking it into smaller pieces for better results.');
    }

    // Word count validations
    if (wordCount < 10) {
      validationResults.errors.push('Content must contain at least 10 words for meaningful repurposing.');
      validationResults.isValid = false;
    }

    // Content type specific validations
    switch (contentType) {
      case 'blog':
        if (wordCount < 100) {
          validationResults.warnings.push('Blog posts typically work better with 100+ words.');
        }
        if (validationResults.metrics.paragraphs < 2) {
          validationResults.suggestions.push('Consider breaking content into multiple paragraphs for better structure.');
        }
        break;
      
      case 'article':
        if (wordCount < 150) {
          validationResults.warnings.push('Articles typically work better with 150+ words.');
        }
        break;
      
      case 'social_post':
        if (wordCount > 100) {
          validationResults.suggestions.push('Social posts work well when concise. Consider highlighting key points.');
        }
        break;
      
      case 'email':
        if (wordCount > 200) {
          validationResults.suggestions.push('Emails are most effective when concise and scannable.');
        }
        break;
    }

    // Platform-specific validations
    if (platforms && platforms.length > 0) {
      for (const platform of platforms) {
        const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
        if (limit && contentLength > limit * 2) {
          validationResults.warnings.push(
            `Content may be too long for ${platform} (${limit} char limit). Original content will be significantly condensed.`
          );
        }
      }
    }

    // Content quality checks
    const hasNumbers = /\d/.test(content);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(content);
    const hasUpperCase = /[A-Z]/.test(content);
    const hasLowerCase = /[a-z]/.test(content);

    if (!hasUpperCase && !hasLowerCase) {
      validationResults.errors.push('Content appears to be empty or contain only special characters.');
      validationResults.isValid = false;
    }

    // Keywords validation
    if (keywords) {
      const keywordList = keywords.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0);
      if (keywordList.length === 0) {
        validationResults.warnings.push('No valid keywords found. Keywords help improve content generation.');
      } else if (keywordList.length > 10) {
        validationResults.warnings.push('Too many keywords. Consider focusing on 3-5 main keywords for better results.');
      }
      
      // Check if keywords appear in content
      const contentLower = content.toLowerCase();
      const missingKeywords = keywordList.filter(keyword => 
        !contentLower.includes(keyword.toLowerCase())
      );
      
      if (missingKeywords.length > 0 && missingKeywords.length === keywordList.length) {
        validationResults.suggestions.push('None of the keywords appear in the content. Consider incorporating them for better coherence.');
      }
    }

    // AI service availability check
    const availableProviders = aiService.getAvailableProviders();
    if (availableProviders.length === 0) {
      validationResults.errors.push('No AI providers are currently available. Please contact support.');
      validationResults.isValid = false;
    }

    // Generate recommendations
    const recommendations = {
      optimalLength: getOptimalLengthForType(contentType),
      suggestedPlatforms: getSuggestedPlatforms(contentType, wordCount),
      estimatedProcessingTime: estimateProcessingTime(wordCount, platforms?.length || 2),
      qualityScore: calculateQualityScore(validationResults.metrics, contentType)
    };

    return NextResponse.json({
      success: true,
      data: {
        isValid: validationResults.isValid,
        validation: validationResults,
        recommendations,
        aiService: {
          availableProviders,
          defaultProvider: availableProviders[0] || null
        }
      }
    });

  } catch (error) {
    console.error('[AI_VALIDATE_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Helper functions
function getOptimalLengthForType(contentType: string): { min: number; max: number; ideal: number } {
  switch (contentType) {
    case 'blog':
      return { min: 300, max: 2000, ideal: 800 };
    case 'article':
      return { min: 200, max: 1500, ideal: 600 };
    case 'social_post':
      return { min: 50, max: 300, ideal: 150 };
    case 'email':
      return { min: 100, max: 500, ideal: 250 };
    case 'video_transcript':
      return { min: 200, max: 2000, ideal: 1000 };
    default:
      return { min: 100, max: 1000, ideal: 400 };
  }
}

function getSuggestedPlatforms(contentType: string, wordCount: number): string[] {
  const suggestions = [];
  
  if (contentType === 'blog' || wordCount > 200) {
    suggestions.push('linkedin', 'newsletter', 'email');
  }
  
  if (contentType === 'social_post' || wordCount < 100) {
    suggestions.push('twitter', 'instagram', 'facebook');
  }
  
  if (wordCount > 100 && wordCount < 500) {
    suggestions.push('thread', 'linkedin');
  }
  
  return suggestions.length > 0 ? suggestions : ['twitter', 'linkedin'];
}

function estimateProcessingTime(wordCount: number, platformCount: number): number {
  // Base time: 2 seconds per platform + 1 second per 100 words
  const baseTime = platformCount * 2;
  const contentTime = Math.ceil(wordCount / 100);
  return Math.max(baseTime + contentTime, 3); // Minimum 3 seconds
}

function calculateQualityScore(metrics: any, contentType: string): number {
  let score = 50; // Base score
  
  // Length score
  const optimal = getOptimalLengthForType(contentType);
  if (metrics.wordCount >= optimal.min && metrics.wordCount <= optimal.max) {
    score += 20;
  } else if (metrics.wordCount >= optimal.ideal * 0.8 && metrics.wordCount <= optimal.ideal * 1.2) {
    score += 15;
  }
  
  // Structure score
  if (metrics.paragraphs > 1) score += 10;
  if (metrics.sentences > 2) score += 10;
  
  // Readability score
  const avgWordsPerSentence = metrics.wordCount / metrics.sentences;
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}