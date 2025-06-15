# API Documentation for AI Content Repurposer Studio

This document provides comprehensive API documentation for frontend integration with the AI Content Repurposer Studio backend.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
All API endpoints require authentication via NextAuth session cookies. Include credentials in requests:

```javascript
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

## AI Content Generation

### Generate Content from Keywords
Generate new content using AI from provided keywords.

**Endpoint:** `POST /api/content/generate`

**Request Body:**
```typescript
{
  keywords: string;                    // Required: Keywords to base content on
  contentType: 'blog' | 'article' | 'social_post' | 'email' | 'video_transcript' | 'general';
  tone?: string;                       // Optional: Desired tone (e.g., "professional", "casual")
  brandVoice?: string;                 // Optional: Brand voice description
  targetAudience?: string;             // Optional: Target audience description
  additionalInstructions?: string;     // Optional: Additional instructions for AI
  provider?: 'anthropic' | 'groq';     // Optional: AI provider to use
  model?: string;                      // Optional: Specific model to use
  allowOverage?: boolean;              // Optional: Allow usage over limits (default: false)
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    content: string;                   // Generated content
    generatedAt: string;               // ISO timestamp
    provider: 'anthropic' | 'groq';   // Provider used
    model: string;                     // Model used
    metadata: {
      keywords: string;
      contentType: string;
      tone?: string;
      brandVoice?: string;
      targetAudience?: string;
      charactersGenerated: number;
    };
  };
  usage: {
    currentUsage: number;              // Current monthly usage
    monthlyLimit: number | null;       // Monthly limit (null = unlimited)
    plan: string;                      // Subscription plan
    remainingUsage: number | null;     // Remaining usage this month
  };
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Unauthorized
- `402`: Usage limit exceeded or subscription required
- `503`: AI service unavailable

## Content Repurposing

### Repurpose Content for Multiple Platforms
Transform existing content for different social media platforms.

**Endpoint:** `POST /api/repurpose`

**Request Body:**
```typescript
{
  title: string;                       // Required: Content title
  content: string;                     // Required: Original content
  contentType: string;                 // Required: Type of content
  platforms?: Platform[];              // Optional: Specific platforms to target
  brandVoice?: string;                 // Optional: Brand voice override
  tone?: string;                       // Optional: Tone override
  additionalInstructions?: string;     // Optional: Additional instructions
  provider?: 'anthropic' | 'groq';     // Optional: AI provider to use
  model?: string;                      // Optional: Specific model to use
  allowOverage?: boolean;              // Optional: Allow usage over limits
}

type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'email' | 'newsletter' | 'thread' | 'general';
```

**Response:**
```typescript
{
  success: true;
  data: {
    content: {                         // Saved content object
      id: string;
      title: string;
      originalContent: string;
      contentType: string;
      userId: string;
      createdAt: string;
      repurposed: RepurposedContent[];
    };
    repurposedContent: RepurposedContent[];  // Array of repurposed content
    metadata: {
      platformsUsed: Platform[];
      provider: string;
      brandVoice?: string;
      totalCharacters: number;
    };
  };
  usage: {
    currentUsage: number;
    monthlyLimit: number | null;
    plan: string;
    remainingUsage: number | null;
  };
  warning?: string;                    // Warning if content couldn't be saved
}

interface RepurposedContent {
  platform: Platform;
  content: string;
  characterCount: number;
  hashtagSuggestions?: string[];
}
```

## Content Management

### Get User's Content
Retrieve user's saved content with repurposed versions.

**Endpoint:** `GET /api/content?limit=10&offset=0`

**Query Parameters:**
- `limit`: Number of items to return (default: 10)
- `offset`: Number of items to skip (default: 0)

**Response:**
```typescript
Content[] // Array of content objects with repurposed versions

interface Content {
  id: string;
  title: string;
  originalContent: string;
  contentType: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  repurposed: {
    id: string;
    platform: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
}
```

### Save Content
Save new content to the database.

**Endpoint:** `POST /api/content`

**Request Body:**
```typescript
{
  title: string;                       // Required: Content title
  content: string;                     // Required: Original content
  contentType: string;                 // Required: Content type
  repurposedContent: {                 // Required: Array of repurposed content
    platform: string;
    content: string;
  }[];
}
```

## Brand Voice Management

### Get Brand Voice Settings
Retrieve user's brand voice and platform preferences.

**Endpoint:** `GET /api/brand-voice`

**Response:**
```typescript
{
  brandVoice: string;                  // User's brand voice description
  preferredPlatforms: Platform[];      // Preferred platforms array
  tone: string | null;                 // Default tone
  targetAudience: string | null;       // Default target audience
  additionalGuidelines: string | null; // Additional guidelines
  exists: boolean;                     // Whether settings exist
}
```

### Save Brand Voice Settings
Create or update user's brand voice settings.

**Endpoint:** `POST /api/brand-voice`

