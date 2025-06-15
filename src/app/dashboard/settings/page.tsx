import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SettingsForm from '@/components/SettingsForm'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  // Fetch user's subscription plan and settings from the database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
    }
  })

  // Fetch settings from the database
  const settings = await prisma.settings.findUnique({
    where: { userId },
  })

  // Convert to the expected type
  const formattedSettings = settings ? {
    brandVoice: settings.brandVoice,
    preferredPlatforms: settings.preferredPlatforms
  } : undefined;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Brand Voice & Preferences</h2>
      <p className="text-gray-500 mb-6">
        Configure your brand voice and content preferences to customize the AI-generated content.
      </p>
      <SettingsForm 
        initialSettings={formattedSettings} 
        subscriptionPlan={user?.subscriptionPlan || 'free'} 
      />
    </div>
  )
} 