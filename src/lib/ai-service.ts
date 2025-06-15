import { generateWithClaude } from './anthropic';
import { generateWithGroq } from './groq';
import { ANTHROPIC_API_KEY, GROQ_API_KEY, ANTHROPIC_MODELS, GROQ_MODELS } from './config';

// AI Provider types
export type AIProvider = 'anthropic' | 'groq';
export type ContentType = 'blog' | 'article' | 'social_post' | 'email' | 'video_transcript' | 'general';
export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'email' | 'newsletter' | 'thread' | 'general';

// AI Service configuration
export interface AIServiceConfig {
  provider: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Content generation request
export interface ContentGenerationRequest {
  keywords: string;
  contentType: ContentType;
  tone?: string;
  brandVoice?: string;
  targetAudience?: string;
  additionalInstructions?: string;
}

// Content repurposing request
export interface ContentRepurposingRequest {
  originalContent: string;
  platforms: Platform[];
  brandVoice?: string;
  tone?: string;
  additionalInstructions?: string;
}

// Response interface
export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

// Platform-specific repurposed content
export interface RepurposedContent {
  platform: Platform;
  content: string;
  characterCount: number;
  hashtagSuggestions?: string[];
}

// Main AI Service class
export class AIService {
  private defaultProvider: AIProvider;
  private fallbackProvider: AIProvider | null;

  constructor() {
    // Determine available providers and set defaults
    const hasAnthropic = !!ANTHROPIC_API_KEY;
    const hasGroq = !!GROQ_API_KEY;

    if (!hasAnthropic && !hasGroq) {
      throw new Error('No AI providers configured. Please set either ANTHROPIC_API_KEY or GROQ_API_KEY.');
    }

    // Prefer Anthropic as primary, Groq as fallback
    this.defaultProvider = hasAnthropic ? 'anthropic' : 'groq';
    // Only use fallback if both providers are properly configured
    const groqConfigured = hasGroq && GROQ_API_KEY !== 'your-groq-api-key';
    this.fallbackProvider = hasAnthropic && groqConfigured ? 'groq' : null;
  }

  /**
   * Generate content from keywords
   */
  async generateContent(request: ContentGenerationRequest, config?: Partial<AIServiceConfig>): Promise<AIResponse> {
    const prompt = this.buildContentGenerationPrompt(request);
    return this.generateWithProvider(prompt, config?.provider || this.defaultProvider, config);
  }

