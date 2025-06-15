import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Search, BookOpen, MessageSquare, Video, Zap, Users, CreditCard, Settings, ChevronRight, ExternalLink, Mail, Clock } from 'lucide-react';
import HelpSearch from '@/components/help/help-search';

export const metadata: Metadata = {
  title: 'Help Center - AI Content Repurposer Studio',
  description: 'Find answers to your questions about AI Content Repurposer Studio. Get help with features, billing, troubleshooting, and more.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AI Content Studio</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/contact"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Contact Support
              </Link>
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to your questions about AI Content Repurposer Studio
          </p>
          <HelpSearch />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="#getting-started"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Getting Started</h3>
              <p className="text-gray-600 text-center text-sm">Learn the basics and start creating content</p>
            </Link>

            <Link
              href="#troubleshooting"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Troubleshooting</h3>
              <p className="text-gray-600 text-center text-sm">Fix common issues and problems</p>
            </Link>

            <Link
              href="#billing"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Billing & Plans</h3>
              <p className="text-gray-600 text-center text-sm">Manage your subscription and payments</p>
            </Link>

            <Link
              href="/contact"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Contact Support</h3>
              <p className="text-gray-600 text-center text-sm">Get personalized help from our team</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Getting Started */}
            <div id="getting-started">
              <div className="flex items-center mb-6">
                <BookOpen className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    How to create your first repurposed content
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Step-by-step guide to repurposing your first piece of content across multiple platforms.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Setting up your brand voice
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Configure your brand voice settings to ensure consistent tone across all platforms.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Understanding platform optimization
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Learn how our AI adapts content for Twitter, LinkedIn, Instagram, and other platforms.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Managing your usage limits
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Track your monthly usage and understand how overage billing works.</p>
                </div>

                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mt-4"
                >
                  Start creating content
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Features & Usage */}
            <div>
              <div className="flex items-center mb-6">
                <Zap className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Features & Usage</h2>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Supported content types
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Blog posts, articles, video transcripts, and social media posts are all supported.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Platform-specific optimization
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">How our AI adjusts content length, tone, and style for each social media platform.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Content analytics and insights
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">View your content performance and usage statistics in your dashboard.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Team collaboration (Agency plan)
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Invite team members and collaborate on content projects together.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    API access and integrations
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Connect with your existing tools and workflows using our API.</p>
                </div>
              </div>
            </div>

            {/* Account & Billing */}
            <div id="billing">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Account & Billing</h2>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Upgrading your plan
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">How to upgrade from Free to Basic, Pro, or Agency plans for more features.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Understanding overage charges
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">How overage billing works when you exceed your monthly limits.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Managing payment methods
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">Add, remove, or update your credit card and billing information.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    Canceling your subscription
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">How to cancel your subscription and what happens to your data.</p>
                </div>

                <Link
                  href="/dashboard/settings/subscription"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium mt-4"
                >
                  Manage subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section id="troubleshooting" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-12">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Troubleshooting</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content generation is taking too long</h3>
              <p className="text-gray-700 mb-4">
                If content generation is slow, this might be due to high server load or complex content processing.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="text-sm text-blue-800">
                  <strong>Solution:</strong> Try refreshing the page and attempting generation again. If the issue persists, 
                  consider breaking larger content into smaller sections for faster processing.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated content quality is poor</h3>
              <p className="text-gray-700 mb-4">
                The quality of generated content depends on your input content and brand voice settings.
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="text-sm text-green-800">
                  <strong>Solution:</strong> Ensure your original content is well-written and clear. Update your brand voice 
                  settings in the dashboard to better match your desired tone and style.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage limit exceeded unexpectedly</h3>
              <p className="text-gray-700 mb-4">
                Your monthly usage resets on the same day each month when your subscription renewed.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="text-sm text-yellow-800">
                  <strong>Solution:</strong> Check your usage statistics in the dashboard. You can enable overage billing 
                  in your settings to continue using the service beyond your monthly limit.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Team invitations not working</h3>
              <p className="text-gray-700 mb-4">
                Team features are only available on the Agency plan, and invitations may end up in spam folders.
              </p>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                <div className="text-sm text-purple-800">
                  <strong>Solution:</strong> Verify you have an Agency plan. Ask invitees to check their spam folder 
                  and add our domain to their email whitelist.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still need help?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Our support team is here to help you get the most out of AI Content Repurposer Studio
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 rounded-lg p-6">
              <Mail className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
              <p className="text-indigo-100 text-sm mb-4">Get detailed help via email</p>
              <a href="mailto:support@aicontentstudio.com" className="text-white hover:text-indigo-200 underline">
                support@aicontentstudio.com
              </a>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6">
              <MessageSquare className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Support Tickets</h3>
              <p className="text-indigo-100 text-sm mb-4">Track your support requests</p>
              <Link href="/contact" className="text-white hover:text-indigo-200 underline">
                Contact Support
              </Link>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6">
              <Clock className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
              <p className="text-indigo-100 text-sm mb-4">We typically respond within</p>
              <span className="text-white font-semibold">24 hours</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/auth/signin?callbackUrl=%2Fdashboard%2Fsupport"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-700 transition-colors"
            >
              Sign In for Support Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 