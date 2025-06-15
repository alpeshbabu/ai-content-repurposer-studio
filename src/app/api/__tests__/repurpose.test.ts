import { NextRequest } from 'next/server'
import { POST } from '../repurpose/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { repurposeContent } from '@/lib/ai-service'

// Mock the dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/ai-service')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockRepurposeContent = repurposeContent as jest.MockedFunction<typeof repurposeContent>

describe('/api/repurpose', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          platforms: ['twitter']
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

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test'
          // Missing content and platforms
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing required fields')
    })

    it('should repurpose content successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const requestData = {
        title: 'Test Content',
        content: 'This is test content for repurposing',
        contentType: 'blog',
        platforms: ['twitter', 'linkedin'],
        tone: 'professional',
        targetAudience: 'developers'
      }
      const mockRepurposedContent = [
        { platform: 'twitter', content: 'Twitter version of the content' },
        { platform: 'linkedin', content: 'LinkedIn version of the content' }
      ]
      const mockSavedContent = {
        id: 'content-1',
        title: 'Test Content',
        originalContent: 'This is test content for repurposing',
        contentType: 'blog',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        repurposed: [
          { id: 'rep-1', platform: 'twitter', content: 'Twitter version of the content' },
          { id: 'rep-2', platform: 'linkedin', content: 'LinkedIn version of the content' }
        ]
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockRepurposeContent.mockResolvedValue(mockRepurposedContent)
      mockPrisma.content.create.mockResolvedValue(mockSavedContent)

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.content).toEqual(mockSavedContent)
      
      expect(mockRepurposeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: requestData.title,
          content: requestData.content,
          platforms: requestData.platforms,
          tone: requestData.tone,
          targetAudience: requestData.targetAudience
        })
      )
    })

    it('should handle AI service errors', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockRepurposeContent.mockRejectedValue(new Error('AI service error'))

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          platforms: ['twitter']
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Failed to repurpose content')
    })

    it('should handle database save errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const mockRepurposedContent = [
        { platform: 'twitter', content: 'Twitter version' }
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockRepurposeContent.mockResolvedValue(mockRepurposedContent)
      mockPrisma.content.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          platforms: ['twitter']
        })
      })
      const response = await POST(request)

      // Should still return success with repurposed content, but with a warning
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.repurposedContent).toEqual(mockRepurposedContent)
      expect(responseData.warning).toContain('generated but could not be saved')
    })

    it('should use default values for optional fields', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }
      const mockRepurposedContent = [
        { platform: 'twitter', content: 'Twitter version' }
      ]
      const mockSavedContent = {
        id: 'content-1',
        title: 'Test',
        originalContent: 'Test content',
        contentType: 'general',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        repurposed: [
          { id: 'rep-1', platform: 'twitter', content: 'Twitter version' }
        ]
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockRepurposeContent.mockResolvedValue(mockRepurposedContent)
      mockPrisma.content.create.mockResolvedValue(mockSavedContent)

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          platforms: ['twitter']
          // Optional fields not provided
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockRepurposeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'general',
          tone: 'professional',
          targetAudience: '',
          brandVoice: '',
          additionalInstructions: ''
        })
      )
    })

    it('should validate platform array', async () => {
      const mockSession = {
        user: { id: 'user-123' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/repurpose', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test content',
          platforms: [] // Empty platforms array
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing required fields')
    })
  })
})