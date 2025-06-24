import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock modules that may not exist during testing
jest.mock('src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    content: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    settings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}))

// Mock cache service
jest.mock('src/lib/cache', () => ({
  CacheService: {
    getUserSettings: jest.fn(),
    setUserSettings: jest.fn(),
    invalidateUserSettings: jest.fn(),
    getContentList: jest.fn(),
    setContentList: jest.fn(),
    invalidateContentList: jest.fn(),
    getSubscription: jest.fn(),
    setSubscription: jest.fn(),
    invalidateSubscription: jest.fn(),
    getUsageData: jest.fn(),
    setUsageData: jest.fn(),
    invalidateUsageData: jest.fn(),
  },
  checkCacheHealth: jest.fn(),
}))

// Mock other lib modules
jest.mock('src/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('src/lib/db-setup', () => ({
  tableExists: jest.fn(),
  validateUserTable: jest.fn(),
  ensureDailyUsageTableExists: jest.fn(),
}))

jest.mock('src/lib/subscription', () => ({
  updateSubscription: jest.fn(),
  SUBSCRIPTION_LIMITS: {
    free: 5,
    basic: 25,
    pro: 60,
    agency: 450,
  },
}))

jest.mock('src/lib/ai-service', () => ({
  repurposeContent: jest.fn(),
}))

jest.mock('src/lib/toast', () => ({
  notifications: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  notificationTemplates: {
    contentRepurposed: jest.fn(),
    repurposeError: jest.fn(),
    settingsSaved: jest.fn(),
    settingsError: jest.fn(),
  },
}))

jest.mock('src/lib/platform-icons', () => ({
  PlatformIcon: ({ platform }) => `<PlatformIcon platform="${platform}" />`,
  PlatformBadge: ({ platform }) => `<PlatformBadge platform="${platform}" />`,
  getPlatformConfig: (platform) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  }),
  getAllPlatforms: () => ['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread'],
  formatPlatformName: (platform) => platform.charAt(0).toUpperCase() + platform.slice(1),
}))

jest.mock('src/lib/responsive', () => ({
  useIsMobile: () => false,
  isMobileDevice: () => false,
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Suppress console.log in tests unless explicitly needed
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  jest.clearAllMocks()
})