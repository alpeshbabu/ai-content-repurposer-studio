import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODELS } from './config';

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

/**
 * Get the Anthropic client instance
 * @returns Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
  
  return anthropicClient;
}

/**
 * Generate repurposed content using Anthropic Claude
 * @param prompt The prompt to send to Anthropic Claude
 * @param modelName The name of the model to use (defaults to ANTHROPIC_MODELS.CLAUDE_3_SONNET)
 * @returns The generated text response
 */
export async function generateWithClaude(
  prompt: string,
  modelName = ANTHROPIC_MODELS.CLAUDE_3_SONNET
): Promise<string> {
  try {
    const client = getAnthropicClient();
    
    const message = await client.messages.create({
      model: modelName,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text from the response
    let responseText = '';
    if (Array.isArray(message.content) && message.content.length > 0) {
      const firstContent = message.content[0];
      if (typeof firstContent === 'object' && 'text' in firstContent) {
        responseText = firstContent.text;
      }
    } else if (typeof message.content === 'string') {
      responseText = message.content;
    }

    return responseText;
  } catch (error) {
    console.error('[ANTHROPIC_API_ERROR]', error);
    throw new Error(`Failed to generate content with Claude: ${error instanceof Error ? error.message : String(error)}`);
  }
} 