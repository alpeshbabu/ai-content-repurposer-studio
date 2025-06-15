import React from 'react'
import { 
  MessageCircle, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Mail, 
  FileText, 
  MessageSquare,
  Twitter,
  Hash,
  Send,
  Globe,
  Users,
  LucideIcon
} from 'lucide-react'

// Platform icon mapping with brand colors and Lucide React icons
export interface PlatformConfig {
  icon: LucideIcon
  color: string
  bgColor: string
  textColor: string
  brandColor: string
  name: string
  description: string
}

export const platformConfigs: Record<string, PlatformConfig> = {
  twitter: {
    icon: Twitter,
    color: '#1DA1F2',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#1DA1F2',
    name: 'Twitter',
    description: 'Micro-blogging and social networking'
  },
  linkedin: {
    icon: Linkedin,
    color: '#0077B5',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#0077B5',
    name: 'LinkedIn',
    description: 'Professional networking platform'
  },
  instagram: {
    icon: Instagram,
    color: '#E4405F',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    brandColor: '#E4405F',
    name: 'Instagram',
    description: 'Photo and video sharing'
  },
  facebook: {
    icon: Facebook,
    color: '#1877F2',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    brandColor: '#1877F2',
    name: 'Facebook',
    description: 'Social networking platform'
  },
  email: {
    icon: Mail,
    color: '#059669',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    brandColor: '#059669',
    name: 'Email',
    description: 'Email marketing and communication'
  },
  newsletter: {
    icon: FileText,
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    brandColor: '#7C3AED',
    name: 'Newsletter',
    description: 'Email newsletter content'
  },
  thread: {
    icon: MessageSquare,
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    brandColor: '#6B7280',
    name: 'Thread',
    description: 'Connected conversation threads'
  },
  general: {
    icon: Globe,
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    brandColor: '#6B7280',
    name: 'General',
    description: 'Generic content format'
  }
}

// Get platform configuration
export function getPlatformConfig(platform: string): PlatformConfig {
  const normalizedPlatform = platform.toLowerCase().trim()
  return platformConfigs[normalizedPlatform] || platformConfigs.general
}

// Platform icon component
interface PlatformIconProps {
  platform: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'outline' | 'minimal' | 'badge'
  showName?: boolean
  className?: string
}

const sizeClasses = {
  sm: {
    icon: 'h-3 w-3',
    container: 'p-1',
    text: 'text-xs'
  },
  md: {
    icon: 'h-4 w-4',
    container: 'p-1.5',
    text: 'text-sm'
  },
  lg: {
    icon: 'h-5 w-5',
    container: 'p-2',
    text: 'text-base'
  },
  xl: {
    icon: 'h-6 w-6',
    container: 'p-2.5',
    text: 'text-lg'
  }
}

export function PlatformIcon({ 
  platform, 
  size = 'md', 
  variant = 'default',
  showName = false,
  className = '' 
}: PlatformIconProps) {
  const config = getPlatformConfig(platform)
  const Icon = config.icon
  const sizes = sizeClasses[size]

  const baseClasses = `inline-flex items-center justify-center rounded-md font-medium transition-colors ${className}`

  const variantClasses = {
    default: `${config.bgColor} ${config.textColor}`,
    outline: `border-2 border-current ${config.textColor} bg-transparent`,
    minimal: `${config.textColor} bg-transparent`,
    badge: `${config.bgColor} ${config.textColor} px-2 py-1 rounded-full`
  }

  if (showName) {
    return (
      <div className={`${baseClasses} ${variantClasses[variant]} gap-2 ${sizes.container}`}>
        <Icon className={sizes.icon} />
        <span className={sizes.text}>{config.name}</span>
      </div>
    )
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizes.container}`}>
      <Icon className={sizes.icon} />
    </div>
  )
}

// Platform badge component with icon and name
interface PlatformBadgeProps {
  platform: string
  size?: 'sm' | 'md' | 'lg'
  count?: number
  className?: string
  onClick?: () => void
}

export function PlatformBadge({ 
  platform, 
  size = 'md', 
  count, 
  className = '',
  onClick 
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform)
  const Icon = config.icon
  const sizes = sizeClasses[size]

  const handleClick = onClick ? { onClick, role: 'button', tabIndex: 0 } : {}

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      {...handleClick}
    >
      <Icon className={sizes.icon} />
      <span className="capitalize">{config.name}</span>
      {count !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-white bg-opacity-60 rounded-full">
          {count}
        </span>
      )}
    </span>
  )
}

// Platform grid component for selection
interface PlatformGridProps {
  platforms: string[]
  selectedPlatforms?: string[]
  onPlatformToggle?: (platform: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlatformGrid({ 
  platforms, 
  selectedPlatforms = [], 
  onPlatformToggle,
  size = 'md',
  className = '' 
}: PlatformGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {platforms.map((platform) => {
        const config = getPlatformConfig(platform)
        const Icon = config.icon
        const isSelected = selectedPlatforms.includes(platform)
        const sizes = sizeClasses[size]

        return (
          <button
            key={platform}
            onClick={() => onPlatformToggle?.(platform)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
              isSelected
                ? `${config.bgColor} ${config.textColor} border-current`
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Icon className={`${sizes.icon} mb-2`} />
            <span className={`${sizes.text} font-medium capitalize`}>
              {config.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Platform list component with icons
interface PlatformListProps {
  platforms: { platform: string; count?: number }[]
  onPlatformClick?: (platform: string) => void
  className?: string
}

export function PlatformList({ platforms, onPlatformClick, className = '' }: PlatformListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {platforms.map(({ platform, count }) => {
        const config = getPlatformConfig(platform)
        const Icon = config.icon

        return (
          <div
            key={platform}
            className={`flex items-center justify-between p-3 bg-white rounded-lg border hover:border-gray-300 transition-colors ${
              onPlatformClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onPlatformClick?.(platform)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.textColor}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 capitalize">{config.name}</h3>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>
            </div>
            {count !== undefined && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {count}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Utility functions
export function getPlatformIcon(platform: string): LucideIcon {
  return getPlatformConfig(platform).icon
}

export function getPlatformColor(platform: string): string {
  return getPlatformConfig(platform).brandColor
}

export function getPlatformBgColor(platform: string): string {
  return getPlatformConfig(platform).bgColor
}

export function getPlatformTextColor(platform: string): string {
  return getPlatformConfig(platform).textColor
}

export function getAllPlatforms(): string[] {
  return Object.keys(platformConfigs).filter(platform => platform !== 'general')
}

export function formatPlatformName(platform: string): string {
  return getPlatformConfig(platform).name
}