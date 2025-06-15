import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiService } from '@/lib/ai-service';
import { ANTHROPIC_MODELS, GROQ_MODELS, ANTHROPIC_API_KEY, GROQ_API_KEY } from '@/lib/config';

// GET - Get available AI providers and models
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get available providers
    const availableProviders = aiService.getAvailableProviders();

    // Build response with provider information
    const providersInfo = {
      anthropic: {
        available: aiService.isProviderAvailable('anthropic'),
        configured: !!ANTHROPIC_API_KEY,
        models: Object.entries(ANTHROPIC_MODELS).map(([key, value]) => ({
          id: value,
          name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: getAnthropicModelDescription(key)
        }))
      },
      groq: {
        available: aiService.isProviderAvailable('groq'),
        configured: !!GROQ_API_KEY,
        models: Object.entries(GROQ_MODELS).map(([key, value]) => ({
          id: value,
          name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: getGroqModelDescription(key)
        }))
      }
    };

    // Get default provider (first available)
    const defaultProvider = availableProviders.length > 0 ? availableProviders[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        availableProviders,
        defaultProvider,
        providers: providersInfo,
        totalConfigured: availableProviders.length,
        recommendations: {
          speed: availableProviders.includes('groq') ? 'groq' : availableProviders[0],
          quality: availableProviders.includes('anthropic') ? 'anthropic' : availableProviders[0],
          balance: availableProviders.includes('anthropic') ? 'anthropic' : availableProviders[0]
        }
      }
    });

  } catch (error) {
    console.error('[AI_PROVIDERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Helper function to get Anthropic model descriptions
function getAnthropicModelDescription(modelKey: string): string {
  switch (modelKey) {
    case 'CLAUDE_3_OPUS':
      return 'Most capable model with superior performance on highly complex tasks';
    case 'CLAUDE_3_SONNET':
      return 'Balanced model with strong performance and speed for most tasks';
    case 'CLAUDE_3_HAIKU':
      return 'Fastest and most compact model for simple tasks and quick responses';
    case 'DEFAULT':
      return 'Default recommended model for general use';
    default:
      return 'Claude AI model for content generation and processing';
  }
}

// Helper function to get Groq model descriptions
function getGroqModelDescription(modelKey: string): string {
  switch (modelKey) {
    case 'LLAMA_3_1_70B_VERSATILE':
      return 'High-quality, versatile model suitable for complex tasks';
    case 'LLAMA_3_1_8B_INSTANT':
      return 'Fast model optimized for quick responses and simple tasks';
    case 'MIXTRAL_8X7B_32768':
      return 'Model with large context window for processing long content';
    case 'GEMMA_7B_IT':
      return 'Instruction-tuned model optimized for following specific guidelines';
    case 'DEFAULT':
      return 'Default recommended model for general use';
    default:
      return 'Groq AI model for fast content generation';
  }
}