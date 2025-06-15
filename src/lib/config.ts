import { logger, LogCategory } from './logger'

// Configuration interface for type safety
interface Config {
  // Environment
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  
  // Database
  databaseUrl: string
  
  // Authentication
  nextauthSecret: string
  nextauthUrl: string
  adminJwtSecret: string
  
  // External APIs
  anthropicApiKey?: string
  groqApiKey?: string
  
  // Stripe (optional)
  stripeSecretKey?: string
  stripePublishableKey?: string
  stripeWebhookSecret?: string
  stripePriceIds?: {
    basic?: string
    pro?: string
    agency?: string
  }
  
  // Email (optional)
  email?: {
    provider: string
    host?: string
    port?: number
    user?: string
    password?: string
    from?: string
  }
  
  // Security
  rateLimiting: {
    enabled: boolean
    windowMs: number
    maxRequests: number
  }
  
  // Features
  features: {
    analytics: boolean
    monitoring: boolean
    backup: boolean
    emailNotifications: boolean
  }
  
  // Logging
  logging: {
    level: string
    enableConsole: boolean
    enableFile: boolean
  }
}

// Default configuration
const defaultConfig: Partial<Config> = {
  nodeEnv: 'development',
  port: 3000,
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  features: {
    analytics: false,
    monitoring: true,
    backup: false,
    emailNotifications: false
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: false
  }
}

// Load and validate configuration
function loadConfig(): Config {
  const config: Config = {
    // Environment
    nodeEnv: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    
    // Database (required)
    databaseUrl: process.env.DATABASE_URL || '',
    
    // Authentication (required)
    nextauthSecret: process.env.NEXTAUTH_SECRET || '',
    nextauthUrl: process.env.NEXTAUTH_URL || '',
    adminJwtSecret: process.env.ADMIN_JWT_SECRET || '',
    
    // External APIs
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    
    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceIds: {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
      agency: process.env.STRIPE_AGENCY_PRICE_ID
    },
    
    // Email
    email: process.env.SMTP_HOST ? {
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.FROM_EMAIL
    } : undefined,
    
    // Security
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMITING_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMITING_MAX_REQUESTS || '100', 10)
    },
    
    // Features
    features: {
      analytics: process.env.ENABLE_ANALYTICS === 'true',
      monitoring: process.env.ENABLE_MONITORING !== 'false',
      backup: process.env.ENABLE_BACKUP === 'true',
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      enableConsole: process.env.LOG_CONSOLE !== 'false',
      enableFile: process.env.LOG_FILE === 'true'
    }
  }

  return config
}

// Validation errors
interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

// Validate configuration
export function validateConfig(config: Config): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  // Required fields validation
  if (!config.databaseUrl) {
    errors.push({
      field: 'DATABASE_URL',
      message: 'Database URL is required',
      severity: 'error'
    })
  }

  if (!config.nextauthSecret) {
    errors.push({
      field: 'NEXTAUTH_SECRET',
      message: 'NextAuth secret is required',
      severity: 'error'
    })
  }

  if (!config.nextauthUrl) {
    errors.push({
      field: 'NEXTAUTH_URL',
      message: 'NextAuth URL is required',
      severity: 'error'
    })
  }

  if (!config.adminJwtSecret) {
    errors.push({
      field: 'ADMIN_JWT_SECRET',
      message: 'Admin JWT secret is required',
      severity: 'error'
    })
  }

  // Production-specific validations
  if (config.nodeEnv === 'production') {
    // Check for secure secrets
    if (config.nextauthSecret === 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d') {
      errors.push({
        field: 'NEXTAUTH_SECRET',
        message: 'Using development secret in production',
        severity: 'error'
      })
    }

    if (config.adminJwtSecret === 'admin-secret-key-change-in-production') {
      errors.push({
        field: 'ADMIN_JWT_SECRET',
        message: 'Using development admin secret in production',
        severity: 'error'
      })
    }

    // Check for localhost URLs
    if (config.databaseUrl.includes('localhost')) {
      errors.push({
        field: 'DATABASE_URL',
        message: 'Using localhost database in production',
        severity: 'error'
      })
    }

    if (config.nextauthUrl.includes('localhost')) {
      errors.push({
        field: 'NEXTAUTH_URL',
        message: 'Using localhost URL in production',
        severity: 'error'
      })
    }

    // Check HTTPS
    if (!config.nextauthUrl.startsWith('https://')) {
      errors.push({
        field: 'NEXTAUTH_URL',
        message: 'HTTPS is required in production',
        severity: 'error'
      })
    }
  }

  // Optional but recommended validations
  if (!config.anthropicApiKey && !config.groqApiKey) {
    errors.push({
      field: 'AI_PROVIDERS',
      message: 'No AI providers configured (Anthropic or Groq) - AI features will be disabled',
      severity: 'warning'
    })
  }

  if (!config.anthropicApiKey) {
    errors.push({
      field: 'ANTHROPIC_API_KEY',
      message: 'Anthropic API key not configured',
      severity: 'warning'
    })
  }

  if (!config.groqApiKey) {
    errors.push({
      field: 'GROQ_API_KEY',
      message: 'Groq API key not configured',
      severity: 'warning'
    })
  }

  // Stripe validation (if any Stripe config is present)
  const hasStripeConfig = config.stripeSecretKey || config.stripePublishableKey || config.stripeWebhookSecret
  if (hasStripeConfig) {
    if (!config.stripeSecretKey) {
      errors.push({
        field: 'STRIPE_SECRET_KEY',
        message: 'Stripe secret key is required when Stripe is configured',
        severity: 'error'
      })
    }

    if (!config.stripePublishableKey) {
      errors.push({
        field: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        message: 'Stripe publishable key is required when Stripe is configured',
        severity: 'error'
      })
    }

    if (!config.stripeWebhookSecret) {
      errors.push({
        field: 'STRIPE_WEBHOOK_SECRET',
        message: 'Stripe webhook secret is required for payment verification',
        severity: 'warning'
      })
    }

    // Check for price IDs
    if (!config.stripePriceIds?.basic && !config.stripePriceIds?.pro && !config.stripePriceIds?.agency) {
      errors.push({
        field: 'STRIPE_PRICE_IDs',
        message: 'No Stripe price IDs configured - subscription features will be disabled',
        severity: 'warning'
      })
    }
  }

  // Email validation (if configured)
  if (config.email) {
    if (!config.email.host) {
      errors.push({
        field: 'SMTP_HOST',
        message: 'SMTP host is required when email is configured',
        severity: 'error'
      })
    }

    if (!config.email.from) {
      errors.push({
        field: 'FROM_EMAIL',
        message: 'From email is required when email is configured',
        severity: 'warning'
      })
    }
  }

  // Port validation
  if (config.port < 1 || config.port > 65535) {
    errors.push({
      field: 'PORT',
      message: 'Port must be between 1 and 65535',
      severity: 'error'
    })
  }

  const isValid = errors.filter(e => e.severity === 'error').length === 0

  return { isValid, errors }
}

