'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

import LandingHeader from '@/components/LandingHeader'
import { getAllPlans, getLimitDisplay, PlanType } from '@/lib/pricing-config'

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <LandingHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex flex-col justify-center min-h-screen py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              AI Content Repurposer Studio
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform your content into multiple formats using AI. Create engaging posts for different platforms with ease.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/auth/signin"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/auth/signup"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16" id="features">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">AI-Powered</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Leverage advanced AI to automatically repurpose your content for different platforms and audiences.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Multi-Platform</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Create content optimized for Twitter, LinkedIn, Instagram, Facebook, and more platforms.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Time-Saving</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Save hours of manual work by automating your content repurposing workflow.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mt-16" id="demo">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                See It In Action
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Try our AI content repurposer with this example before signing up
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Blog Post</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">The Future of Remote Work</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Remote work has fundamentally changed how we approach productivity and collaboration. 
                      Companies are discovering that flexible work arrangements not only improve employee 
                      satisfaction but also lead to better business outcomes. With the right tools and 
                      processes, teams can be more efficient than ever before, regardless of location.
                    </p>
                  </div>
                </div>

                {/* Repurposed Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Social Posts</h3>
                  <div className="space-y-4">
                    {/* Twitter */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">T</div>
                        <span className="ml-2 text-sm font-medium text-blue-800">Twitter</span>
                      </div>
                      <p className="text-sm text-gray-800">
                        🚀 Remote work isn't just a trend—it's the future! Companies embracing flexible arrangements see:
                        ✅ Higher employee satisfaction
                        ✅ Better business outcomes  
                        ✅ Increased productivity
                        
                        The key? Right tools + smart processes 💪 #RemoteWork #Productivity
                      </p>
                    </div>

                    {/* LinkedIn */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">Li</div>
                        <span className="ml-2 text-sm font-medium text-blue-800">LinkedIn</span>
                      </div>
                      <p className="text-sm text-gray-800">
                        The data is clear: remote work delivers results when done right.

                        Key insights from successful remote-first companies:
                        • Flexible arrangements boost employee satisfaction
                        • Proper tools enable better collaboration than traditional offices
                        • Location independence drives efficiency

                        What's your experience with remote work? Share your thoughts below! 👇
                      </p>
                    </div>

                    {/* Instagram */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">Ig</div>
                        <span className="ml-2 text-sm font-medium text-purple-800">Instagram</span>
                      </div>
                      <p className="text-sm text-gray-800">
                        Working from anywhere 🌍✨
                        
                        Remote work = Better productivity + Happier teams
                        
                        The secret sauce? Having the right digital tools and clear processes 📱💻
                        
                        #RemoteWork #DigitalNomad #WorkFromAnywhere #Productivity #TeamWork
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Try It Yourself - Sign Up Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-24" id="pricing">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Choose the plan that works best for your content creation needs
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {getAllPlans().map((plan) => {
                // Define which plan is most popular
                const isPopular = plan.id === 'pro';
                
                // Get limit display for monthly only
                const limits = getLimitDisplay(plan.id as PlanType);
                
                // Plan descriptions
                const descriptions = {
                  free: 'Perfect for trying out our platform',
                  basic: 'Great for regular content creators',
                  pro: 'Best for content creators',
                  agency: 'For teams and agencies'
                };
                
                return (
                  <div 
                    key={plan.id}
                    className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                      isPopular ? 'border-indigo-600 relative' : 'border-gray-200'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-gray-600">{descriptions[plan.id as keyof typeof descriptions]}</p>
                    
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    
                    <ul className="mt-6 space-y-3 text-sm">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {limits.monthly}
                      </li>
                      
                      {plan.teamMembers > 1 && (
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Up to {plan.teamMembers} team members included
                        </li>
                      )}
                      
                      {plan.id === 'agency' && plan.additionalMemberPrice > 0 && (
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Add additional member for just ${plan.additionalMemberPrice}/month
                        </li>
                      )}
                      
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ${plan.overagePrice.toFixed(2)} per overage content
                      </li>
                    </ul>
                    
                    <Link
                      href="/auth/signup"
                      className={`mt-8 w-full block text-center px-4 py-2 rounded-md transition-colors ${
                        isPopular
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {plan.name === 'Free' ? 'Get Started Free' : 'Get Started'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-gray-200 py-12" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">AI Content Studio</span>
                </div>
                <p className="mt-2 text-gray-600">
                  Transform your content with the power of AI
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Product
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link></li>
                  <li><Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
                  <li><Link href="/auth/signup" className="text-gray-600 hover:text-gray-900">Get Started</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Support
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/help" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Company
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link></li>
                  <li><Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">Sign In</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Legal
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600">
                © 2024 AI Content Repurposer Studio. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
