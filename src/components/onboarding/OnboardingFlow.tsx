'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Share2, 
  Settings,
  Users,
  Target,
  Rocket,
  X
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export default function OnboardingFlow() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding && session?.user) {
      setIsVisible(true)
    }
  }, [session])

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AI Content Repurposer Studio!',
      description: 'Transform your content into multiple formats with the power of AI',
      icon: <Sparkles className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Hi {session?.user?.name || 'there'}! 👋 We're excited to help you supercharge your content creation workflow.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">AI-powered repurposing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Multiple platforms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Brand voice consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Analytics & insights</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'create-content',
      title: 'Create Your First Content',
      description: 'Start by generating content from keywords or uploading existing content',
      icon: <FileText className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            You can create content in two ways:
          </p>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Generate from Keywords
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Enter keywords and let AI create original content for you
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Existing Content
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Paste or upload your existing content to repurpose it
              </p>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Create Content',
        href: '/dashboard/new'
      }
    },
    {
      id: 'repurpose-content',
      title: 'Repurpose for Multiple Platforms',
      description: 'Transform your content for different social media platforms',
      icon: <Share2 className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Once you have content, you can repurpose it for various platforms:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['Twitter', 'LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube'].map((platform) => (
              <Badge key={platform} variant="outline" className="justify-center py-2">
                {platform}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Each platform gets optimized content that fits its unique style and audience.
          </p>
        </div>
      )
    },
    {
      id: 'brand-voice',
      title: 'Set Your Brand Voice',
      description: 'Maintain consistency across all your content',
      icon: <Settings className="h-8 w-8 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Define your brand voice to ensure all AI-generated content matches your style:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Tone of voice (professional, casual, friendly)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Key messaging points</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Writing style preferences</span>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Set Brand Voice',
        href: '/dashboard/settings'
      }
    },
    {
      id: 'team-collaboration',
      title: 'Invite Your Team',
      description: 'Collaborate with team members on content creation',
      icon: <Users className="h-8 w-8 text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            If you're on a team plan, you can invite colleagues to collaborate:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Share content libraries</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Assign roles and permissions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Track team usage and analytics</span>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Manage Team',
        href: '/dashboard/settings/team'
      }
    },
    {
      id: 'ready',
      title: 'You are All Set!',
      description: 'Start creating amazing content with AI',
      icon: <Rocket className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Congratulations! You're ready to start using AI Content Repurposer Studio.
          </p>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Start with 2-3 keywords for best results</li>
              <li>• Use the advanced content library to organize your work</li>
              <li>• Check your usage limits in the dashboard</li>
              <li>• Explore templates to speed up your workflow</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: 'Start Creating',
        href: '/dashboard'
      }
    }
  ]

  // Get current step with bounds checking
  const getCurrentStep = (): OnboardingStep | null => {
    return steps[currentStep] || null
  }

  const handleNext = () => {
    const currentStepData = getCurrentStep()
    if (currentStep < steps.length - 1 && currentStepData) {
      setCurrentStep(currentStep + 1)
      setCompletedSteps([...completedSteps, currentStepData.id])
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsVisible(false)
    toast.success('You can always access the onboarding guide from settings!')
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsVisible(false)
    toast.success('Welcome to AI Content Repurposer Studio!')
    
    const currentStepData = getCurrentStep()
    if (currentStepData?.action?.href) {
      router.push(currentStepData.action.href)
    }
  }

  const handleActionClick = () => {
    const currentStepData = getCurrentStep()
    const action = currentStepData?.action
    if (action?.onClick) {
      action.onClick()
    } else if (action?.href) {
      router.push(action.href)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (!isVisible) return null

  const currentStepData = getCurrentStep()
  
  // Safety check: if no current step data, don't render
  if (!currentStepData) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            {currentStepData.content}
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStepData.action && (
                <Button variant="outline" onClick={handleActionClick}>
                  {currentStepData.action.label}
                </Button>
              )}
              
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 