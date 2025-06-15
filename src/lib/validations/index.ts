// Export all validation schemas from a single file
export * from "./auth"
export * from "./content" 
export * from "./admin"

// Common validation utilities
import { z } from "zod"

export const createErrorMap = (): z.ZodErrorMap => (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "string") {
        return { message: "This field is required" }
      }
      break
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: `Must be at least ${issue.minimum} characters` }
      }
      if (issue.type === "number") {
        return { message: `Must be at least ${issue.minimum}` }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Must be no more than ${issue.maximum} characters` }
      }
      if (issue.type === "number") {
        return { message: `Must be no more than ${issue.maximum}` }
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") {
        return { message: "Please enter a valid email address" }
      }
      if (issue.validation === "url") {
        return { message: "Please enter a valid URL" }
      }
      break
  }
  return { message: ctx.defaultError }
}

// Set the custom error map globally
z.setErrorMap(createErrorMap())

// Utility function to safely parse data with detailed error handling
export function safeParseWithDetails<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string[]> = {}
  
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  })
  
  return { success: false, errors }
}

// Utility function to format validation errors for display
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ')
}

// Common validation patterns
export const commonPatterns = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  phone: /^\+?[1-9]\d{1,14}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const

// Reusable schema components
export const baseUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address")
})

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc")
})

export const idSchema = z.object({
  id: z.string().uuid("Invalid ID format")
})