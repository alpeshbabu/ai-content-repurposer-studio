import Groq from 'groq-sdk';
import { GROQ_API_KEY, GROQ_MODELS } from './config';

// Initialize Groq client
let groqClient: Groq | null = null;

/**
 * Get the Groq client instance
 * @returns Groq client instance
 */
export function getGroqClient(): Groq {
  if (!groqClient) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    
    groqClient = new Groq({
      apiKey: GROQ_API_KEY,
    });
  }
  
  return groqClient;
}

/**
 * Generate content using Groq
 * @param prompt The prompt to send to Groq
 * @param modelName The name of the model to use (defaults to GROQ_MODELS.DEFAULT)
 * @returns The generated text response
 */
export async function generateWithGroq(
  prompt: string,
  modelName = GROQ_MODELS.DEFAULT
): Promise<string> {
  try {
    const client = getGroqClient();
    
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: modelName,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract the text from the response
    const responseText = chatCompletion.choices[0]?.message?.content || '';
    
    return responseText;
  } catch (error) {
    console.error('[GROQ_API_ERROR]', error);
    throw new Error(`Failed to generate content with Groq: ${error instanceof Error ? error.message : String(error)}`);
  }
}