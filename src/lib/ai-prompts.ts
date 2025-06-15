import { ContentType, Platform } from './ai-service';

// Base prompt templates for content generation
export const CONTENT_GENERATION_PROMPTS = {
  blog: {
    base: `Create a comprehensive blog post with the following structure:
1. Compelling headline
2. Engaging introduction (hook + preview)
3. Main content with 3-5 subheadings
4. Conclusion with key takeaways
5. Call-to-action

Requirements:
- 800-1500 words
- SEO-friendly with natural keyword integration
- Include practical insights and actionable advice
- Professional yet conversational tone`,
    
    instructions: 'Write a complete blog post that provides value to readers and encourages engagement.'
  },

  article: {
    base: `Write an informative article with:
1. Attention-grabbing headline
2. Brief introduction outlining the topic
3. Well-structured main content with clear sections
4. Supporting evidence and examples
5. Conclusion summarizing key points

Requirements:
- 600-1200 words
- Factual and well-researched content
- Clear, logical flow between sections
- Professional writing style`,
    
    instructions: 'Create an authoritative article that educates and informs the target audience.'
  },

  social_post: {
    base: `Create an engaging social media post that:
1. Captures attention in the first line
2. Delivers value or entertainment
3. Includes a call-to-action
4. Uses relevant hashtags (3-5)

Requirements:
- 100-300 words (platform dependent)
- Conversational and relatable tone
- Encourages interaction (likes, comments, shares)
- Include emoji where appropriate`,
    
    instructions: 'Write a social media post that drives engagement and builds community.'
  },

  email: {
    base: `Compose a professional email with:
1. Compelling subject line (5-7 words)
2. Personal greeting
3. Clear and concise main message
4. Strong call-to-action
5. Professional closing

Requirements:
- 150-400 words
- Scannable format with short paragraphs
- Professional yet friendly tone
- Clear value proposition`,
    
    instructions: 'Create an email that gets opened, read, and acted upon.'
  },

  video_transcript: {
    base: `Write a video script/transcript with:
1. Hook (first 10 seconds)
2. Introduction and topic overview
3. Main content in digestible segments
4. Transitions between sections
5. Strong conclusion and call-to-action

Requirements:
- Natural speaking rhythm
- Include timing cues [0:30]
- Conversational language
- Visual cues in brackets [SHOW SCREEN]`,
    
    instructions: 'Create a video script that keeps viewers engaged throughout.'
  },

  general: {
    base: `Create high-quality content that:
1. Addresses the core topic effectively
2. Provides clear value to the audience
3. Maintains consistent tone and style
4. Includes relevant examples or insights
5. Ends with a meaningful conclusion

Requirements:
- Appropriate length for the context
- Well-structured and easy to follow
- Engaging and informative
- Professional quality`,
    
    instructions: 'Generate content that meets professional standards and serves its intended purpose.'
  }
};

