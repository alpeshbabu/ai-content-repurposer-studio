'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Info, Sparkles, Copy, CheckCircle, FileText, Settings, Zap, Wand2, PenTool } from 'lucide-react';
import Link from 'next/link';
import { PlatformIcon, getPlatformConfig } from '@/lib/platform-icons';
import { notifications, notificationTemplates } from '@/lib/toast';

type ContentType = 'blog' | 'video_transcript' | 'article' | 'social_post' | 'email' | 'general';
type WorkflowMode = 'generate' | 'repurpose';

interface RepurposedItem {
  platform: string;
  content: string;
}

interface UsageData {
  current: number;
  limit: number | 'Unlimited';
  remaining: number | 'Unlimited';
  daily?: {
    current: number;
    limit: number | 'Unlimited';
    remaining: number | 'Unlimited';
  };
}

interface SubscriptionData {
  plan: string;
  status: string;
  renewalDate: string | null;
}

export default function ContentRepurposingForm() {
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('generate');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'instagram']);
  const [loading, setLoading] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [results, setResults] = useState<RepurposedItem[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [databaseSetupComplete, setDatabaseSetupComplete] = useState(false);
  const [showRepurposePrompt, setShowRepurposePrompt] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedContentId, setGeneratedContentId] = useState<string>('');
  const [overageEnabled, setOverageEnabled] = useState(false);
  const [overageRate, setOverageRate] = useState(0.12);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Check system health and database readiness
  useEffect(() => {
    async function checkSystemHealth(retryCount = 0) {
      try {
        const response = await fetch('/api/system/health');
        if (response.ok) {
          const data = await response.json();
          console.log('System health check result:', data);
          setDatabaseSetupComplete(data.status === 'healthy' || data.status === 'degraded');
          
          if (data.status === 'unhealthy') {
            console.log('System is unhealthy:', data);
            // If system is unhealthy and we haven't retried too many times, try again
            if (retryCount < 3) {
              setTimeout(() => checkSystemHealth(retryCount + 1), 2000);
            }
          }
        } else {
          console.error('System health check failed:', await response.text());
          setDatabaseSetupComplete(false);
        }
      } catch (error) {
        console.error('Error checking system health:', error);
        setDatabaseSetupComplete(false);
      }
    }
    
    checkSystemHealth();
  }, []);

  // Fetch user settings for preferred platforms
  useEffect(() => {
    if (!databaseSetupComplete) return;
    
    async function fetchUserSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings?.preferredPlatforms && settings.preferredPlatforms.length > 0) {
            setSelectedPlatforms(settings.preferredPlatforms);
          } else {
            // Default platforms for free tier only - STRICT COMPLIANCE
            setSelectedPlatforms(['twitter', 'instagram']);
          }
          
          // Set overage enabled status
          setOverageEnabled(settings?.overageEnabled || false);
        } else {
          // Default platforms for free tier only - STRICT COMPLIANCE  
          setSelectedPlatforms(['twitter', 'instagram']);
          setOverageEnabled(false);
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        // Default platforms for free tier only - STRICT COMPLIANCE
        setSelectedPlatforms(['twitter', 'instagram']);
        setOverageEnabled(false);
      }
    }
    
    fetchUserSettings();
  }, [databaseSetupComplete]);

  // Fetch usage data once database setup is complete
  useEffect(() => {
    if (!databaseSetupComplete) return;
    
    async function fetchUsageData() {
      try {
        setLoadingUsage(true);
        const response = await fetch('/api/subscription');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Subscription API error:', errorText);
          throw new Error(`Failed to fetch usage data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();

        // Validate response data
        if (!data.usage || !data.subscription) {
          console.error('Invalid subscription data format:', data);
          throw new Error('Invalid response format from subscription API');
        }
        
        setUsageData(data.usage);
        setSubscriptionData(data.subscription);

        // Set overage rate based on plan
        const overageRates = {
          'free': 0.12,
          'basic': 0.10,
          'pro': 0.08,
          'agency': 0.06
        };
        setOverageRate(overageRates[data.subscription.plan as keyof typeof overageRates] || 0.12);

        // Check if usage limit is reached
        const isMonthlyLimitReached = 
          data.usage.remaining !== 'Unlimited' && 
          typeof data.usage.remaining === 'number' && 
          data.usage.remaining <= 0;
          
        const isDailyLimitReached = 
          data.usage.daily && 
          data.usage.daily.remaining !== 'Unlimited' && 
          typeof data.usage.daily.remaining === 'number' && 
          data.usage.daily.remaining <= 0;
        
        setUsageLimitReached(isMonthlyLimitReached || isDailyLimitReached);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        notifications.error('Could not check usage limits. Please try again later.');
      } finally {
        setLoadingUsage(false);
      }
    }

    fetchUsageData();
  }, [databaseSetupComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on workflow mode
    if (workflowMode === 'generate') {
      if (!title.trim() || !keywords.trim()) {
        notifications.error('Please provide a title and keywords for content generation');
        return;
      }
    } else {
      if (!title.trim() || !content.trim()) {
        notifications.error('Please fill in all required fields');
        return;
      }
    }

    // Check if system is ready
    if (!databaseSetupComplete) {
      try {
        notifications.loading('Initializing system...');
        
        try {
          // Try simple health check first with timeout
          const healthResponse = await fetch('/api/health/simple', {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          const healthData = await healthResponse.json();
          
          notifications.dismiss();
          
          if (healthResponse.ok && healthData.status === 'healthy') {
            setDatabaseSetupComplete(true);
          } else {
            console.warn('Health check returned unhealthy status, proceeding with caution');
            notifications.warning('System may be initializing. If you encounter issues, please wait a moment and try again.');
            setDatabaseSetupComplete(true);
          }
        } catch (error) {
          console.warn('Health check failed, proceeding anyway:', error);
          notifications.dismiss();
          // Don't block the user - the actual API calls will handle errors appropriately
          setDatabaseSetupComplete(true);
        }
      } catch (error) {
        console.error('Error checking system status:', error);
        notifications.dismiss();
        // Don't block the user - proceed with caution
        setDatabaseSetupComplete(true);
      }
    }

    setLoading(true);
    setResults([]);
    setShowRepurposePrompt(false);

    try {
      const apiEndpoint = workflowMode === 'generate' ? '/api/content/generate' : '/api/repurpose';
      const requestBody = workflowMode === 'generate' 
        ? {
            title,
            keywords,
            tone,
            targetAudience,
            contentType,
          }
        : {
            title,
            content,
            contentType,
            platforms: selectedPlatforms,
            tone,
            targetAudience,
            ...(generatedContentId && { contentId: generatedContentId }), // Pass contentId to update existing content
          };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle database initialization error
      if (response.status === 503 && response.headers.get('X-Error-Type') === 'database-not-ready') {
        notifications.error('The system is still initializing. Please try again in a few moments.');
        setLoading(false);
        return;
      }

      // Handle subscription limit errors
      if (response.status === 402) {
        if (response.headers.get('X-Allow-Overage')) {
          setUsageLimitReached(true);
          notifications.error('Usage limit exceeded. Enable overage charges or upgrade your plan.');
        } else {
          notifications.error('Usage limit exceeded. Please upgrade your plan.');
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to ${workflowMode === 'generate' ? 'generate' : 'repurpose'} content`);
      }

      const data = await response.json();
      
      // Display warning if content was generated but not saved
      if (data.warning) {
        notifications.error(data.warning, { 
          duration: 8000,
          icon: '⚠️'
        });
      }
      
      // Handle different response structures for generate vs repurpose
      if (data.success) {
        if (workflowMode === 'generate' && data.data?.content) {
          // For generate workflow, set the generated content and switch to repurpose mode
          const generatedText = data.data.content;
          const contentId = data.data.contentId;
          setGeneratedContent(generatedText);
          setGeneratedContentId(contentId);
          setContent(generatedText);
          setWorkflowMode('repurpose');
          setShowRepurposePrompt(true);
          
          notifications.success('Content generated successfully! Now you can repurpose it for different platforms.', {
            duration: 5000,
            icon: '✨'
          });
        } else if (workflowMode === 'repurpose' && data.content?.repurposed) {
          // For repurpose workflow, directly set the results
          setResults(data.content.repurposed);
          setShowRepurposePrompt(false);
          notifications.success('Content successfully repurposed!');
        } else {
          throw new Error('Invalid response format: Missing expected content structure');
        }
        
        // Refresh usage data
        try {
          const usageResponse = await fetch('/api/subscription');
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsageData(usageData.usage);
            
            // Update usage limit status
            const isMonthlyLimitReached = usageData.usage.remaining !== 'Unlimited' && usageData.usage.remaining <= 0;
            const isDailyLimitReached = usageData.usage.daily && 
                                       usageData.usage.daily.remaining !== 'Unlimited' && 
                                       usageData.usage.daily.remaining <= 0;
            
            setUsageLimitReached(isMonthlyLimitReached || isDailyLimitReached);
          }
        } catch (error) {
          console.error('Error refreshing usage data:', error);
          // Don't show an error toast here - not critical
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error ${workflowMode === 'generate' ? 'generating' : 'repurposing'} content:`, error);
      const errorMessage = workflowMode === 'generate' 
        ? 'Failed to generate content. Please try again later.'
        : 'Failed to repurpose content. Please try again later.';
      notifications.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      notifications.success('Content copied to clipboard!', {
        duration: 2000,
        icon: '📋'
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      notifications.error('Failed to copy content', {
        description: 'Please try again or copy manually'
      });
      console.error('Failed to copy content:', error);
    }
  };

  const handleWorkflowModeChange = () => {
    const newMode = workflowMode === 'generate' ? 'repurpose' : 'generate';
    setWorkflowMode(newMode);
    
    // Clear results and prompts when switching modes
    setResults([]);
    setShowRepurposePrompt(false);
    
    // If switching to generate mode, clear the content field
    if (newMode === 'generate') {
      setContent('');
      setGeneratedContent('');
      setGeneratedContentId('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Usage Status Card */}
      {!loadingUsage && usageData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Usage Status</h3>
                <p className="text-sm text-gray-600">
                  {typeof usageData.remaining === 'number' 
                    ? `${usageData.remaining} repurposes remaining this month`
                    : 'Unlimited repurposes'
                  }
                  {usageData.daily && typeof usageData.daily.remaining === 'number' && (
                    <span className="ml-2">
                      ({usageData.daily.remaining} remaining today)
                    </span>
                  )}
                </p>
              </div>
            </div>
            {subscriptionData && (
              <Link 
                href="/dashboard/settings/subscription"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Manage Plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Usage Warning */}
      {usageLimitReached && !loadingUsage && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Usage Limit Reached</h3>
              <p className="text-amber-800 mb-4">
                You've reached your usage limit for this {usageData?.daily?.remaining === 0 ? "day" : "month"}.
              </p>
              
              {overageEnabled ? (
                <div className="bg-white/60 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        Overage charges enabled
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Additional content will be charged at ${overageRate.toFixed(2)} per repurpose or generation from keywords. 
                        You can continue creating content beyond your plan limits.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/60 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Overage charges disabled
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Enable overage charges in your subscription settings to continue creating content beyond your plan limits.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Link 
                href="/dashboard/settings/subscription" 
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Mode Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Workflow Mode</h3>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium transition-colors ${
              workflowMode === 'generate' ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              Generate from Keywords
            </span>
            <button
              type="button"
              onClick={handleWorkflowModeChange}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                workflowMode === 'repurpose' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${
              workflowMode === 'repurpose' ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              Repurpose Content
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {workflowMode === 'generate' 
            ? 'Create new content from keywords, then choose to repurpose it for multiple platforms'
            : 'Take existing content and adapt it for different social media platforms'
          }
        </p>
      </div>

      {/* Generated Content Prompt */}
      {showRepurposePrompt && generatedContent && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">Content Generated Successfully!</h3>
              <p className="text-green-800 mb-4">
                Your content has been generated and is ready for repurposing. Review the content below and click "Repurpose Content" when you're ready to adapt it for different platforms.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRepurposePrompt(false)}
                  className="text-sm font-medium text-green-700 hover:text-green-900 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
              Content Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
              placeholder="Enter a descriptive title..."
              disabled={loading}
              required
            />
          </div>

          {/* Content Type Field */}
          <div className="space-y-2">
            <label htmlFor="content-type" className="block text-sm font-semibold text-gray-900">
              Content Type
            </label>
            <div className="relative">
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                disabled={loading}
              >
                <option value="blog">📝 Blog Post</option>
                <option value="video_transcript">🎥 Video Transcript</option>
                <option value="article">📰 Article</option>
                <option value="social_post">📱 Social Media Post</option>
                <option value="email">📧 Email</option>
                <option value="general">📄 General</option>
              </select>
              <Settings className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {workflowMode === 'generate' ? (
          /* Keywords Mode Fields */
          <>
            {/* Keywords Field */}
            <div className="space-y-2">
              <label htmlFor="keywords" className="block text-sm font-semibold text-gray-900">
                Keywords & Topics
              </label>
              <div className="relative">
                <textarea
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[120px] placeholder:text-gray-400 resize-none"
                  placeholder="Enter keywords, topics, or themes for your content. For example: 'AI technology, productivity tips, remote work, digital transformation'..."
                  disabled={loading}
                  required
                />
                <Wand2 className="absolute top-4 right-4 h-5 w-5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <Info className="h-3 w-3" />
                <span>Separate multiple keywords with commas for better results</span>
              </p>
            </div>

            {/* Tone and Audience Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="tone" className="block text-sm font-semibold text-gray-900">
                  Tone & Style
                </label>
                <div className="relative">
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                    disabled={loading}
                  >
                    <option value="professional">🏢 Professional</option>
                    <option value="casual">😊 Casual & Friendly</option>
                    <option value="expert">🎓 Expert & Authoritative</option>
                    <option value="engaging">✨ Engaging & Fun</option>
                    <option value="formal">📋 Formal</option>
                  </select>
                  <PenTool className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="target-audience" className="block text-sm font-semibold text-gray-900">
                  Target Audience <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="target-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                  placeholder="e.g., small business owners, tech professionals..."
                  disabled={loading}
                />
              </div>
            </div>
          </>
        ) : (
          /* Repurpose Mode Fields */
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900">
              Your Content
            </label>
            <div className="relative">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[200px] placeholder:text-gray-400 resize-none"
                placeholder="Paste or type your content here. Our AI will analyze and adapt it for different platforms while maintaining your brand voice..."
                disabled={loading}
                required
              />
              <FileText className="absolute top-4 right-4 h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <Info className="h-3 w-3" />
              <span>Longer content provides better results for platform adaptation</span>
            </p>
          </div>
        )}

        {/* Platform Notice */}
        {selectedPlatforms.length > 0 && workflowMode === 'repurpose' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Repurposing for your preferred platforms:</span>{' '}
                  <span className="font-medium">{selectedPlatforms.map(p => p === 'thread' ? 'Twitter Thread' : p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  💡 <strong>How it works:</strong> If you have preferred platforms selected in settings, content will be repurposed only for those platforms. 
                  If no preferences are set, all platforms available for your subscription tier will be used.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  To change your preferred platforms, visit your{' '}
                  <Link href="/dashboard/settings" className="font-medium underline hover:text-blue-800">
                    settings page
                  </Link>
                  {' '}or leave preferences empty to use all available platforms.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading || (usageLimitReached && !overageEnabled)}
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            <div className="flex items-center space-x-3">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{workflowMode === 'generate' ? 'Generating Content...' : 'Repurposing Content...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                  <span>{workflowMode === 'generate' ? 'Generate Content' : 'Repurpose Content'}</span>
                </>
              )}
            </div>
            
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
      </form>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Content Successfully Repurposed</span>
            </div>
          </div>
          
          <div className="grid gap-6">
            {results.map((item, index) => (
              <div key={index} className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg overflow-hidden">
                {/* Platform Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <PlatformIcon 
                      platform={item.platform} 
                      size="lg" 
                      variant="default"
                    />
                    <h3 className="font-semibold text-gray-900">
                      {getPlatformConfig(item.platform).name}
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => handleCopy(item.content, index)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200"
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Content Body */}
                <div className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {item.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Success Actions */}
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => {
                setTitle('');
                setContent('');
                setKeywords('');
                setTargetAudience('');
                setResults([]);
                setGeneratedContent('');
                setGeneratedContentId('');
                setShowRepurposePrompt(false);
                setWorkflowMode('generate');
              }}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Create New Content
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 