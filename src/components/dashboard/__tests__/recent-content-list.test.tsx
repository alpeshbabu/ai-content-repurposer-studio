import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecentContentList from '../recent-content-list'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock platform icons  
jest.mock('../../../lib/platform-icons', () => ({
  PlatformIcon: ({ platform }: { platform: string }) => <div data-testid={`platform-icon-${platform}`}>{platform}</div>,
  PlatformBadge: ({ platform }: { platform: string }) => <span data-testid={`platform-badge-${platform}`}>{platform}</span>,
  getPlatformConfig: (platform: string) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  })
}))

const mockContentData = {
  contents: [
    {
      id: 'content-1',
      title: 'AI Productivity Tips',
      contentType: 'blog',
      originalContent: 'This is a comprehensive guide about AI productivity tools that can help streamline your workflow.',
      repurposed: [
        {
          id: 'rep-1',
          platform: 'twitter',
          content: 'Quick AI productivity tips to boost your workflow! 🚀 #AI #productivity',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: 'rep-2',
          platform: 'linkedin',
          content: 'Comprehensive guide to AI productivity tools that can transform your daily workflow. Here are the top strategies professionals are using...',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      ],
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T09:00:00.000Z'
    },
    {
      id: 'content-2',
      title: 'Remote Work Best Practices',
      contentType: 'article',
      originalContent: 'Remote work has become the new normal. Here are essential practices for success.',
      repurposed: [
        {
          id: 'rep-3',
          platform: 'twitter',
          content: 'Remote work best practices thread 🧵 1/5',
          createdAt: '2024-01-14T15:00:00.000Z',
          updatedAt: '2024-01-14T15:00:00.000Z'
        }
      ],
      createdAt: '2024-01-14T14:00:00.000Z',
      updatedAt: '2024-01-14T14:00:00.000Z'
    }
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    pages: 1
  }
}

describe('RecentContentList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<RecentContentList />)

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('should render content list when data is loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
      expect(screen.getByText('Remote Work Best Practices')).toBeInTheDocument()
    })

    expect(screen.getByTestId('platform-badge-twitter')).toBeInTheDocument()
    expect(screen.getByTestId('platform-badge-linkedin')).toBeInTheDocument()
  })

  it('should render empty state when no content exists', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ contents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } })
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText(/no content yet/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first piece/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /create new content/i })).toHaveAttribute('href', '/dashboard/new')
  })

  it('should render error state when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText(/unable to load content/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  it('should allow expanding and collapsing content items', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    })

    // Initially collapsed - full content should not be visible
    expect(screen.queryByText('This is a comprehensive guide about AI productivity tools')).not.toBeInTheDocument()

    // Click to expand
    const expandButton = screen.getByRole('button', { name: /ai productivity tips/i })
    await user.click(expandButton)

    // Should now show expanded content
    expect(screen.getByText('This is a comprehensive guide about AI productivity tools')).toBeInTheDocument()
    expect(screen.getByText('Quick AI productivity tips to boost your workflow! 🚀 #AI #productivity')).toBeInTheDocument()

    // Click to collapse
    await user.click(expandButton)

    // Should hide expanded content again
    expect(screen.queryByText('This is a comprehensive guide about AI productivity tools')).not.toBeInTheDocument()
  })

  it('should filter content based on search query', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
      expect(screen.getByText('Remote Work Best Practices')).toBeInTheDocument()
    })

    // Search for "AI"
    const searchInput = screen.getByPlaceholderText(/search content/i)
    await user.type(searchInput, 'AI')

    // Should only show AI-related content
    expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    expect(screen.queryByText('Remote Work Best Practices')).not.toBeInTheDocument()
    expect(screen.getByText(/1 of 2 content items matching "AI"/i)).toBeInTheDocument()
  })

  it('should show no results message when search has no matches', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    })

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText(/search content/i)
    await user.type(searchInput, 'nonexistent')

    expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    expect(screen.getByText(/no content found matching "nonexistent"/i)).toBeInTheDocument()
  })

  it('should allow clearing search', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    })

    // Search for something
    const searchInput = screen.getByPlaceholderText(/search content/i)
    await user.type(searchInput, 'AI')

    // Clear button should appear
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()

    // Click clear
    await user.click(clearButton)

    // Search should be cleared and all content visible
    expect(searchInput).toHaveValue('')
    expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    expect(screen.getByText('Remote Work Best Practices')).toBeInTheDocument()
  })

  it('should copy content to clipboard', async () => {
    const user = userEvent.setup()
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    })

    // Expand content to see copy buttons
    const expandButton = screen.getByRole('button', { name: /ai productivity tips/i })
    await user.click(expandButton)

    // Find and click a copy button
    const copyButtons = screen.getAllByRole('button', { name: /copy/i })
    await user.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Quick AI productivity tips to boost your workflow! 🚀 #AI #productivity'
    )
  })

  it('should show pagination when there are multiple pages', async () => {
    const paginatedData = {
      ...mockContentData,
      pagination: {
        total: 25,
        page: 1,
        limit: 10,
        pages: 3
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(paginatedData)
    })

    render(<RecentContentList showPagination={true} />)

    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 2 of 25 results')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    })
  })

  it('should navigate between pages', async () => {
    const user = userEvent.setup()
    const paginatedData = {
      ...mockContentData,
      pagination: {
        total: 25,
        page: 1,
        limit: 10,
        pages: 3
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(paginatedData)
    })

    render(<RecentContentList showPagination={true} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    })

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    // Should make a new fetch request for page 2
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/content?limit=10&offset=10')
    })
  })

  it('should handle retry when fetch fails', async () => {
    const user = userEvent.setup()
    
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<RecentContentList />)

    await waitFor(() => {
      expect(screen.getByText(/unable to load content/i)).toBeInTheDocument()
    })

    // Mock successful retry
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('AI Productivity Tips')).toBeInTheDocument()
    })
  })

  it('should format dates correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentData)
    })

    render(<RecentContentList />)

    await waitFor(() => {
      // Check that dates are formatted (format depends on locale, but should include month and day)
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 14, 2024/i)).toBeInTheDocument()
    })
  })
})