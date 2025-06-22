import { getAnthropicClient } from '@/lib/anthropic';
import { analyticsTracker } from '@/lib/analytics-tracker';

export interface ContentQualityScore {
  overall: number; // 0-100
  readability: number;
  engagement: number;
  seoOptimization: number;
  clarity: number;
  tone: number;
  structure: number;
}

export interface OptimizationSuggestion {
  type: 'readability' | 'engagement' | 'seo' | 'clarity' | 'tone' | 'structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  example?: string;
}

export interface ContentAnalysis {
  qualityScore: ContentQualityScore;
  suggestions: OptimizationSuggestion[];
  keywordDensity: Record<string, number>;
  sentimentAnalysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  readingLevel: string;
  wordCount: number;
  estimatedReadingTime: number;
  targetAudience: string[];
  contentType: string;
  strengths: string[];
  weaknesses: string[];
}

export interface TrendingTopic {
  topic: string;
  relevanceScore: number;
  searchVolume: number;
  difficulty: number;
  relatedKeywords: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  relevanceScore: number;
  searchVolume: number;
  difficulty: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
}

class AIContentAnalyzer {
  private static instance: AIContentAnalyzer;

  private constructor() {}

  public static getInstance(): AIContentAnalyzer {
    if (!AIContentAnalyzer.instance) {
      AIContentAnalyzer.instance = new AIContentAnalyzer();
    }
    return AIContentAnalyzer.instance;
  }

  // Analyze content quality and provide scoring
  async analyzeContent(content: string, userId: string, contentType?: string): Promise<ContentAnalysis> {
    try {
      // Track analytics
      await analyticsTracker.trackEvent({
        userId,
        action: 'content_analyzed',
        resource: 'ai_analyzer',
        metadata: { contentType, contentLength: content.length }
      });

      const prompt = `
        Analyze the following content and provide a comprehensive quality assessment:

        Content: "${content}"
        Content Type: ${contentType || 'general'}

        Please provide:
        1. Quality scores (0-100) for: overall, readability, engagement, SEO optimization, clarity, tone, structure
        2. Specific optimization suggestions with severity levels
        3. Keyword density analysis
        4. Sentiment analysis
        5. Reading level assessment
        6. Target audience identification
        7. Content strengths and weaknesses

        Respond in JSON format with the following structure:
        {
          "qualityScore": {
            "overall": number,
            "readability": number,
            "engagement": number,
            "seoOptimization": number,
            "clarity": number,
            "tone": number,
            "structure": number
          },
          "suggestions": [
            {
              "type": "readability|engagement|seo|clarity|tone|structure",
              "severity": "low|medium|high",
              "message": "description of issue",
              "suggestion": "specific improvement suggestion",
              "example": "optional example"
            }
          ],
          "keywordDensity": {"keyword": density},
          "sentimentAnalysis": {
            "sentiment": "positive|negative|neutral",
            "confidence": number
          },
          "readingLevel": "elementary|middle|high|college",
          "targetAudience": ["audience1", "audience2"],
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"]
        }
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = JSON.parse(analysisText);

      // Calculate additional metrics
      const wordCount = content.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed

      return {
        ...analysis,
        wordCount,
        estimatedReadingTime,
        contentType: contentType || 'general'
      };

    } catch (error) {
      console.error('Error analyzing content:', error);
      
      // Fallback analysis
      return this.getFallbackAnalysis(content, contentType);
    }
  }

  // Generate content optimization suggestions
  async generateOptimizationSuggestions(content: string, targetPlatform: string, userId: string): Promise<OptimizationSuggestion[]> {
    try {
      await analyticsTracker.trackEvent({
        userId,
        action: 'optimization_requested',
        resource: 'ai_analyzer',
        metadata: { targetPlatform, contentLength: content.length }
      });

      const prompt = `
        Analyze this content for optimization for ${targetPlatform}:
        
        Content: "${content}"
        
        Provide specific optimization suggestions for ${targetPlatform} including:
        - Platform-specific best practices
        - Engagement optimization
        - Format improvements
        - Call-to-action suggestions
        - Hashtag and keyword recommendations
        
        Return as JSON array of suggestions with type, severity, message, and suggestion fields.
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const suggestionsText = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(suggestionsText);

    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      return [];
    }
  }

