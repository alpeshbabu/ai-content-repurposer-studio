import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    subscriptionPlan?: string
    subscriptionStatus?: string
    usageThisMonth?: number
    role?: string | null
    teamId?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      subscriptionPlan?: string
      subscriptionStatus?: string
      usageThisMonth?: number
      role?: string | null
      teamId?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    subscriptionPlan?: string
    subscriptionStatus?: string
    usageThisMonth?: number
    role?: string | null
    teamId?: string | null
  }
} 