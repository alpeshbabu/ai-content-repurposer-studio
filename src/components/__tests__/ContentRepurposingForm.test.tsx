import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContentRepurposingForm from '../ContentRepurposingForm'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock toast notifications
jest.mock('@/lib/toast', () => ({
  notifications: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  notificationTemplates: {
    contentRepurposed: jest.fn(),
    repurposeError: jest.fn(),
  }
}))

describe('ContentRepurposingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render the form with all required fields', () => {
    render(<ContentRepurposingForm />)

    expect(screen.getByLabelText(/content title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/content type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target platforms/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate content/i })).toBeInTheDocument()
  })

  it('should switch between generate and repurpose modes', async () => {
    const user = userEvent.setup()
    render(<ContentRepurposingForm />)

    // Initially in generate mode
    expect(screen.getByLabelText(/keywords & topics/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/your content/i)).not.toBeInTheDocument()

    // Switch to repurpose mode
    const toggleButton = screen.getByRole('button', { name: /workflow mode toggle/i })
    await user.click(toggleButton)

    // Should now be in repurpose mode
    expect(screen.queryByLabelText(/keywords & topics/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/your content/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /repurpose content/i })).toBeInTheDocument()
  })

  it('should show usage status when loaded', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: {
              current: 15,
              limit: 60,
              remaining: 45,
              daily: {
                current: 3,
                limit: 'Unlimited',
                remaining: 'Unlimited'
              }
            },
            subscription: {
              plan: 'pro',
              status: 'active',
              renewalDate: '2024-02-01T00:00:00.000Z'
            }
          })
        })
      }
    })

    render(<ContentRepurposingForm />)

    await waitFor(() => {
      expect(screen.getByText(/usage status/i)).toBeInTheDocument()
      expect(screen.getByText(/45 repurposes remaining this month/i)).toBeInTheDocument()
    })
  })

  it('should validate required fields in generate mode', async () => {
    const user = userEvent.setup()
    render(<ContentRepurposingForm />)

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /generate content/i })
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/content/generate'))
    })
  })

  it('should validate required fields in repurpose mode', async () => {
    const user = userEvent.setup()
    render(<ContentRepurposingForm />)

    // Switch to repurpose mode
    const toggleButton = screen.getByRole('button', { name: /workflow mode toggle/i })
    await user.click(toggleButton)

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /repurpose content/i })
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/repurpose'))
    })
  })

  it('should successfully generate and repurpose content', async () => {
    const user = userEvent.setup()
    
    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: { current: 5, limit: 60, remaining: 55 },
            subscription: { plan: 'pro', status: 'active' }
          })
        })
      }
      if (url.includes('/api/content/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              content: 'Generated content about AI and productivity'
            }
          })
        })
      }
      if (url.includes('/api/repurpose')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            content: {
              repurposed: [
                { platform: 'twitter', content: 'Twitter version of the content' },
                { platform: 'linkedin', content: 'LinkedIn version of the content' }
              ]
            }
          })
        })
      }
    })

    render(<ContentRepurposingForm />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate content/i })).not.toBeDisabled()
    })

    // Fill in the form
    await user.type(screen.getByLabelText(/content title/i), 'AI Productivity Tips')
    await user.type(screen.getByLabelText(/keywords & topics/i), 'AI, productivity, automation, efficiency')

    // Select platforms
    const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i })
    const linkedinCheckbox = screen.getByRole('checkbox', { name: /linkedin/i })
    await user.click(twitterCheckbox)
    await user.click(linkedinCheckbox)

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate content/i })
    await user.click(submitButton)

    // Wait for the process to complete
    await waitFor(() => {
      expect(screen.getByText(/content successfully generated/i)).toBeInTheDocument()
    })

    // Check that results are displayed
    expect(screen.getByText(/twitter/i)).toBeInTheDocument()
    expect(screen.getByText(/linkedin/i)).toBeInTheDocument()
    expect(screen.getByText(/twitter version of the content/i)).toBeInTheDocument()
    expect(screen.getByText(/linkedin version of the content/i)).toBeInTheDocument()
  })

  it('should successfully repurpose existing content', async () => {
    const user = userEvent.setup()
    
    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: { current: 5, limit: 60, remaining: 55 },
            subscription: { plan: 'pro', status: 'active' }
          })
        })
      }
      if (url.includes('/api/repurpose')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            content: {
              repurposed: [
                { platform: 'twitter', content: 'Twitter version' },
                { platform: 'instagram', content: 'Instagram version' }
              ]
            }
          })
        })
      }
    })

    render(<ContentRepurposingForm />)

    // Switch to repurpose mode
    const toggleButton = screen.getByRole('button', { name: /workflow mode toggle/i })
    await user.click(toggleButton)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /repurpose content/i })).not.toBeDisabled()
    })

    // Fill in the form
    await user.type(screen.getByLabelText(/content title/i), 'Existing Blog Post')
    await user.type(screen.getByLabelText(/your content/i), 'This is my existing blog post content that I want to repurpose for social media.')

    // Select platforms
    const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i })
    const instagramCheckbox = screen.getByRole('checkbox', { name: /instagram/i })
    await user.click(twitterCheckbox)
    await user.click(instagramCheckbox)

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /repurpose content/i })
    await user.click(submitButton)

    // Wait for the process to complete
    await waitFor(() => {
      expect(screen.getByText(/content successfully repurposed/i)).toBeInTheDocument()
    })

    // Check that results are displayed
    expect(screen.getByText(/twitter version/i)).toBeInTheDocument()
    expect(screen.getByText(/instagram version/i)).toBeInTheDocument()
  })

  it('should handle usage limit reached', async () => {
    const user = userEvent.setup()
    
    // Mock usage limit reached
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: { current: 60, limit: 60, remaining: 0 },
            subscription: { plan: 'pro', status: 'active' }
          })
        })
      }
    })

    render(<ContentRepurposingForm />)

    await waitFor(() => {
      expect(screen.getByText(/usage limit reached/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate content/i })).toBeDisabled()
    })

    // Should show overage checkbox
    expect(screen.getByLabelText(/i agree to pay/i)).toBeInTheDocument()

    // Enable overage and button should become enabled
    const overageCheckbox = screen.getByLabelText(/i agree to pay/i)
    await user.click(overageCheckbox)

    expect(screen.getByRole('button', { name: /generate content/i })).not.toBeDisabled()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: { current: 5, limit: 60, remaining: 55 },
            subscription: { plan: 'pro', status: 'active' }
          })
        })
      }
      if (url.includes('/api/content/generate')) {
        return Promise.resolve({
          ok: false,
          status: 500
        })
      }
    })

    render(<ContentRepurposingForm />)

    // Fill in the form
    await user.type(screen.getByLabelText(/content title/i), 'Test Title')
    await user.type(screen.getByLabelText(/keywords & topics/i), 'test keywords')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate content/i })
    await user.click(submitButton)

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.queryByText(/content successfully generated/i)).not.toBeInTheDocument()
    })
  })

  it('should allow copying generated content', async () => {
    const user = userEvent.setup()
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    })

    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/system/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      }
      if (url.includes('/api/subscription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            usage: { current: 5, limit: 60, remaining: 55 },
            subscription: { plan: 'pro', status: 'active' }
          })
        })
      }
      if (url.includes('/api/repurpose')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            content: {
              repurposed: [
                { platform: 'twitter', content: 'Twitter content to copy' }
              ]
            }
          })
        })
      }
    })

    render(<ContentRepurposingForm />)

    // Switch to repurpose mode and fill form
    const toggleButton = screen.getByRole('button', { name: /workflow mode toggle/i })
    await user.click(toggleButton)

    await user.type(screen.getByLabelText(/content title/i), 'Test')
    await user.type(screen.getByLabelText(/your content/i), 'Test content')

    const submitButton = screen.getByRole('button', { name: /repurpose content/i })
    await user.click(submitButton)

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/twitter content to copy/i)).toBeInTheDocument()
    })

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    // Check clipboard was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Twitter content to copy')
  })
})