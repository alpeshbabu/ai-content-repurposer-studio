import { NextRequest } from 'next/server'
import { GET, POST } from '../content/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/cache'
import { tableExists } from '@/lib/db-setup'

// Mock the dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/cache')
jest.mock('@/lib/db-setup')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
const mockTableExists = tableExists as jest.MockedFunction<typeof tableExists>

describe('/api/content', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return cached data when available', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const cachedData = {
        contents: [
          {
            id: 'content-1',
            title: 'Test Content',
            contentType: 'blog',
            originalContent: 'Test content body',
            repurposed: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1
        }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getContentList.mockResolvedValue(cachedData)

      const request = new NextRequest('http://localhost:3000/api/content?limit=10&offset=0')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(cachedData)
      expect(mockCacheService.getContentList).toHaveBeenCalledWith('user-123', 1, 10)
    })

    it('should fetch from database when cache is empty', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const mockContents = [
        {
          id: 'content-1',
          title: 'Test Content',
          contentType: 'blog',
          originalContent: 'Test content body',
          repurposed: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          userId: 'user-123'
        }
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getContentList.mockResolvedValue(null)
      mockTableExists.mockResolvedValue(true)
      mockPrisma.content.count.mockResolvedValue(1)
      mockPrisma.content.findMany.mockResolvedValue(mockContents)

      const request = new NextRequest('http://localhost:3000/api/content?limit=10&offset=0')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.contents).toHaveLength(1)
      expect(responseData.pagination.total).toBe(1)
      expect(mockCacheService.setContentList).toHaveBeenCalled()
    })

    it('should return empty array when tables do not exist', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getContentList.mockResolvedValue(null)
      mockTableExists.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockCacheService.getContentList.mockResolvedValue(null)
      mockTableExists.mockResolvedValue(true)
      mockPrisma.content.count.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Should fall back to raw SQL or return empty array
    })
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          contentType: 'blog',
          repurposedContent: []
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 when required fields are missing', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test'
          // Missing required fields
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing required fields')
    })

    it('should create content successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const requestData = {
        title: 'Test Content',
        content: 'Test content body',
        contentType: 'blog',
        repurposedContent: [
          { platform: 'twitter', content: 'Twitter version' },
          { platform: 'linkedin', content: 'LinkedIn version' }
        ]
      }
      const mockSavedContent = {
        id: 'content-1',
        title: 'Test Content',
        originalContent: 'Test content body',
        contentType: 'blog',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        repurposed: [
          { id: 'rep-1', platform: 'twitter', content: 'Twitter version' },
          { id: 'rep-2', platform: 'linkedin', content: 'LinkedIn version' }
        ]
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(true)
      mockPrisma.content.create.mockResolvedValue(mockSavedContent)

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(mockSavedContent)
      expect(mockCacheService.invalidateContentList).toHaveBeenCalledWith('user-123')
    })

    it('should return 503 when database tables are not ready', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockTableExists.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          contentType: 'blog',
          repurposedContent: []
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(503)
      expect(await response.text()).toBe('Database tables not ready')
    })
  })
})