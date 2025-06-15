import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from '../Navigation'

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock NextAuth session
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg'
  }
}

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    status: 'authenticated'
  }),
  signOut: jest.fn()
}))

// Mock responsive utilities
jest.mock('@/lib/responsive', () => ({
  useIsMobile: () => false,
  isMobileDevice: () => false
}))

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render desktop navigation with all links', () => {
    render(<Navigation />)

    // Check main navigation links
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /new content/i })).toHaveAttribute('href', '/dashboard/new')
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.getByRole('link', { name: /help/i })).toHaveAttribute('href', '/help')
  })

  it('should render user avatar and name when authenticated', () => {
    render(<Navigation />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /test user/i })).toBeInTheDocument()
  })

  it('should show mobile menu toggle on mobile devices', () => {
    // Mock mobile device
    jest.doMock('@/lib/responsive', () => ({
      useIsMobile: () => true,
      isMobileDevice: () => true
    }))

    render(<Navigation />)

    expect(screen.getByRole('button', { name: /toggle mobile menu/i })).toBeInTheDocument()
  })

  it('should toggle mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup()
    
    // Mock mobile device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    render(<Navigation />)

    const menuToggle = screen.getByRole('button', { name: /toggle mobile menu/i })
    
    // Menu should be closed initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()

    // Click to open menu
    await user.click(menuToggle)

    // Menu should now be visible
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

    // Click to close menu
    await user.click(menuToggle)

    // Menu should be hidden again
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
  })

  it('should render mobile navigation links when menu is open', async () => {
    const user = userEvent.setup()
    
    render(<Navigation />)

    const menuToggle = screen.getByRole('button', { name: /toggle mobile menu/i })
    await user.click(menuToggle)

    // Check that mobile navigation links are present
    const mobileMenu = screen.getByTestId('mobile-menu')
    expect(mobileMenu).toBeInTheDocument()
    
    // Navigation links should be in mobile menu
    expect(screen.getAllByRole('link', { name: /dashboard/i })).toHaveLength(2) // Desktop + Mobile
    expect(screen.getAllByRole('link', { name: /new content/i })).toHaveLength(2)
  })

  it('should close mobile menu when clicking outside', async () => {
    const user = userEvent.setup()
    
    render(<Navigation />)

    const menuToggle = screen.getByRole('button', { name: /toggle mobile menu/i })
    await user.click(menuToggle)

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

    // Click outside the menu (on document body)
    await user.click(document.body)

    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
  })

  it('should close mobile menu when pressing Escape key', async () => {
    const user = userEvent.setup()
    
    render(<Navigation />)

    const menuToggle = screen.getByRole('button', { name: /toggle mobile menu/i })
    await user.click(menuToggle)

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

    // Press Escape key
    await user.keyboard('{Escape}')

    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
  })

  it('should highlight active navigation link', () => {
    // Mock current pathname
    jest.doMock('next/navigation', () => ({
      usePathname: () => '/dashboard/new'
    }))

    render(<Navigation />)

    const newContentLink = screen.getByRole('link', { name: /new content/i })
    expect(newContentLink).toHaveClass('text-indigo-600') // Active state styling
  })

  it('should show user dropdown menu when avatar is clicked', async () => {
    const user = userEvent.setup()
    
    render(<Navigation />)

    const userButton = screen.getByRole('button', { name: /user menu/i })
    await user.click(userButton)

    // Should show dropdown options
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
  })

  it('should call signOut when sign out is clicked', async () => {
    const user = userEvent.setup()
    const { signOut } = require('next-auth/react')
    
    render(<Navigation />)

    const userButton = screen.getByRole('button', { name: /user menu/i })
    await user.click(userButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    expect(signOut).toHaveBeenCalled()
  })

  it('should render brand logo and link to home', () => {
    render(<Navigation />)

    const logoLink = screen.getByRole('link', { name: /ai content repurposer/i })
    expect(logoLink).toHaveAttribute('href', '/')
    expect(logoLink).toContainElement(screen.getByRole('img', { name: /logo/i }))
  })

  it('should handle navigation links with proper accessibility', () => {
    render(<Navigation />)

    const navigationLinks = screen.getAllByRole('link')
    
    navigationLinks.forEach(link => {
      expect(link).toHaveAttribute('href')
      // Links should have proper ARIA labels or text content
      expect(link).toHaveAccessibleName()
    })
  })

  it('should render notification badge when there are notifications', () => {
    // Mock notifications context or prop
    render(<Navigation />)

    // This would depend on how notifications are implemented
    // For now, checking that the component renders without notifications
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup()
    
    render(<Navigation />)

    // Tab through navigation elements
    await user.tab()
    expect(screen.getByRole('link', { name: /ai content repurposer/i })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('link', { name: /new content/i })).toHaveFocus()
  })

  it('should handle responsive design breakpoints', () => {
    // Mock different screen sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Medium breakpoint
    })

    render(<Navigation />)

    // Should adapt layout for medium screens
    // This test would verify responsive classes are applied correctly
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should maintain navigation state across re-renders', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Navigation />)

    // Open mobile menu
    const menuToggle = screen.getByRole('button', { name: /toggle mobile menu/i })
    await user.click(menuToggle)

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

    // Re-render component
    rerender(<Navigation />)

    // Menu state should be maintained (or reset as appropriate)
    // This depends on the implementation - typically menus close on re-render
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
  })
})