import * as z from "zod"

// User management schemas
export const userUpdateSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  role: z.enum(["user", "admin", "super_admin"]),
  subscriptionPlan: z.enum(["free", "basic", "pro", "agency"]),
  subscriptionStatus: z.enum(["active", "cancelled", "pending", "past_due"]),
  isActive: z.boolean(),
  emailVerified: z.boolean()
})

export const bulkUserActionSchema = z.object({
  userIds: z.array(z.string().uuid()),
  action: z.enum([
    "activate",
    "deactivate", 
    "delete",
    "export",
    "send_email",
    "change_plan"
  ]),
  data: z.record(z.any()).optional()
})

// System settings schemas
export const systemSettingsSchema = z.object({
  siteName: z.string()
    .min(1, "Site name is required")
    .max(100, "Site name must be less than 100 characters"),
  siteDescription: z.string()
    .max(500, "Site description must be less than 500 characters")
    .optional(),
  maintenanceMode: z.boolean(),
  allowSignups: z.boolean(),
  maxUsersPerTeam: z.number()
    .min(1, "Must allow at least 1 user per team")
    .max(50, "Cannot exceed 50 users per team"),
  defaultPlan: z.enum(["free", "basic", "pro", "agency"]),
  emailSettings: z.object({
    provider: z.enum(["resend", "sendgrid", "mailgun", "smtp"]),
    fromEmail: z.string().email("Please enter a valid from email"),
    fromName: z.string().min(1, "From name is required"),
    replyToEmail: z.string().email("Please enter a valid reply-to email").optional()
  }),
  aiSettings: z.object({
    primaryProvider: z.enum(["anthropic", "groq"]),
    enableFallback: z.boolean(),
    rateLimitPerMinute: z.number().min(1).max(1000),
    maxContentLength: z.number().min(100).max(50000),
    allowedModels: z.array(z.string())
  })
})

// Analytics and reporting schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum([
    "users",
    "content_generated", 
    "api_requests",
    "revenue",
    "subscriptions",
    "usage"
  ])),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
  filters: z.record(z.any()).optional()
})

export const reportGenerationSchema = z.object({
  type: z.enum([
    "user_activity",
    "content_analytics", 
    "revenue_report",
    "system_health",
    "usage_report"
  ]),
  format: z.enum(["pdf", "csv", "json"]),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  filters: z.record(z.any()).optional(),
  includeCharts: z.boolean().default(true)
})

// Content moderation schemas
export const contentModerationSchema = z.object({
  contentId: z.string().uuid(),
  action: z.enum(["approve", "reject", "flag", "delete"]),
  reason: z.string()
    .max(500, "Reason must be less than 500 characters")
    .optional(),
  moderatorNotes: z.string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
})

// Billing and subscription schemas
export const subscriptionUpdateSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "basic", "pro", "agency"]),
  status: z.enum(["active", "cancelled", "pending", "past_due"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  customPricing: z.number().positive().optional(),
  notes: z.string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
})

export const refundRequestSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.string()
    .min(1, "Reason is required")
    .max(500, "Reason must be less than 500 characters"),
  type: z.enum(["full", "partial"])
})

// Support ticket management
export const ticketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignedTo: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  internalNotes: z.string()
    .max(2000, "Internal notes must be less than 2000 characters")
    .optional()
})

export const ticketReplySchema = z.object({
  message: z.string()
    .min(1, "Message is required")
    .max(5000, "Message must be less than 5000 characters"),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string()).optional()
})

// API key management
export const apiKeySchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  permissions: z.array(z.enum([
    "read",
    "write", 
    "delete",
    "admin"
  ])),
  expiresAt: z.string().datetime().optional(),
  rateLimitPerHour: z.number()
    .min(1, "Must allow at least 1 request per hour")
    .max(10000, "Cannot exceed 10,000 requests per hour")
    .default(1000)
})

// Export types
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type BulkUserActionInput = z.infer<typeof bulkUserActionSchema>
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>
export type ReportGenerationInput = z.infer<typeof reportGenerationSchema>
export type ContentModerationInput = z.infer<typeof contentModerationSchema>
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>
export type RefundRequestInput = z.infer<typeof refundRequestSchema>
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>
export type TicketReplyInput = z.infer<typeof ticketReplySchema>
export type ApiKeyInput = z.infer<typeof apiKeySchema>