// Responsive design utilities and breakpoint helpers

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

// Media query utilities
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
} as const

// Hook for responsive values
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [matches, query])

  return matches
}

// Hook for current breakpoint
export function useBreakpoint(): Breakpoint {
  const isXL = useMediaQuery(mediaQueries.xl)
  const isLG = useMediaQuery(mediaQueries.lg)
  const isMD = useMediaQuery(mediaQueries.md)
  const isSM = useMediaQuery(mediaQueries.sm)

  if (isXL) return 'xl'
  if (isLG) return 'lg'
  if (isMD) return 'md'
  if (isSM) return 'sm'
  return 'sm'
}

// Responsive grid utilities
export const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
} as const

export const responsiveGridCols = {
  'sm:1': 'sm:grid-cols-1',
  'sm:2': 'sm:grid-cols-2',
  'sm:3': 'sm:grid-cols-3',
  'md:1': 'md:grid-cols-1',
  'md:2': 'md:grid-cols-2',
  'md:3': 'md:grid-cols-3',
  'md:4': 'md:grid-cols-4',
  'lg:1': 'lg:grid-cols-1',
  'lg:2': 'lg:grid-cols-2',
  'lg:3': 'lg:grid-cols-3',
  'lg:4': 'lg:grid-cols-4',
  'lg:5': 'lg:grid-cols-5',
  'lg:6': 'lg:grid-cols-6',
  'xl:1': 'xl:grid-cols-1',
  'xl:2': 'xl:grid-cols-2',
  'xl:3': 'xl:grid-cols-3',
  'xl:4': 'xl:grid-cols-4',
  'xl:5': 'xl:grid-cols-5',
  'xl:6': 'xl:grid-cols-6',
} as const

// Container utilities
export const containers = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
} as const

// Spacing utilities
export const spacing = {
  none: '0',
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem',
  '3xl': '6rem',
} as const

// Typography scale
export const fontSize = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
} as const

// Responsive typography
export const responsiveFontSize = {
  'sm:xs': 'sm:text-xs',
  'sm:sm': 'sm:text-sm',
  'sm:base': 'sm:text-base',
  'sm:lg': 'sm:text-lg',
  'md:xs': 'md:text-xs',
  'md:sm': 'md:text-sm',
  'md:base': 'md:text-base',
  'md:lg': 'md:text-lg',
  'md:xl': 'md:text-xl',
  'md:2xl': 'md:text-2xl',
  'lg:sm': 'lg:text-sm',
  'lg:base': 'lg:text-base',
  'lg:lg': 'lg:text-lg',
  'lg:xl': 'lg:text-xl',
  'lg:2xl': 'lg:text-2xl',
  'lg:3xl': 'lg:text-3xl',
  'xl:lg': 'xl:text-lg',
  'xl:xl': 'xl:text-xl',
  'xl:2xl': 'xl:text-2xl',
  'xl:3xl': 'xl:text-3xl',
  'xl:4xl': 'xl:text-4xl',
} as const

// Mobile-first responsive classes builder
export function responsive<T extends string>(
  base: T,
  variants?: Partial<Record<Breakpoint, T>>
): string {
  const classes = [base]
  
  if (variants) {
    Object.entries(variants).forEach(([breakpoint, value]) => {
      if (value) {
        classes.push(`${breakpoint}:${value}`)
      }
    })
  }
  
  return classes.join(' ')
}

// Common responsive patterns
export const responsivePatterns = {
  // Card grids
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  cardGridWide: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6',
  
  // Content containers
  contentContainer: 'container mx-auto px-4 sm:px-6 lg:px-8',
  narrowContainer: 'max-w-3xl mx-auto px-4 sm:px-6',
  wideContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Navigation
  navContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  mobileNav: 'block md:hidden',
  desktopNav: 'hidden md:block',
  
  // Typography
  heading: 'text-2xl md:text-3xl lg:text-4xl font-bold',
  subheading: 'text-lg md:text-xl lg:text-2xl font-semibold',
  body: 'text-sm md:text-base',
  
  // Spacing
  sectionPadding: 'py-8 md:py-12 lg:py-16',
  cardPadding: 'p-4 md:p-6',
  
  // Layout
  sidebar: 'w-full md:w-64 lg:w-72',
  main: 'flex-1 md:ml-64 lg:ml-72',
  flexStack: 'flex flex-col md:flex-row',
  flexCenter: 'flex items-center justify-center',
} as const

// Mobile optimization utilities
export const mobileOptimizations = {
  // Touch targets (minimum 44px for accessibility)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Focus styles for keyboard navigation
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  
  // Safe area support for modern mobile devices
  safeAreaInsetTop: 'pt-safe-top',
  safeAreaInsetBottom: 'pb-safe-bottom',
  
  // Performance optimizations
  willChange: 'will-change-transform',
  backfaceHidden: 'backface-visibility-hidden',
  
  // Prevent zoom on input focus (iOS)
  preventZoom: 'text-base', // 16px+ prevents iOS zoom
  
  // Smooth scrolling
  smoothScroll: 'scroll-smooth',
  
  // Reduce motion for accessibility
  reduceMotion: 'motion-reduce:animate-none motion-reduce:transition-none',
} as const

// Common mobile-first responsive component patterns
export const mobileComponentPatterns = {
  // Modal/Dialog
  modal: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4',
  modalContent: 'w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white rounded-t-xl sm:rounded-xl',
  
  // Cards
  card: 'bg-white rounded-lg shadow-sm border p-4 sm:p-6',
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  
  // Forms
  formGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  input: 'w-full px-3 py-2 sm:px-4 sm:py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
  
  // Buttons
  button: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium rounded-md transition-colors',
  buttonGroup: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
  
  // Navigation
  mobileMenu: 'fixed inset-x-0 top-16 z-40 bg-white border-t shadow-lg md:hidden',
  
  // Tables (responsive)
  tableContainer: 'overflow-x-auto -mx-4 sm:mx-0',
  table: 'min-w-full divide-y divide-gray-200',
  
  // Lists
  list: 'space-y-3 sm:space-y-4',
  listItem: 'p-3 sm:p-4 bg-white rounded-lg border',
  
  // Stats/Metrics
  statsGrid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6',
  statCard: 'bg-white p-4 sm:p-6 rounded-lg border text-center',
} as const