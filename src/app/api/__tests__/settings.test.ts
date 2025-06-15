import { NextRequest } from 'next/server'
import { GET, POST } from '../settings/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/cache'

// Mock the dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/cache')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>

describe('/api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return cached settings when available', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const cachedSettings = {
        id: 'settings-1',
        userId: 'user-123',
        brandVoice: 'Professional and friendly',
        preferredPlatforms: ['twitter', 'linkedin'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getUserSettings.mockResolvedValue(cachedSettings)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(cachedSettings)
      expect(mockCacheService.getUserSettings).toHaveBeenCalledWith('user-123')
      expect(mockPrisma.settings.findUnique).not.toHaveBeenCalled()
    })

    it('should fetch settings from database when cache is empty', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const dbSettings = {
        id: 'settings-1',
        userId: 'user-123',
        brandVoice: 'Professional and friendly',
        preferredPlatforms: ['twitter', 'linkedin'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getUserSettings.mockResolvedValue(null)
      mockPrisma.settings.findUnique.mockResolvedValue(dbSettings)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(dbSettings)
      expect(mockPrisma.settings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
      expect(mockCacheService.setUserSettings).toHaveBeenCalledWith('user-123', dbSettings)
    })

    it('should return null when no settings exist', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getUserSettings.mockResolvedValue(null)
      mockPrisma.settings.findUnique.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toBeNull()
      expect(mockCacheService.setUserSettings).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getUserSettings.mockResolvedValue(null)
      mockPrisma.settings.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Internal Error')
    })
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          brandVoice: 'Professional',
          preferredPlatforms: ['twitter']
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 for invalid JSON', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: 'invalid json'
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid JSON')
    })

    it('should return 400 for validation errors', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          brandVoice: 'a'.repeat(1001), // Too long
          preferredPlatforms: ['invalid-platform']
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Validation failed')
      expect(responseData.details).toBeDefined()
    })

    it('should create new settings successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const requestData = {
        brandVoice: 'Professional and friendly',
        preferredPlatforms: ['twitter', 'linkedin']
      }
      const savedSettings = {
        id: 'settings-1',
        userId: 'user-123',
        ...requestData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.settings.upsert.mockResolvedValue(savedSettings)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(savedSettings)
      expect(mockPrisma.settings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          brandVoice: requestData.brandVoice,
          preferredPlatforms: requestData.preferredPlatforms,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: 'user-123',
          brandVoice: requestData.brandVoice,
          preferredPlatforms: requestData.preferredPlatforms
        }
      })
      expect(mockCacheService.invalidateUserSettings).toHaveBeenCalledWith('user-123')
    })

    it('should update existing settings successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const requestData = {
        brandVoice: 'Updated brand voice',
        preferredPlatforms: ['twitter', 'linkedin', 'instagram']
      }
      const savedSettings = {
        id: 'settings-1',
        userId: 'user-123',
        ...requestData,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.settings.upsert.mockResolvedValue(savedSettings)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(savedSettings)
      expect(mockCacheService.invalidateUserSettings).toHaveBeenCalledWith('user-123')
    })

    it('should handle optional fields correctly', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const requestData = {
        brandVoice: null, // Should be allowed
        preferredPlatforms: [] // Should use default empty array
      }
      const savedSettings = {
        id: 'settings-1',
        userId: 'user-123',
        brandVoice: null,
        preferredPlatforms: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.settings.upsert.mockResolvedValue(savedSettings)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(savedSettings)
    })

    it('should handle database errors during save', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.settings.upsert.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          brandVoice: 'Professional',
          preferredPlatforms: ['twitter']
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Internal Error')
    })
  })
})