// Load and validate environment variables
let config: Config
let configValidation: { isValid: boolean; errors: ValidationError[] }

try {
  config = loadConfig()
  configValidation = validateConfig(config)

  // Log configuration status
  if (configValidation.isValid) {
    logger.info('Configuration loaded successfully', {
      environment: config.nodeEnv,
      featuresEnabled: Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature),
      servicesConfigured: [
        config.anthropicApiKey ? 'anthropic' : null,
        config.groqApiKey ? 'groq' : null,
        config.stripeSecretKey ? 'stripe' : null,
        config.email ? 'email' : null
      ].filter(Boolean)
    }, LogCategory.SYSTEM)
  } else {
    const errorMessages = configValidation.errors
      .filter(e => e.severity === 'error')
      .map(e => `${e.field}: ${e.message}`)
    
    logger.error('Configuration validation failed', undefined, {
      errors: errorMessages,
      environment: config.nodeEnv
    }, LogCategory.SYSTEM)
  }

  // Log warnings
  const warnings = configValidation.errors.filter(e => e.severity === 'warning')
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logger.warn(`Configuration warning: ${warning.field}: ${warning.message}`, {
        field: warning.field,
        environment: config.nodeEnv
      }, LogCategory.SYSTEM)
    })
  }

} catch (error) {
  logger.critical('Failed to load configuration', error as Error, {
    environment: process.env.NODE_ENV || 'unknown'
  })
  
  // Create minimal fallback config
  config = {
    ...defaultConfig,
    nodeEnv: 'development',
    port: 3000,
    databaseUrl: '',
    nextauthSecret: '',
    nextauthUrl: '',
    adminJwtSecret: ''
  } as Config

  configValidation = { isValid: false, errors: [{ field: 'CONFIG_LOAD', message: 'Failed to load configuration', severity: 'error' }] }
}

// Export validated configuration
export { config }

// Validation functions for specific use cases
export function validateEnvVars(): void {
  if (!configValidation.isValid) {
    const errorMessages = configValidation.errors
      .filter(e => e.severity === 'error')
      .map(e => e.message)
      .join(', ')
    
    throw new Error(
      `Configuration validation failed: ${errorMessages}. ` +
      'Please check your environment variables.'
    )
  }
}

export function getConfigValidation(): { isValid: boolean; errors: ValidationError[] } {
  return configValidation
}

export function isFeatureEnabled(feature: keyof Config['features']): boolean {
  return config.features[feature] || false
}

export function getServiceConfig<T extends keyof Config>(service: T): Config[T] {
  return config[service]
}

// Configuration helpers
export const isDevelopment = config.nodeEnv === 'development'
export const isProduction = config.nodeEnv === 'production'
export const isTest = config.nodeEnv === 'test'

// Security helpers
export function getSecureHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }

  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}

// Export specific configurations for easier access
export const ANTHROPIC_API_KEY = config.anthropicApiKey
export const GROQ_API_KEY = config.groqApiKey
export const DATABASE_URL = config.databaseUrl
export const NEXTAUTH_SECRET = config.nextauthSecret
export const NEXTAUTH_URL = config.nextauthUrl

// Anthropic model configurations
export const ANTHROPIC_MODELS = {
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_5_HAIKU: 'claude-3-5-haiku-20241022',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  DEFAULT: 'claude-3-5-sonnet-20241022'
} as const;

// Groq model configurations
export const GROQ_MODELS = {
  LLAMA_3_1_70B_VERSATILE: 'llama-3.1-70b-versatile',
  LLAMA_3_1_8B_INSTANT: 'llama-3.1-8b-instant',
  MIXTRAL_8X7B_32768: 'mixtral-8x7b-32768',
  GEMMA_7B_IT: 'gemma-7b-it',
  DEFAULT: 'llama-3.1-70b-versatile'
} as const; 