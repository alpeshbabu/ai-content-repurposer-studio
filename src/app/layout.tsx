import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'
import './globals.css'
import type { Metadata } from 'next'
import { Outfit, Raleway } from 'next/font/google'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import { validateEnvVars } from '@/lib/config'

// Validate environment variables
try {
  validateEnvVars();
} catch (error) {
  console.error('Environment variable validation failed:', error);
  // In production, you might want to display a more user-friendly error
}

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit'
})

const raleway = Raleway({ 
  subsets: ['latin'],
  variable: '--font-raleway'
})

export const metadata: Metadata = {
  title: 'AI Content Repurposer Studio',
  description: 'Transform your content into multiple formats using AI',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#3B82F6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Content Studio'
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${raleway.variable}`}>
      <body className={raleway.className} suppressHydrationWarning>
        <NextAuthProvider>
          {children}
          <Toaster 
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #22c55e',
                },
              },
              error: {
                duration: 6000,
                style: {
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #ef4444',
                },
              },
            }}
          />
          <SonnerToaster 
            position="top-right"
            expand={true}
            richColors={true}
            closeButton={true}
            toastOptions={{
              style: {
                borderRadius: '8px',
              },
            }}
          />
        </NextAuthProvider>
      </body>
    </html>
  )
}
