import * as z from "zod"

// Authentication schemas
export const signInSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
})

export const signUpSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
})

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  website: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  company: z.string()
    .max(100, "Company name must be less than 100 characters")
    .optional(),
  location: z.string()
    .max(100, "Location must be less than 100 characters")
    .optional()
})

// Team management schemas
export const teamInviteSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]).default("member"),
  message: z.string()
    .max(500, "Message must be less than 500 characters")
    .optional()
})

export const teamMemberUpdateSchema = z.object({
  role: z.enum(["member", "admin"]),
  permissions: z.array(z.string()).optional()
})

// Export types
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type TeamInviteInput = z.infer<typeof teamInviteSchema>
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>