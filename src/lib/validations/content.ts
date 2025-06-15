import * as z from "zod"

export const contentTypeSchema = z.enum([
  "blog",
  "video_transcript", 
  "article",
  "social_post",
  "email",
  "general"
])

export const toneSchema = z.enum([
  "professional",
  "casual", 
  "expert",
  "engaging",
  "formal"
])

export const platformSchema = z.enum([
  "twitter",
  "linkedin",
  "instagram", 
  "facebook",
  "email",
  "newsletter",
  "thread"
])

// Content Generation Schema
export const contentGenerationSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  keywords: z.string()
    .min(1, "Keywords are required")
    .max(1000, "Keywords must be less than 1000 characters"),
  tone: toneSchema.default("professional"),
  targetAudience: z.string()
    .max(200, "Target audience must be less than 200 characters")
    .optional(),
  contentType: contentTypeSchema.default("blog"),
  allowOverage: z.boolean().default(false)
})

// Content Repurposing Schema
export const contentRepurposingSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters"),
  contentType: contentTypeSchema.default("blog"),
  platforms: z.array(platformSchema).optional(),
  allowOverage: z.boolean().default(false)
})

// Content Creation Schema (for database)
export const contentCreateSchema = z.object({
  title: z.string().min(1).max(200),
  originalContent: z.string().min(1).max(10000),
  contentType: contentTypeSchema,
  userId: z.string().uuid(),
  repurposed: z.array(z.object({
    platform: platformSchema,
    content: z.string().min(1).max(5000)
  }))
})

// Brand Voice Schema
export const brandVoiceSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  tone: toneSchema,
  keywords: z.string()
    .max(500, "Keywords must be less than 500 characters")
    .optional(),
  examples: z.string()
    .max(2000, "Examples must be less than 2000 characters")
    .optional()
})

// API Response Schemas
export const repurposedContentSchema = z.object({
  platform: platformSchema,
  content: z.string()
})

export const contentResponseSchema = z.object({
  success: z.boolean(),
  content: z.object({
    id: z.string().optional(),
    title: z.string(),
    originalContent: z.string().optional(),
    repurposed: z.array(repurposedContentSchema)
  }).optional(),
  usage: z.object({
    used: z.number(),
    remaining: z.union([z.number(), z.literal("Unlimited")])
  }).optional(),
  warning: z.string().optional(),
  error: z.string().optional()
})

// Form validation schemas
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  subject: z.string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .min(1, "Message is required")
    .max(2000, "Message must be less than 2000 characters")
})

export const supportTicketSchema = z.object({
  subject: z.string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .min(1, "Message is required")
    .max(5000, "Message must be less than 5000 characters"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.enum([
    "technical",
    "billing", 
    "feature_request",
    "bug_report",
    "general"
  ]).default("general")
})

// Export types
export type ContentType = z.infer<typeof contentTypeSchema>
export type Tone = z.infer<typeof toneSchema>
export type Platform = z.infer<typeof platformSchema>
export type ContentGenerationInput = z.infer<typeof contentGenerationSchema>
export type ContentRepurposingInput = z.infer<typeof contentRepurposingSchema>
export type ContentCreateInput = z.infer<typeof contentCreateSchema>
export type BrandVoiceInput = z.infer<typeof brandVoiceSchema>
export type RepurposedContent = z.infer<typeof repurposedContentSchema>
export type ContentResponse = z.infer<typeof contentResponseSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type SupportTicketInput = z.infer<typeof supportTicketSchema>