**Request Body:**
```typescript
{
  brandVoice: string;                  // Required: Brand voice description (max 1000 chars)
  preferredPlatforms?: Platform[];     // Optional: Preferred platforms
  tone?: string;                       // Optional: Default tone
  targetAudience?: string;             // Optional: Default target audience
  additionalGuidelines?: string;       // Optional: Additional guidelines
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    brandVoice: string;
    preferredPlatforms: Platform[];
    tone: string | null;
    targetAudience: string | null;
    additionalGuidelines: string | null;
    updatedAt: string;
  };
  message: string;
}
```

### Delete Brand Voice Settings
Remove user's brand voice settings.

**Endpoint:** `DELETE /api/brand-voice`

**Response:**
```typescript
{
  success: true;
  message: string;
}
```

## AI Service Information

### Get Available AI Providers
Get information about available AI providers and models.

**Endpoint:** `GET /api/ai/providers`

**Response:**
```typescript
{
  success: true;
  data: {
    availableProviders: ('anthropic' | 'groq')[];
    defaultProvider: 'anthropic' | 'groq' | null;
    providers: {
      anthropic: {
        available: boolean;
        configured: boolean;
        models: {
          id: string;
          name: string;
          description: string;
        }[];
      };
      groq: {
        available: boolean;
        configured: boolean;
        models: {
          id: string;
          name: string;
          description: string;
        }[];
      };
    };
    totalConfigured: number;
    recommendations: {
      speed: string;                   // Recommended provider for speed
      quality: string;                 // Recommended provider for quality
      balance: string;                 // Recommended provider for balance
    };
  };
}
```

### Validate Content
Validate content before processing with AI.

**Endpoint:** `POST /api/ai/validate`

**Request Body:**
```typescript
{
  content: string;                     // Required: Content to validate
  contentType: 'blog' | 'article' | 'social_post' | 'email' | 'video_transcript' | 'general';
  platforms?: Platform[];              // Optional: Target platforms
  keywords?: string;                   // Optional: Keywords for validation
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    isValid: boolean;                  // Whether content is valid for processing
    validation: {
      isValid: boolean;
      warnings: string[];              // Array of warning messages
      errors: string[];                // Array of error messages
      suggestions: string[];           // Array of suggestions
      metrics: {
        characterCount: number;
        wordCount: number;
        estimatedReadingTime: number;  // Minutes
        sentences: number;
        paragraphs: number;
      };
    };
    recommendations: {
      optimalLength: {
        min: number;
        max: number;
        ideal: number;
      };
      suggestedPlatforms: string[];
      estimatedProcessingTime: number; // Seconds
      qualityScore: number;            // 0-100
    };
    aiService: {
      availableProviders: string[];
      defaultProvider: string | null;
    };
  };
}
```

## Error Handling

### Standard Error Response Format
```typescript
{
  error: string;                       // Error type
  message: string;                     // Human-readable error message
  details?: any;                       // Additional error details (validation errors, etc.)
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not signed in)
- `402`: Payment Required (usage limits exceeded)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `503`: Service Unavailable (database not ready, AI service down)

### Special Headers
Some responses include special headers for frontend handling:

- `X-Subscription-Required`: Indicates subscription upgrade needed
- `X-Allow-Overage`: Indicates overage charges are possible
- `X-Limit-Type`: Type of limit exceeded ('monthly' or 'daily')
- `X-Error-Type`: Specific error type for debugging

## Frontend Integration Examples

### React Hook for Content Generation
```typescript
import { useState } from 'react';

interface GenerateContentRequest {
  keywords: string;
  contentType: string;
  tone?: string;
  brandVoice?: string;
  targetAudience?: string;
  additionalInstructions?: string;
  provider?: 'anthropic' | 'groq';
  allowOverage?: boolean;
}

export function useContentGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (request: GenerateContentRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate content');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateContent, loading, error };
}
```

### React Hook for Content Repurposing
```typescript
export function useContentRepurposing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repurposeContent = async (data: RepurposeRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/repurpose', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to repurpose content');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { repurposeContent, loading, error };
}
```

### Error Handling Example
```typescript
try {
  const result = await generateContent(request);
  // Handle success
} catch (error) {
  if (error.message.includes('Usage limit exceeded')) {
    // Show upgrade prompt or overage option
  } else if (error.message.includes('Subscription required')) {
    // Redirect to subscription page
  } else {
    // Show generic error message
  }
}
```

## Rate Limits and Usage

### Current Rate Limits
- Content Generation: Based on subscription plan
- Content Repurposing: Based on subscription plan
- Brand Voice Updates: 10 requests per minute
- Content Validation: 30 requests per minute

### Subscription Plans
- **Free**: 5 generations/repurposes per month
- **Pro**: 60 generations/repurposes per month + team features
- **Agency**: 450 generations/repurposes per month + advanced features

### Best Practices
1. Always check the `usage` object in responses to show remaining quota
2. Handle `402` status codes by offering upgrade or overage options
3. Implement loading states during AI processing (can take 3-10 seconds)
4. Cache brand voice settings locally to reduce API calls
5. Validate content client-side before sending to AI endpoints
6. Show character counts and platform limits in the UI
7. Implement retry logic for transient failures