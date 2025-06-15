import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ContentRepurposingForm from '@/components/ContentRepurposingForm';
import { Sparkles, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Content - AI Content Repurposer',
  description: 'Create new content for repurposing',
};

export default async function NewContentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Create New Content
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your content across multiple platforms with AI-powered repurposing. 
            Maintain your brand voice while maximizing your reach.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Content Repurposing Studio</h2>
            </div>
            <p className="text-indigo-100 mt-2 text-sm">
              Enter your original content below and watch as our AI adapts it for different platforms
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <ContentRepurposingForm />
          </div>
        </div>

        {/* Helper Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Platform Optimization</h3>
            <p className="text-sm text-gray-600">
              Automatically adapts content length, tone, and format for each social media platform
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Advanced AI ensures your brand voice and messaging consistency across all platforms
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Time Saving</h3>
            <p className="text-sm text-gray-600">
              Generate content for multiple platforms in seconds, not hours of manual work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 