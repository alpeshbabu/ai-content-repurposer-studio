import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Use a fixed secret for development
// In production, use a strong, randomly generated secret stored in environment variables
const DEV_SECRET = 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d'

// Ensure NEXTAUTH_SECRET is available
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = DEV_SECRET;
}

// We need to handle the port situation properly
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Make NEXTAUTH_URL available for other modules
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = baseUrl;
}

// Configure secure authentication
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider (only if credentials are available)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),

    // GitHub OAuth Provider (only if credentials are available)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),

    // Email Magic Link Provider (only if email configuration is available)
    ...(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_FROM ? [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      })
    ] : []),

    // Credentials Provider for email/password (always available)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password')
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: { accounts: true }
          })

          if (!user) {
            throw new Error('Invalid email or password')
          }

          // Check if user has a credentials account
          const credentialsAccount = user.accounts.find(
            account => account.provider === 'credentials'
          )

          if (!credentialsAccount?.refresh_token) {
            throw new Error('Invalid email or password')
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            credentialsAccount.refresh_token
          )

          if (!isPasswordValid) {
            throw new Error('Invalid email or password')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard',
    signOut: '/'
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Allow OAuth sign-ins
        if (account?.provider !== 'credentials') {
          return true
        }

        // For credentials, user is already validated in authorize function
        return true
      } catch (error) {
        console.error('Sign-in error:', error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in - store user ID in token
      if (user) {
        console.log('JWT callback: Setting user ID in token', user.id)
        token.id = user.id
      }

      // For subsequent requests, ensure we still have the user ID
      if (!token.id && account) {
        console.error('JWT callback: token.id missing after account link', { token, account })
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        // Ensure we have a user ID
        if (!token.id) {
          console.error('Session callback: token.id is undefined', { token, session })
          return session
        }

        session.user.id = token.id as string

        // Fetch fresh user data
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
              usageThisMonth: true,
              role: true,
              teamId: true,
            }
          })

          if (user) {
            (session.user as any).subscriptionPlan = user.subscriptionPlan;
            (session.user as any).subscriptionStatus = user.subscriptionStatus;
            (session.user as any).usageThisMonth = user.usageThisMonth;
            (session.user as any).role = user.role;
            (session.user as any).teamId = user.teamId;
          } else {
            console.error('Session callback: User not found for ID:', token.id)
          }
        } catch (error) {
          console.error('Session callback error:', error)
        }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Handle signout redirects - always go to home page
      if (url.includes('/api/auth/signout')) {
        return baseUrl
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      
      // Initialize user data on first sign-in
      if (isNewUser && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionPlan: 'free',
              subscriptionStatus: 'active',
              usageThisMonth: 0,
            }
          })
        } catch (error) {
          console.error('Failed to initialize user data:', error)
        }
      }
    },

    async signOut() {
      console.log(`User signed out`)
    }
  },

  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
} 