  /**
   * Repurpose content for multiple platforms
   */
  async repurposeContent(request: ContentRepurposingRequest, config?: Partial<AIServiceConfig>): Promise<RepurposedContent[]> {
    const results: RepurposedContent[] = [];

    for (const platform of request.platforms) {
      try {
        const prompt = this.buildRepurposingPrompt(request, platform);
        const response = await this.generateWithProvider(prompt, config?.provider || this.defaultProvider, config);
        
        results.push({
          platform,
          content: response.content,
          characterCount: response.content.length,
          hashtagSuggestions: this.extractHashtags(response.content)
        });
      } catch (error) {
        console.error(`Failed to repurpose content for ${platform}:`, error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Continue with other platforms even if one fails
        results.push({
          platform,
          content: `Error generating content for ${platform}: ${error instanceof Error ? error.message : String(error)}`,
          characterCount: 0
        });
      }
    }

    return results;
  }

  /**
   * Generate content using specified provider with fallback
   */
  private async generateWithProvider(
    prompt: string, 
    provider: AIProvider, 
    config?: Partial<AIServiceConfig>
  ): Promise<AIResponse> {
    try {
      let content: string;
      let model: string;

      if (provider === 'anthropic') {
        if (!ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        model = config?.model || ANTHROPIC_MODELS.DEFAULT;
        content = await generateWithClaude(prompt, model);
      } else if (provider === 'groq') {
        if (!GROQ_API_KEY) {
          throw new Error('Groq API key not configured');
        }
        model = config?.model || GROQ_MODELS.DEFAULT;
        content = await generateWithGroq(prompt, model);
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return {
        content,
        provider,
        model
      };
    } catch (error) {
      console.error(`Failed to generate with ${provider}:`, error);
      
      // Try fallback provider if available
      if (this.fallbackProvider && provider !== this.fallbackProvider) {
        console.log(`Falling back to ${this.fallbackProvider} provider`);
        return this.generateWithProvider(prompt, this.fallbackProvider, config);
      }
      
      throw error;
    }
  }

  /**
   * Build prompt for content generation from keywords
   */
  private buildContentGenerationPrompt(request: ContentGenerationRequest): string {
    const { keywords, contentType, tone, brandVoice, targetAudience, additionalInstructions } = request;

    let prompt = `Generate a professional ${contentType} based on the following keywords: "${keywords}"\n\n`;

    // Add content type specific instructions
    switch (contentType) {
      case 'blog':
        prompt += 'Create a comprehensive blog post with an engaging title, introduction, main body with subheadings, and conclusion. ';
        break;
      case 'article':
        prompt += 'Write an informative article with a clear structure, compelling headline, and valuable insights. ';
        break;
      case 'social_post':
        prompt += 'Create an engaging social media post that captures attention and encourages interaction. ';
        break;
      case 'email':
        prompt += 'Write a professional email with a clear subject line, proper greeting, main message, and call-to-action. ';
        break;
      case 'video_transcript':
        prompt += 'Create a video script/transcript with natural speaking flow, clear segments, and engaging delivery. ';
        break;
      default:
        prompt += 'Create high-quality, engaging content that effectively communicates the message. ';
    }

    if (tone) {
      prompt += `The tone should be ${tone}. `;
    }

    if (brandVoice) {
      prompt += `Brand voice: ${brandVoice}. `;
    }

    if (targetAudience) {
      prompt += `Target audience: ${targetAudience}. `;
    }

    prompt += 'Ensure the content is well-structured, engaging, and provides value to the reader. ';

    if (additionalInstructions) {
      prompt += `Additional instructions: ${additionalInstructions} `;
    }

    prompt += '\\n\\nPlease provide only the content without any meta-commentary or explanations.';

    return prompt;
  }

  /**
   * Build prompt for content repurposing
   */
  private buildRepurposingPrompt(request: ContentRepurposingRequest, platform: Platform): string {
    const { originalContent, brandVoice, tone, additionalInstructions } = request;

    let prompt = `Repurpose the following content for ${platform}:\\n\\n"${originalContent}"\\n\\n`;

    // Platform-specific instructions
    switch (platform) {
      case 'twitter':
        prompt += 'Create a Twitter post (max 280 characters). Requirements:\n' +
                  '- Hook readers in the first 7 words\n' +
                  '- Use conversational, punchy language\n' +
                  '- Include 1-3 relevant hashtags at the end\n' +
                  '- End with a question or call-to-action to encourage engagement\n' +
                  '- Use line breaks for readability\n' +
                  '- Consider emojis sparingly for emphasis\n';
        break;
      case 'linkedin':
        prompt += 'Create a LinkedIn post optimized for professional networking. Requirements:\n' +
                  '- Start with a compelling hook or personal insight\n' +
                  '- Use professional yet approachable language\n' +
                  '- Include industry-relevant keywords naturally\n' +
                  '- Structure with short paragraphs (2-3 lines max)\n' +
                  '- End with a thoughtful question to spark discussion\n' +
                  '- Include 3-5 relevant hashtags\n' +
                  '- Aim for 1300-3000 characters for optimal engagement\n';
        break;
      case 'instagram':
        prompt += 'Create an Instagram caption that drives engagement. Requirements:\n' +
                  '- Start with an attention-grabbing first line (appears in feed preview)\n' +
                  '- Use storytelling and emotional connection\n' +
                  '- Include a clear call-to-action (like, comment, share, save)\n' +
                  '- Add 10-30 relevant hashtags (mix of popular and niche)\n' +
                  '- Use line breaks and emojis for visual appeal\n' +
                  '- Consider Instagram-specific features (Stories, Reels mentions)\n';
        break;
      case 'facebook':
        prompt += 'Create a Facebook post that encourages community engagement. Requirements:\n' +
                  '- Use conversational, friendly tone\n' +
                  '- Ask questions to encourage comments and discussions\n' +
                  '- Keep it concise but informative (40-80 characters get highest engagement)\n' +
                  '- Include relevant hashtags (1-2 hashtags work best on Facebook)\n' +
                  '- Consider tagging relevant pages or people when appropriate\n' +
                  '- End with a clear call-to-action\n';
        break;
      case 'email':
        prompt += 'Convert this into a professional email format. Requirements:\n' +
                  '- Subject line: Clear, specific, and compelling (50 chars or less)\n' +
                  '- Greeting: Personalized and appropriate\n' +
                  '- Body: Well-structured with clear paragraphs\n' +
                  '- Value proposition: Lead with benefits, not features\n' +
                  '- Call-to-action: Single, clear, and prominent\n' +
                  '- Closing: Professional sign-off\n' +
                  '- Mobile-friendly: Short paragraphs and scannable format\n';
        break;
      case 'newsletter':
        prompt += 'Create a newsletter section with high engagement potential. Requirements:\n' +
                  '- Compelling headline that promises value\n' +
                  '- Opening hook that relates to subscriber interests\n' +
                  '- Scannable format with bullet points or numbered lists\n' +
                  '- Include actionable insights or takeaways\n' +
                  '- Personal touch or behind-the-scenes element\n' +
                  '- Clear next steps or call-to-action\n' +
                  '- Keep paragraphs short (2-3 sentences max)\n';
        break;
      case 'thread':
        prompt += 'Create a Twitter thread that maximizes engagement and retention. Requirements:\n' +
                  '- Tweet 1: Hook with a compelling promise or question\n' +
                  '- Each tweet: One clear point, max 280 characters\n' +
                  '- Use numbered tweets (1/n, 2/n, etc.)\n' +
                  '- Include thread continuation cues ("More in next tweet ⬇️")\n' +
                  '- Final tweet: Summary and call-to-action\n' +
                  '- Use consistent formatting and voice throughout\n' +
                  '- Aim for 5-15 tweets total for optimal engagement\n';
        break;
      default:
        prompt += 'Adapt the content appropriately for the platform while maintaining the core message and following platform best practices. ';
    }

    if (brandVoice) {
      prompt += `Brand voice: ${brandVoice}. `;
    }

    if (tone) {
      prompt += `Tone: ${tone}. `;
    }

    prompt += 'Keep the core message intact while optimizing for the platform\'s audience and format requirements. ';

    if (additionalInstructions) {
      prompt += `Additional instructions: ${additionalInstructions} `;
    }

    prompt += '\n\nProvide only the repurposed content without any explanations or meta-commentary.';

    return prompt;
  }

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = content.match(hashtagRegex) || [];
    return [...new Set(hashtags)]; // Remove duplicates
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (ANTHROPIC_API_KEY) providers.push('anthropic');
    if (GROQ_API_KEY) providers.push('groq');
    return providers;
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    if (provider === 'anthropic') return !!ANTHROPIC_API_KEY;
    if (provider === 'groq') return !!GROQ_API_KEY;
    return false;
  }
}

// Create singleton instance
export const aiService = new AIService();

// Export helper functions
export { generateWithClaude, generateWithGroq };