// Platform-specific repurposing prompts
export const PLATFORM_PROMPTS = {
  twitter: {
    characterLimit: 280,
    template: `Repurpose this content for Twitter:

Original content: {content}

Requirements:
- Maximum 280 characters
- Include 2-3 relevant hashtags
- Engaging and shareable
- Clear call-to-action or discussion starter
- Use Twitter-appropriate language and tone

Format: Provide the tweet text only, no explanations.`,
    
    guidelines: [
      'Keep it concise and punchy',
      'Use relevant hashtags (#)',
      'Include emojis sparingly',
      'Ask questions to encourage replies',
      'Tag relevant accounts when appropriate'
    ]
  },

  linkedin: {
    characterLimit: 3000,
    template: `Repurpose this content for LinkedIn:

Original content: {content}

Requirements:
- Professional tone suitable for business networking
- 100-300 words optimal length
- Include 3-5 professional hashtags
- Add industry insights or professional perspective
- End with a question to encourage professional discussion

Format: Provide the LinkedIn post text only.`,
    
    guidelines: [
      'Professional and business-focused',
      'Share industry insights',
      'Use professional hashtags',
      'Encourage meaningful discussion',
      'Add personal or company perspective'
    ]
  },

  instagram: {
    characterLimit: 2200,
    template: `Repurpose this content for Instagram:

Original content: {content}

Requirements:
- Visual and engaging tone
- 100-200 words for optimal engagement
- Include 5-10 relevant hashtags
- Instagram-appropriate language
- Encourage likes, comments, and saves

Format: Provide the Instagram caption only.`,
    
    guidelines: [
      'Visual storytelling approach',
      'Use engaging, lifestyle-focused language',
      'Include relevant hashtags (5-10)',
      'Encourage user interaction',
      'Add personality and authenticity'
    ]
  },

  facebook: {
    characterLimit: 63206,
    template: `Repurpose this content for Facebook:

Original content: {content}

Requirements:
- Conversational and community-friendly tone
- 200-400 words optimal length
- Encourage comments and discussions
- Include relevant hashtags (2-3)
- Community-building focus

Format: Provide the Facebook post text only.`,
    
    guidelines: [
      'Community and conversation focused',
      'Longer form content works well',
      'Ask questions to spark discussion',
      'Share personal experiences',
      'Use Facebook-specific features (polls, events)'
    ]
  },

  email: {
    characterLimit: null,
    template: `Convert this content into an email format:

Original content: {content}

Requirements:
- Subject line (5-7 words, compelling)
- Professional greeting
- Main content broken into scannable sections
- Clear call-to-action
- Professional closing
- 200-500 words total

Format:
Subject: [Subject line]

[Email body]

[Closing]`,
    
    guidelines: [
      'Compelling subject line',
      'Personal greeting',
      'Scannable format',
      'Clear value proposition',
      'Strong call-to-action'
    ]
  },

  newsletter: {
    characterLimit: null,
    template: `Format this content for a newsletter section:

Original content: {content}

Requirements:
- Engaging section headline
- Newsletter-appropriate formatting
- 300-600 words
- Include relevant links or resources
- Professional yet friendly tone

Format: Provide the newsletter section with headline.`,
    
    guidelines: [
      'Newsletter-friendly formatting',
      'Engaging headlines and subheaders',
      'Include relevant resources',
      'Maintain brand consistency',
      'Add value for subscribers'
    ]
  },

  thread: {
    characterLimit: 280,
    template: `Convert this content into a Twitter thread:

Original content: {content}

Requirements:
- Break into 3-8 connected tweets
- Each tweet max 280 characters
- Number each tweet (1/n format)
- Maintain narrative flow
- Include relevant hashtags in final tweet
- End with call-to-action

Format:
1/n [First tweet]
2/n [Second tweet]
[Continue for all tweets]`,
    
    guidelines: [
      'Break into logical segments',
      'Maintain story flow',
      'Use thread numbering (1/n)',
      'Each tweet should be valuable',
      'Strong opening and closing tweets'
    ]
  },

  general: {
    characterLimit: null,
    template: `Adapt this content for general use:

Original content: {content}

Requirements:
- Maintain core message and value
- Appropriate length for context
- Professional quality
- Clear structure and flow
- Engaging and informative

Format: Provide the adapted content only.`,
    
    guidelines: [
      'Maintain core message',
      'Adapt to target audience',
      'Ensure clarity and value',
      'Professional presentation',
      'Appropriate formatting'
    ]
  }
};

// Brand voice integration prompts
export const BRAND_VOICE_PROMPTS = {
  friendly: 'Use a warm, approachable tone that feels like talking to a friend.',
  professional: 'Maintain a business-appropriate, authoritative tone.',
  casual: 'Write in a relaxed, informal style that feels natural and conversational.',
  authoritative: 'Use an expert tone that demonstrates knowledge and credibility.',
  playful: 'Inject humor and personality while maintaining professionalism.',
  empathetic: 'Show understanding and connection with the audience\'s challenges.',
  direct: 'Be straightforward and to-the-point without unnecessary fluff.',
  inspiring: 'Motivate and encourage the audience with uplifting language.',
  educational: 'Focus on teaching and providing valuable insights.',
  conversational: 'Write as if having a natural conversation with the reader.'
};

// Content enhancement prompts
export const ENHANCEMENT_PROMPTS = {
  addEmojis: 'Include relevant emojis to make the content more engaging and visually appealing.',
  addHashtags: 'Include relevant and trending hashtags to increase discoverability.',
  addCTA: 'Include a strong call-to-action that encourages specific user engagement.',
  makeViral: 'Optimize for shareability with hooks, curiosity gaps, and engagement triggers.',
  addPersonality: 'Inject brand personality and unique voice to stand out.',
  addValue: 'Ensure every sentence provides clear value to the target audience.',
  improveHook: 'Create a compelling opening that immediately captures attention.',
  addProof: 'Include credibility indicators, statistics, or social proof where relevant.'
};

// Helper function to build complete prompts
export function buildPrompt(
  type: 'generation' | 'repurposing',
  contentType?: ContentType,
  platform?: Platform,
  brandVoice?: string,
  additionalInstructions?: string
): string {
  let prompt = '';

  if (type === 'generation' && contentType) {
    const template = CONTENT_GENERATION_PROMPTS[contentType];
    prompt = template.base + '\\n\\n' + template.instructions;
  } else if (type === 'repurposing' && platform) {
    const template = PLATFORM_PROMPTS[platform];
    prompt = template.template;
  }

  if (brandVoice && BRAND_VOICE_PROMPTS[brandVoice as keyof typeof BRAND_VOICE_PROMPTS]) {
    prompt += `\\n\\nBrand Voice: ${BRAND_VOICE_PROMPTS[brandVoice as keyof typeof BRAND_VOICE_PROMPTS]}`;
  } else if (brandVoice) {
    prompt += `\\n\\nBrand Voice: ${brandVoice}`;
  }

  if (additionalInstructions) {
    prompt += `\\n\\nAdditional Instructions: ${additionalInstructions}`;
  }

  return prompt;
}

// Export platform character limits for validation
export const PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  email: null,
  newsletter: null,
  thread: 280, // per tweet
  general: null
} as const;