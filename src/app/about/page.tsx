import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Zap, Users, Target, Award, Brain, Heart, Lightbulb, Globe, Shield, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - AI Content Repurposer Studio',
  description: 'Learn about AI Content Repurposer Studio - our mission to revolutionize content creation with AI technology.',
};

export default function AboutPage() {
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
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-6">
              Revolutionizing Content Creation
              <span className="block text-indigo-600">with AI Intelligence</span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-8">
              We're on a mission to empower creators, marketers, and businesses to maximize their content's potential 
              through the power of artificial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Join Our Mission
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/support"
                className="inline-flex items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  AI Content Repurposer Studio was born from a simple observation: content creators were spending 
                  countless hours manually adapting their content for different platforms, often losing the essence 
                  and impact of their original message.
                </p>
                <p>
                  We recognized that in today's multi-platform digital landscape, one size doesn't fit all. 
                  What works on LinkedIn might not resonate on Twitter, and Instagram requires a completely 
                  different approach than Facebook.
                </p>
                <p>
                  By harnessing the power of advanced AI technology, we've created a solution that understands 
                  the nuances of each platform while preserving the authentic voice and message of the original content.
                </p>
                <p>
                  Today, we're proud to serve thousands of creators, marketers, and businesses who trust us 
                  to amplify their message across the digital world.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Target className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Our Mission</h3>
                    <p className="text-indigo-100">Democratize content creation through AI</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Brain className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Our Vision</h3>
                    <p className="text-indigo-100">A world where great content reaches every platform</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Heart className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Our Purpose</h3>
                    <p className="text-indigo-100">Empower creators to focus on what they do best</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do and every decision we make.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Lightbulb className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation First</h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible with AI technology, 
                always seeking better ways to serve our users.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User-Centric</h3>
              <p className="text-gray-600">
                Every feature we build starts with understanding our users' needs and challenges. 
                Your success is our success.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Security</h3>
              <p className="text-gray-600">
                We protect your content and data with industry-leading security measures. 
                Your trust is our most valuable asset.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Efficiency</h3>
              <p className="text-gray-600">
                We believe technology should save time, not waste it. Our tools are designed 
                for maximum impact with minimal effort.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Award className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality</h3>
              <p className="text-gray-600">
                We maintain the highest standards in AI-generated content, ensuring every output 
                meets professional quality expectations.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Globe className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Accessibility</h3>
              <p className="text-gray-600">
                Powerful content creation should be accessible to everyone, from solo creators 
                to large enterprises, regardless of technical expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Innovation */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Powered by Advanced AI</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-white/20 rounded p-1 mt-1">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Anthropic Claude Integration</h4>
                      <p className="text-blue-100 text-sm">Advanced language models for superior content understanding</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-white/20 rounded p-1 mt-1">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Real-time Processing</h4>
                      <p className="text-blue-100 text-sm">Lightning-fast content transformation and optimization</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-white/20 rounded p-1 mt-1">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Platform-Specific Optimization</h4>
                      <p className="text-blue-100 text-sm">Tailored content for each social media platform's unique requirements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technology That Powers Creativity</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our platform leverages cutting-edge artificial intelligence to understand context, 
                  tone, and platform-specific requirements, ensuring your content resonates with 
                  audiences across different channels.
                </p>
                <p>
                  We've integrated with leading AI providers like Anthropic to bring you the most 
                  advanced language models available, capable of maintaining your unique voice while 
                  adapting to different platform conventions.
                </p>
                <p>
                  From analyzing character limits to understanding engagement patterns, our AI doesn't 
                  just translate content—it transforms it for maximum impact on each platform.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="#pricing"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Explore Our Features
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Making an Impact</h2>
            <p className="text-indigo-200 text-lg">
              Join thousands of creators who trust us with their content
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-indigo-200">Content Pieces Repurposed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">5,000+</div>
              <div className="text-indigo-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">7</div>
              <div className="text-indigo-200">Supported Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-indigo-200">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Transform Your Content?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of creators who are already maximizing their content's potential with AI Content Studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Start Your Free Trial
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center px-8 py-4 border border-indigo-600 text-lg font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 