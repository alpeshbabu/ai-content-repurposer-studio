// Mock platform configurations for testing
const platformConfigs = {
  twitter: {
    name: 'Twitter',
    color: '#1DA1F2',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#1DA1F2',
    description: 'Micro-blogging and social networking'
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0077B5',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#0077B5',
    description: 'Professional networking platform'
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    brandColor: '#E4405F',
    description: 'Photo and video sharing'
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#1877F2',
    description: 'Social networking platform'
  },
  email: {
    name: 'Email',
    color: '#059669',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    brandColor: '#059669',
    description: 'Email marketing and communication'
  },
  newsletter: {
    name: 'Newsletter',
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    brandColor: '#7C3AED',
    description: 'Email newsletter content'
  },
  thread: {
    name: 'Thread',
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    brandColor: '#6B7280',
    description: 'Connected conversation threads'
  },
  general: {
    name: 'General',
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    brandColor: '#6B7280',
    description: 'Generic content format'
  }
}

function getPlatformConfig(platform: string) {
  const normalizedPlatform = platform.toLowerCase().trim()
  return platformConfigs[normalizedPlatform as keyof typeof platformConfigs] || platformConfigs.general
}

function getAllPlatforms() {
  return Object.keys(platformConfigs).filter(platform => platform !== 'general')
}

function formatPlatformName(platform: string) {
  return getPlatformConfig(platform).name
}

describe('Platform Icons Utilities', () => {
  it('should get platform config for known platforms', () => {
    const twitterConfig = getPlatformConfig('twitter')
    expect(twitterConfig.name).toBe('Twitter')
    expect(twitterConfig.color).toBe('#1DA1F2')
    expect(twitterConfig.bgColor).toBe('bg-blue-50')
    expect(twitterConfig.textColor).toBe('text-blue-700')

    const linkedinConfig = getPlatformConfig('linkedin')
    expect(linkedinConfig.name).toBe('LinkedIn')
    expect(linkedinConfig.color).toBe('#0077B5')

    const instagramConfig = getPlatformConfig('instagram')
    expect(instagramConfig.name).toBe('Instagram')
    expect(instagramConfig.color).toBe('#E4405F')
  })

  it('should return general config for unknown platforms', () => {
    const unknownConfig = getPlatformConfig('unknown-platform')
    expect(unknownConfig.name).toBe('General')
    expect(unknownConfig.color).toBe('#6B7280')
  })

  it('should handle case insensitive platform names', () => {
    const upperCaseConfig = getPlatformConfig('TWITTER')
    const lowerCaseConfig = getPlatformConfig('twitter')
    expect(upperCaseConfig.name).toBe(lowerCaseConfig.name)
    expect(upperCaseConfig.color).toBe(lowerCaseConfig.color)
  })

  it('should trim whitespace from platform names', () => {
    const configWithSpaces = getPlatformConfig('  twitter  ')
    const configNormal = getPlatformConfig('twitter')
    expect(configWithSpaces.name).toBe(configNormal.name)
  })

  it('should return all available platforms', () => {
    const platforms = getAllPlatforms()
    expect(platforms).toContain('twitter')
    expect(platforms).toContain('linkedin')
    expect(platforms).toContain('instagram')
    expect(platforms).toContain('facebook')
    expect(platforms).toContain('email')
    expect(platforms).toContain('newsletter')
    expect(platforms).toContain('thread')
    expect(platforms).not.toContain('general') // Should be excluded
  })

  it('should format platform names correctly', () => {
    expect(formatPlatformName('twitter')).toBe('Twitter')
    expect(formatPlatformName('linkedin')).toBe('LinkedIn')
    expect(formatPlatformName('unknown')).toBe('General')
  })

  it('should have consistent platform configurations', () => {
    const platforms = getAllPlatforms()
    
    platforms.forEach(platform => {
      const config = getPlatformConfig(platform)
      expect(config.name).toBeTruthy()
      expect(config.color).toMatch(/^#[0-9A-F]{6}$/i) // Valid hex color
      expect(config.bgColor).toMatch(/^bg-\w+-\d+$/) // Valid Tailwind background class
      expect(config.textColor).toMatch(/^text-\w+-\d+$/) // Valid Tailwind text class
      expect(config.brandColor).toMatch(/^#[0-9A-F]{6}$/i) // Valid hex color
      expect(config.description).toBeTruthy()
    })
  })
})