  // Get trending topics and keyword suggestions
  async getTrendingTopics(industry: string, userId: string): Promise<TrendingTopic[]> {
    try {
      await analyticsTracker.trackEvent({
        userId,
        action: 'trending_topics_requested',
        resource: 'ai_analyzer',
        metadata: { industry }
      });

      const prompt = `
        Generate trending topics and keywords for the ${industry} industry.
        
        Provide 10 trending topics with:
        - Topic name
        - Relevance score (0-100)
        - Estimated search volume
        - Competition difficulty (0-100)
        - Related keywords
        
        Return as JSON array with the specified structure.
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const topicsText = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(topicsText);

    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  // Generate keyword suggestions
  async generateKeywordSuggestions(content: string, targetAudience: string, userId: string): Promise<KeywordSuggestion[]> {
    try {
      await analyticsTracker.trackEvent({
        userId,
        action: 'keyword_suggestions_requested',
        resource: 'ai_analyzer',
        metadata: { targetAudience, contentLength: content.length }
      });

      const prompt = `
        Based on this content and target audience (${targetAudience}), suggest relevant keywords:
        
        Content: "${content}"
        
        Provide 15 keyword suggestions with:
        - Keyword phrase
        - Relevance score (0-100)
        - Estimated search volume
        - Competition difficulty (0-100)
        - Search intent (informational, commercial, transactional, navigational)
        
        Return as JSON array.
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const keywordsText = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(keywordsText);

    } catch (error) {
      console.error('Error generating keyword suggestions:', error);
      return [];
    }
  }

  // Detect potential plagiarism
  async checkPlagiarism(content: string, userId: string): Promise<{
    isPlagiarized: boolean;
    confidence: number;
    sources: string[];
    suggestions: string[];
  }> {
    try {
      await analyticsTracker.trackEvent({
        userId,
        action: 'plagiarism_check',
        resource: 'ai_analyzer',
        metadata: { contentLength: content.length }
      });

      // Note: This is a simplified implementation
      // In production, you'd integrate with plagiarism detection APIs
      
      const prompt = `
        Analyze this content for potential plagiarism indicators:
        
        Content: "${content}"
        
        Look for:
        - Common phrases that might be copied
        - Unusual writing style inconsistencies
        - Overly formal or technical language that seems out of place
        
        Return JSON with isPlagiarized (boolean), confidence (0-100), potential sources array, and suggestions for originality.
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const resultText = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(resultText);

    } catch (error) {
      console.error('Error checking plagiarism:', error);
      return {
        isPlagiarized: false,
        confidence: 0,
        sources: [],
        suggestions: ['Unable to perform plagiarism check at this time']
      };
    }
  }

  // Support multi-language content analysis
  async analyzeMultiLanguageContent(content: string, targetLanguages: string[], userId: string): Promise<{
    detectedLanguage: string;
    confidence: number;
    translations: Record<string, string>;
    culturalAdaptations: Record<string, string[]>;
  }> {
    try {
      await analyticsTracker.trackEvent({
        userId,
        action: 'multilang_analysis',
        resource: 'ai_analyzer',
        metadata: { targetLanguages, contentLength: content.length }
      });

      const prompt = `
        Analyze this content for multi-language support:
        
        Content: "${content}"
        Target Languages: ${targetLanguages.join(', ')}
        
        Provide:
        1. Detected source language
        2. Confidence level
        3. Translations for each target language
        4. Cultural adaptation suggestions for each language
        
        Return as JSON with the specified structure.
      `;

      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const resultText = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(resultText);

    } catch (error) {
      console.error('Error analyzing multi-language content:', error);
      return {
        detectedLanguage: 'en',
        confidence: 0,
        translations: {},
        culturalAdaptations: {}
      };
    }
  }

  // Fallback analysis when AI service fails
  private getFallbackAnalysis(content: string, contentType?: string): ContentAnalysis {
    const wordCount = content.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    return {
      qualityScore: {
        overall: 75,
        readability: 70,
        engagement: 75,
        seoOptimization: 60,
        clarity: 80,
        tone: 75,
        structure: 70
      },
      suggestions: [
        {
          type: 'seo',
          severity: 'medium',
          message: 'Content could benefit from better SEO optimization',
          suggestion: 'Add relevant keywords and improve meta descriptions'
        }
      ],
      keywordDensity: {},
      sentimentAnalysis: {
        sentiment: 'neutral',
        confidence: 50
      },
      readingLevel: 'middle',
      wordCount,
      estimatedReadingTime,
      targetAudience: ['general'],
      contentType: contentType || 'general',
      strengths: ['Clear writing'],
      weaknesses: ['Could be more engaging']
    };
  }
}

export const aiContentAnalyzer = AIContentAnalyzer.getInstance(); 