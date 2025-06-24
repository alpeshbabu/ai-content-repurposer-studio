// Global type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL?: string
      ANTHROPIC_API_KEY?: string
      STRIPE_SECRET_KEY?: string
      REDIS_URL?: string
      ADMIN_JWT_SECRET?: string
    }
  }
}

// Extend NextRequest to include ip property
declare module 'next/server' {
  interface NextRequest {
    ip?: string
  }
}

// Define missing types for external libraries
declare module '@radix-ui/react-toast' {
  export * from '@radix-ui/react-toast'
}

declare module 'next-themes/dist/types' {
  export interface ThemeProviderProps {
    children: React.ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
  }
}

// Lucide React Template icon (doesn't exist, using Layout as fallback)
declare module 'lucide-react' {
  export { Layout as Template } from 'lucide-react'
}

// Type definitions for better type safety
export interface UserWithPlan {
  id: string
  name: string | null
  email: string
  subscriptionPlan: string
  plan?: string // Legacy field
}

export interface DatabaseUser {
  id: string
  name: string | null
  email: string
  role: string | null
  emailVerified: Date | null
  image: string | null
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptions?: any[]
  team?: {
    id: string
    name: string
    members: Array<{
      userId: string
      user: {
        id: string
        name: string | null
        email: string
      }
    }>
  }
}

export interface ContentStats {
  status: string
  _count: number
}

export interface PlatformStats {
  platform: string
  _count: number
}

export interface UsageRecord {
  userId: string
  period: string // YYYY-MM format
  contentGenerated: number
  contentRepurposed: number
  apiCalls: number
  overageCharges: number
  totalUsage: number
  planLimits: {
    monthlyLimit: number
    overageRate: number
  }
}

export interface BillingCycle {
  id: string
  userId: string
  status: 'pending' | 'processed' | 'failed'
  period: string
  planType: string
  baseAmount: number
  usageAmount: number
  overageAmount: number
  totalAmount: number
  stripeInvoiceId: string | null
  processedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user?: DatabaseUser
}

export interface SubscriptionWithCustomer {
  id: string
  userId: string
  status: string
  stripeSubscriptionId: string
  stripePriceId: string
  stripeCustomerId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsData {
  _sum?: {
    views?: number
    repurposes?: number
  }
  _avg?: {
    views?: number
    repurposes?: number
  }
}

export {} 