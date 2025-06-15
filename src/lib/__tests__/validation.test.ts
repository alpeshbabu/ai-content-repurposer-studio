import { z } from 'zod'

// Test validation schemas that would be used in the app
describe('Validation Schemas', () => {
  describe('Settings Validation', () => {
    const settingsSchema = z.object({
      brandVoice: z.string().max(1000, 'Brand voice must be less than 1000 characters').optional().nullable(),
      preferredPlatforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread'])).optional().default([])
    })

    it('should validate valid settings data', () => {
      const validData = {
        brandVoice: 'Professional and friendly',
        preferredPlatforms: ['twitter', 'linkedin']
      }

      const result = settingsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.brandVoice).toBe('Professional and friendly')
        expect(result.data.preferredPlatforms).toEqual(['twitter', 'linkedin'])
      }
    })

    it('should handle null brand voice', () => {
      const validData = {
        brandVoice: null,
        preferredPlatforms: ['twitter']
      }

      const result = settingsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.brandVoice).toBeNull()
      }
    })

    it('should use default empty array for preferredPlatforms', () => {
      const validData = {
        brandVoice: 'Test voice'
      }

      const result = settingsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.preferredPlatforms).toEqual([])
      }
    })

    it('should reject brand voice that is too long', () => {
      const invalidData = {
        brandVoice: 'a'.repeat(1001),
        preferredPlatforms: ['twitter']
      }

      const result = settingsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Brand voice must be less than 1000 characters')
      }
    })

    it('should reject invalid platform names', () => {
      const invalidData = {
        brandVoice: 'Test',
        preferredPlatforms: ['twitter', 'invalid-platform']
      }

      const result = settingsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Content Validation', () => {
    const contentSchema = z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
      content: z.string().min(1, 'Content is required'),
      contentType: z.enum(['blog', 'video_transcript', 'article', 'social_post', 'email', 'general']),
      platforms: z.array(z.string()).min(1, 'At least one platform is required'),
      tone: z.string().optional().default('professional'),
      targetAudience: z.string().optional().default('')
    })

    it('should validate valid content data', () => {
      const validData = {
        title: 'My Blog Post',
        content: 'This is the content of my blog post',
        contentType: 'blog' as const,
        platforms: ['twitter', 'linkedin'],
        tone: 'professional',
        targetAudience: 'developers'
      }

      const result = contentSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('My Blog Post')
        expect(result.data.contentType).toBe('blog')
        expect(result.data.platforms).toEqual(['twitter', 'linkedin'])
      }
    })

    it('should use default values for optional fields', () => {
      const validData = {
        title: 'My Post',
        content: 'Content here',
        contentType: 'general' as const,
        platforms: ['twitter']
      }

      const result = contentSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tone).toBe('professional')
        expect(result.data.targetAudience).toBe('')
      }
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        content: 'Content here',
        contentType: 'blog' as const,
        platforms: ['twitter']
      }

      const result = contentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required')
      }
    })

    it('should reject empty platforms array', () => {
      const invalidData = {
        title: 'My Post',
        content: 'Content here',
        contentType: 'blog' as const,
        platforms: []
      }

      const result = contentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one platform is required')
      }
    })

    it('should reject invalid content type', () => {
      const invalidData = {
        title: 'My Post',
        content: 'Content here',
        contentType: 'invalid-type' as any,
        platforms: ['twitter']
      }

      const result = contentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('User Registration Validation', () => {
    const userSchema = z.object({
      email: z.string().email('Invalid email address'),
      name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })

    it('should validate valid user data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'securePassword123',
        confirmPassword: 'securePassword123'
      }

      const result = userSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'John Doe',
        password: 'securePassword123',
        confirmPassword: 'securePassword123'
      }

      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
        confirmPassword: 'differentPassword123'
      }

      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordError = result.error.issues.find(issue => issue.path.includes('confirmPassword'))
        expect(passwordError?.message).toBe("Passwords don't match")
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'short',
        confirmPassword: 'short'
      }

      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters')
      }
    })
  })
})