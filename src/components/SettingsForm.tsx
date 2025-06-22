'use client'

import { useState } from 'react'
import { PlatformIcon, getAllPlatforms, formatPlatformName } from '@/lib/platform-icons'
import { notificationTemplates } from '@/lib/toast'

interface SettingsFormProps {
  initialSettings?: {
    brandVoice?: string | null
    preferredPlatforms?: string[]
  }
  subscriptionPlan?: string
}

const allPlatforms = [
  'twitter',
  'linkedin',
  'instagram',
  'facebook',
  'email',
  'newsletter',
  'thread',
]

// Define platform availability by subscription tier - MUST match SUBSCRIPTION.md
const getPlatformsByTier = (plan: string) => {
  switch (plan) {
    case 'free':
      return ['twitter', 'instagram']
    case 'basic':
      return ['twitter', 'instagram', 'facebook']
    case 'pro':
      return ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter']
    case 'agency':
      return ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter']
    default:
      return ['twitter', 'instagram'] // Default to free tier
  }
}

export default function SettingsForm({ initialSettings, subscriptionPlan = 'free' }: SettingsFormProps) {
  const [brandVoice, setBrandVoice] = useState(initialSettings?.brandVoice || '')
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>(initialSettings?.preferredPlatforms || [])
  const [isLoading, setIsLoading] = useState(false)

  const availablePlatforms = getPlatformsByTier(subscriptionPlan)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandVoice, preferredPlatforms }),
      })
      
      if (!res.ok) {
        let errorMessage = 'Failed to save settings'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = `${res.status}: ${res.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      notificationTemplates.settingsSaved()
    } catch (err) {
      console.error('Settings save error:', err)
      // Show more specific error message if available
      if (err instanceof Error) {
        notificationTemplates.settingsError()
      } else {
        notificationTemplates.settingsError()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlatformChange = (platform: string) => {
    setPreferredPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Brand Voice</label>
        <textarea
          className="w-full min-h-[100px] rounded border px-3 py-2 text-sm"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          placeholder="Describe your brand voice, e.g. friendly, professional, witty..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Preferred Platforms</label>
        <p className="text-xs text-gray-600 mb-3">
          💡 <strong>How this works:</strong> Select your preferred platforms for content repurposing. 
          If no platforms are selected, content will be repurposed for all platforms available in your subscription tier.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availablePlatforms.map((platform) => (
            <label key={platform} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={preferredPlatforms.includes(platform)}
                onChange={() => handlePlatformChange(platform)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <PlatformIcon platform={platform} size="sm" variant="minimal" />
              <span className="text-sm font-medium">{formatPlatformName(platform)}</span>
            </label>
          ))}
        </div>
        
        {/* Platform selection guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Platform Selection Guide:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Select specific platforms</strong> to focus your content repurposing</li>
              <li>• <strong>Leave empty</strong> to use all available platforms for your tier</li>
              <li>• You can always change these preferences later</li>
            </ul>
          </div>
        </div>
        
        {subscriptionPlan === 'free' && (
          <p className="text-xs text-gray-500 mt-2">
            Free plan includes Twitter and Instagram. <a href="/dashboard/settings/subscription" className="text-indigo-600 hover:text-indigo-700">Upgrade</a> to access more platforms.
          </p>
        )}
        {subscriptionPlan === 'basic' && (
          <p className="text-xs text-gray-500 mt-2">
            Basic plan includes Twitter, Instagram, and Facebook. <a href="/dashboard/settings/subscription" className="text-indigo-600 hover:text-indigo-700">Upgrade to Pro</a> to access LinkedIn and more.
          </p>
        )}
        {subscriptionPlan === 'pro' && (
          <p className="text-xs text-gray-500 mt-2">
            Pro plan includes all major platforms. <a href="/dashboard/settings/subscription" className="text-indigo-600 hover:text-indigo-700">Upgrade to Agency</a> to access custom templates and team features.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
} 