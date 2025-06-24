import { NextRequest } from 'next/server'
import { GET, POST } from '../subscription/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/cache'
import { validateUserTable, ensureDailyUsageTableExists, tableExists } from '@/lib/db-setup'
import { updateSubscription, SUBSCRIPTION_LIMITS } from '@/lib/subscription'

// Mock the dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/cache')
jest.mock('@/lib/db-setup')
jest.mock('@/lib/subscription')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
const mockValidateUserTable = validateUserTable as jest.MockedFunction<typeof validateUserTable>
const mockEnsureDailyUsageTableExists = ensureDailyUsageTableExists as jest.MockedFunction<typeof ensureDailyUsageTableExists>
const mockTableExists = tableExists as jest.MockedFunction<typeof tableExists>
const mockUpdateSubscription = updateSubscription as jest.MockedFunction<typeof updateSubscription>

describe('/api/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/subscription')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return cached data when available', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const cachedSubscription = {
        plan: 'pro',
        status: 'active',
        renewalDate: '2024-02-01T00:00:00.000Z'
      }
      const cachedUsage = {
        current: 10,
        limit: 60,
        remaining: 50,
        daily: {
          current: 2,
          limit: 'Unlimited',
          remaining: 'Unlimited'
        }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getSubscription.mockResolvedValue(cachedSubscription)
      mockCacheService.getUsageData.mockResolvedValue(cachedUsage)

      const request = new NextRequest('http://localhost:3000/api/subscription')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.subscription).toEqual(cachedSubscription)
      expect(responseData.usage).toEqual(cachedUsage)
    })

    it('should return default values when user table is invalid', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getSubscription.mockResolvedValue(null)
      mockCacheService.getUsageData.mockResolvedValue(null)
      mockValidateUserTable.mockRejectedValue(new Error('Table invalid'))

      const request = new NextRequest('http://localhost:3000/api/subscription')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.subscription.plan).toBe('free')
      expect(responseData.subscription.status).toBe('active')
      expect(responseData.usage.limit).toBe(SUBSCRIPTION_LIMITS.free)
    })

    it('should fetch user data and cache it when cache is empty', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const mockUser = {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionRenewalDate: new Date('2024-02-01'),
        usageThisMonth: 15
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getSubscription.mockResolvedValue(null)
      mockCacheService.getUsageData.mockResolvedValue(null)
      mockValidateUserTable.mockResolvedValue(true)
      
      // Mock prisma.user.findUnique
      const mockPrisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser)
        },
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ count: 3 }])
      }
      jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }))

      mockEnsureDailyUsageTableExists.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/subscription')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.subscription.plan).toBe('pro')
      expect(responseData.usage.current).toBe(15)
      expect(mockCacheService.setSubscription).toHaveBeenCalled()
      expect(mockCacheService.setUsageData).toHaveBeenCalled()
    })

    it('should handle user not found gracefully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getSubscription.mockResolvedValue(null)
      mockCacheService.getUsageData.mockResolvedValue(null)
      mockValidateUserTable.mockResolvedValue(true)
      
      // Mock prisma.user.findUnique to return null
      const mockPrisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      }
      jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }))

      const request = new NextRequest('http://localhost:3000/api/subscription')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.subscription.plan).toBe('free')
      expect(responseData.subscription.status).toBe('active')
    })
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' })
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 for invalid plan', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid-plan' })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid plan')
    })

    it('should return 503 when user table does not exist', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' })
      })
      const response = await POST(request)

      expect(response.status).toBe(503)
      expect(await response.text()).toBe('Subscription system is initializing')
    })

    it('should update subscription successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(true)
      mockUpdateSubscription.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' })
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Subscription updated to pro')
      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        'user-123',
        'pro',
        'active',
        expect.any(Date)
      )
      expect(mockCacheService.invalidateSubscription).toHaveBeenCalledWith('user-123')
      expect(mockCacheService.invalidateUsageData).toHaveBeenCalledWith('user-123')
    })

    it('should handle database errors during subscription update', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(true)
      mockUpdateSubscription.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' })
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Database error while updating subscription')
    })
  })
})