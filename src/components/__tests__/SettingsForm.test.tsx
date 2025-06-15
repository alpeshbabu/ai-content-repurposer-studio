import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsForm from '../SettingsForm'

// Mock toast notifications
jest.mock('@/lib/toast', () => ({
  notificationTemplates: {
    settingsSaved: jest.fn(),
    settingsError: jest.fn(),
  }
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('SettingsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render with initial settings', () => {
    const initialSettings = {
      brandVoice: 'Professional and friendly',
      preferredPlatforms: ['twitter', 'linkedin']
    }

    render(<SettingsForm initialSettings={initialSettings} subscriptionPlan="pro" />)

    expect(screen.getByDisplayValue('Professional and friendly')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeChecked()
  })

  it('should render with empty initial state', () => {
    render(<SettingsForm subscriptionPlan="free" />)

    expect(screen.getByRole('textbox', { name: /brand voice/i })).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /twitter/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).not.toBeChecked()
  })

  it('should show platform restrictions for free plan', () => {
    render(<SettingsForm subscriptionPlan="free" />)

    expect(screen.getByText(/free plan includes twitter and instagram/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /linkedin/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /facebook/i })).not.toBeInTheDocument()
  })

  it('should show more platforms for basic plan', () => {
    render(<SettingsForm subscriptionPlan="basic" />)

    expect(screen.getByText(/basic plan includes twitter, instagram, and facebook/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /facebook/i })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /linkedin/i })).not.toBeInTheDocument()
  })

  it('should show all major platforms for pro plan', () => {
    render(<SettingsForm subscriptionPlan="pro" />)

    expect(screen.getByText(/pro plan includes all major platforms/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /facebook/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /email/i })).not.toBeInTheDocument()
  })

  it('should show all platforms for agency plan', () => {
    render(<SettingsForm subscriptionPlan="agency" />)

    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /facebook/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /newsletter/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /twitter thread/i })).toBeInTheDocument()
  })

  it('should allow updating brand voice', async () => {
    const user = userEvent.setup()
    render(<SettingsForm subscriptionPlan="pro" />)

    const brandVoiceTextarea = screen.getByRole('textbox', { name: /brand voice/i })
    await user.clear(brandVoiceTextarea)
    await user.type(brandVoiceTextarea, 'Casual and witty tone')

    expect(brandVoiceTextarea).toHaveValue('Casual and witty tone')
  })

  it('should allow selecting and deselecting platforms', async () => {
    const user = userEvent.setup()
    render(<SettingsForm subscriptionPlan="pro" />)

    const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i })
    const linkedinCheckbox = screen.getByRole('checkbox', { name: /linkedin/i })

    // Select platforms
    await user.click(twitterCheckbox)
    await user.click(linkedinCheckbox)

    expect(twitterCheckbox).toBeChecked()
    expect(linkedinCheckbox).toBeChecked()

    // Deselect a platform
    await user.click(twitterCheckbox)
    expect(twitterCheckbox).not.toBeChecked()
    expect(linkedinCheckbox).toBeChecked()
  })

  it('should submit form successfully', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'settings-1',
        brandVoice: 'Professional tone',
        preferredPlatforms: ['twitter', 'linkedin']
      })
    })

    render(<SettingsForm subscriptionPlan="pro" />)

    // Fill out the form
    const brandVoiceTextarea = screen.getByRole('textbox', { name: /brand voice/i })
    await user.type(brandVoiceTextarea, 'Professional tone')

    const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i })
    const linkedinCheckbox = screen.getByRole('checkbox', { name: /linkedin/i })
    await user.click(twitterCheckbox)
    await user.click(linkedinCheckbox)

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandVoice: 'Professional tone',
          preferredPlatforms: ['twitter', 'linkedin']
        })
      })
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100)
    }))

    render(<SettingsForm subscriptionPlan="pro" />)

    const submitButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(submitButton)

    expect(screen.getByText(/saving.../i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(/save settings/i)).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    }, { timeout: 200 })
  })

  it('should handle submission errors', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    })

    render(<SettingsForm subscriptionPlan="pro" />)

    const submitButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Error should be handled gracefully (via toast notification)
    expect(submitButton).not.toBeDisabled()
  })

  it('should submit with empty brand voice', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(<SettingsForm subscriptionPlan="pro" />)

    // Select a platform but leave brand voice empty
    const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i })
    await user.click(twitterCheckbox)

    const submitButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandVoice: '',
          preferredPlatforms: ['twitter']
        })
      })
    })
  })

  it('should submit with no platforms selected', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(<SettingsForm subscriptionPlan="pro" />)

    // Add brand voice but don't select any platforms
    const brandVoiceTextarea = screen.getByRole('textbox', { name: /brand voice/i })
    await user.type(brandVoiceTextarea, 'Friendly tone')

    const submitButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandVoice: 'Friendly tone',
          preferredPlatforms: []
        })
      })
    })
  })

  it('should display platform icons correctly', () => {
    render(<SettingsForm subscriptionPlan="agency" />)

    // Check that platform icons are rendered (they should be in the DOM)
    const twitterLabel = screen.getByText(/twitter/i).closest('label')
    const linkedinLabel = screen.getByText(/linkedin/i).closest('label')
    const instagramLabel = screen.getByText(/instagram/i).closest('label')

    expect(twitterLabel).toBeInTheDocument()
    expect(linkedinLabel).toBeInTheDocument()
    expect(instagramLabel).toBeInTheDocument()
  })

  it('should handle pre-selected platforms correctly', () => {
    const initialSettings = {
      brandVoice: 'Test voice',
      preferredPlatforms: ['twitter', 'linkedin', 'instagram']
    }

    render(<SettingsForm initialSettings={initialSettings} subscriptionPlan="agency" />)

    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /facebook/i })).not.toBeChecked()
  })
})