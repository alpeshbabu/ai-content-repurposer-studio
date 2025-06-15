'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X, User, Settings, HelpCircle, MessageSquare, BarChart3, Plus, Home, LogOut } from 'lucide-react'
import { DatabaseStatus } from '@/components/ui/database-status'

const Navigation = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  // Check if user has analytics access (basic, pro, or agency plans only - NOT free plan)
  const userSubscriptionPlan = (session?.user as any)?.subscriptionPlan
  const hasAnalyticsAccess = userSubscriptionPlan && 
    userSubscriptionPlan !== 'free' && 
    ['basic', 'pro', 'agency'].includes(userSubscriptionPlan)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, show: true },
    { href: '/dashboard/new', label: 'New Content', icon: Plus, show: true },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, show: hasAnalyticsAccess },
    { href: '/help', label: 'Help', icon: HelpCircle, show: !!session?.user },
    { href: '/dashboard/support', label: 'Support', icon: MessageSquare, show: !!session?.user },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, show: !!session?.user }
  ]

  return (
    <nav className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex-shrink-0 font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              AI Content Studio
            </Link>
            
            {/* Database Status - Desktop only */}
            <div className="hidden sm:block ml-4">
              <DatabaseStatus />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.filter(item => item.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* User Menu - Desktop */}
            {session?.user ? (
              <div className="flex items-center space-x-3">
                {session.user.image && (
                  <img 
                    src={session.user.image} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" 
                  />
                )}
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn()} 
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded="false"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {/* Database Status - Mobile */}
            <div className="px-3 py-2">
              <DatabaseStatus />
            </div>
            
            {/* Navigation Items - Mobile */}
            {navigationItems.filter(item => item.show).map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
            
            {/* User Section - Mobile */}
            {session?.user ? (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {session.user.image && (
                  <div className="flex items-center px-3 py-2">
                    <img 
                      src={session.user.image} 
                      alt="avatar" 
                      className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 mr-3" 
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => {
                    signOut({ callbackUrl: '/' })
                    closeMobileMenu()
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button 
                  onClick={() => {
                    signIn()
                    closeMobileMenu()
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <User className="h-5 w-5 mr-3 flex-shrink-0" />
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation 