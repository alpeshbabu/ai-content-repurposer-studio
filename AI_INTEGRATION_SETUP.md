# AI Integration Setup Guide

This guide explains how to set up and use the AI integration with Anthropic Claude and Groq for content generation and repurposing.

## Overview

The AI integration supports:
- **Content Generation**: Create new content from keywords using AI
- **Content Repurposing**: Transform existing content for different platforms
- **Multiple AI Providers**: Anthropic Claude and Groq with automatic fallback
- **Platform-Specific Optimization**: Tailored prompts for Twitter, LinkedIn, Instagram, etc.

## Environment Setup

### Required API Keys

Add these to your `.env` file:

```env
# Anthropic Claude API Key (Get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Groq API Key (Get from https://console.groq.com/)
GROQ_API_KEY=your-groq-api-key
```

### Getting API Keys

#### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key starting with `sk-ant-api03-`

#### Groq
1. Visit [Groq Console](https://console.groq.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Generate a new API key
5. Copy the provided key

## AI Service Architecture

### Available Models

#### Anthropic Claude Models
- `claude-3-opus-20240229` - Most capable, slower, higher cost
- `claude-3-sonnet-20240229` - Balanced performance (default)
- `claude-3-haiku-20240307` - Fastest, lower cost

#### Groq Models
- `llama-3.1-70b-versatile` - High quality, versatile (default)
- `llama-3.1-8b-instant` - Fast inference, good quality
- `mixtral-8x7b-32768` - Large context window
- `gemma-7b-it` - Instruction-tuned model

### Provider Fallback System

The AI service automatically:
1. Uses Anthropic Claude as primary provider (if configured)
2. Falls back to Groq if Claude fails (if configured)
3. Throws error if no providers are available

## Usage Examples

### Content Generation from Keywords

```typescript
import { aiService } from '@/lib/ai-service';

const request = {
  keywords: 'AI content creation, automation, productivity',
  contentType: 'blog' as const,
  tone: 'professional',
  brandVoice: 'expert and approachable',
  targetAudience: 'content creators and marketers'
};

const response = await aiService.generateContent(request);
console.log(response.content); // Generated blog post
```

### Content Repurposing for Multiple Platforms

```typescript
import { aiService } from '@/lib/ai-service';

const request = {
  originalContent: 'Your original blog post or article...',
  platforms: ['twitter', 'linkedin', 'instagram'],
  brandVoice: 'friendly and professional',
  tone: 'engaging'
};

const repurposed = await aiService.repurposeContent(request);
repurposed.forEach(content => {
  console.log(`${content.platform}: ${content.content}`);
});
```

### Custom Provider Selection

```typescript
// Use specific provider
const response = await aiService.generateContent(request, {
  provider: 'groq',
  model: 'llama-3.1-70b-versatile'
});

// Check available providers
const providers = aiService.getAvailableProviders();
console.log('Available:', providers); // ['anthropic', 'groq']
```

## Content Types

### Supported Content Types
- `blog` - Full blog posts with structure
- `article` - Informative articles
- `social_post` - General social media content
- `email` - Professional emails
- `video_transcript` - Video scripts
- `general` - Flexible content format

### Platform-Specific Features

#### Twitter
- 280 character limit
- Hashtag optimization
- Engagement-focused language

#### LinkedIn
- Professional tone
- Business networking focus
- Industry insights

#### Instagram
- Visual storytelling
- Lifestyle language
- Hashtag-rich content

#### Facebook
- Community-focused
- Discussion-encouraging
- Longer form content

#### Email
- Subject line optimization
- Professional structure
- Clear call-to-action

#### Newsletter
- Subscriber-focused
- Section formatting
- Resource inclusion

#### Thread
- Multi-tweet structure
- Narrative flow
- Numbered sequence

## Brand Voice Integration

### Predefined Brand Voices
- `friendly` - Warm and approachable
- `professional` - Business-appropriate
- `casual` - Relaxed and informal
- `authoritative` - Expert and credible
- `playful` - Humorous and personable
- `empathetic` - Understanding and supportive
- `direct` - Straightforward and clear
- `inspiring` - Motivational and uplifting
- `educational` - Teaching-focused
- `conversational` - Natural dialogue style

### Custom Brand Voice
```typescript
const request = {
  keywords: 'productivity tips',
  contentType: 'blog',
  brandVoice: 'We are a tech startup that values innovation, transparency, and helping people achieve their goals. Our tone is optimistic and solution-focused.'
};
```

## Error Handling

The AI service includes comprehensive error handling:

```typescript
try {
  const response = await aiService.generateContent(request);
  // Success handling
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle API key issues
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else {
    // Handle other errors
  }
}
```

## Performance Considerations

### Provider Speed Comparison
- **Groq**: Fastest inference (recommended for real-time)
- **Claude**: Higher quality output (recommended for quality)

### Token Usage Optimization
- Use appropriate models for your use case
- Groq models are generally faster and cheaper
- Claude models provide higher quality output

### Rate Limiting
- Anthropic: 1000 requests/minute (tier 1)
- Groq: Varies by plan

## Monitoring and Logging

All AI operations are logged with:
- Provider used
- Model used
- Request type (generation/repurposing)
- Execution time
- Error details (if any)

## Best Practices

1. **Provider Selection**
   - Use Groq for high-volume, fast operations
   - Use Claude for high-quality, important content

2. **Content Generation**
   - Provide clear, specific keywords
   - Include brand voice for consistency
   - Specify target audience for better relevance

3. **Content Repurposing**
   - Choose appropriate platforms for your content
   - Maintain brand voice across platforms
   - Review generated content before publishing

4. **Error Handling**
   - Always implement try-catch blocks
   - Have fallback content strategies
   - Monitor API usage and limits

## Troubleshooting

### Common Issues

1. **"No AI providers configured"**
   - Ensure at least one API key is set in environment variables
   - Restart your development server after adding keys

2. **API Key errors**
   - Verify API keys are correct and active
   - Check API key permissions and quotas

3. **Rate limiting**
   - Implement exponential backoff
   - Consider upgrading API plans
   - Use different providers for different use cases

4. **Poor content quality**
   - Refine prompts with more specific instructions
   - Try different models
   - Provide better context and brand voice

### Support

For additional support:
- Check API provider documentation
- Review error logs for specific issues
- Test with different models and providers