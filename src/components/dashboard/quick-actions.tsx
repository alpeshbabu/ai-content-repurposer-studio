'use client';

import Link from 'next/link';
import { 
  PlusCircle, 
  Settings, 
  CreditCard, 
  Users, 
  LifeBuoy, 
  BookOpen,
  ArrowUpRight,
  Sparkles,
  Crown
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  featured?: boolean;
}

function QuickAction({ 
  title, 
  description, 
  icon, 
  href, 
  color, 
  bgColor, 
  borderColor, 
  hoverColor,
  featured = false
}: QuickActionProps) {
  return (
    <Link 
      href={href}
      className={`group relative border rounded-xl p-5 ${bgColor} ${borderColor} ${hoverColor} transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${featured ? 'ring-2 ring-indigo-100' : ''}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`${color} p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
              {title}
            </h3>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {featured && (
            <div className="flex items-center mt-2">
              <Sparkles className="h-3 w-3 text-indigo-500 mr-1" />
              <span className="text-xs text-indigo-600 font-medium">Popular</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function QuickActions() {
  const { data: session } = useSession();
  
  // Check if user has agency plan for subscriber team features
  const userSubscriptionPlan = (session?.user as any)?.subscriptionPlan;
  const hasTeamAccess = userSubscriptionPlan === 'agency';

  const baseActions = [
    {
      title: "Create New Content",
      description: "Transform your content for multiple platforms",
      icon: <PlusCircle className="h-5 w-5" />,
      href: "/dashboard/new",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      hoverColor: "hover:bg-indigo-100",
      featured: true
    },
    {
      title: "Subscription Settings",
      description: "Manage your plan and billing details",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/dashboard/settings/subscription",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      hoverColor: "hover:bg-purple-100"
    },
    {
      title: "Get Support",
      description: "Contact support or view documentation",
      icon: <LifeBuoy className="h-5 w-5" />,
      href: "/dashboard/support",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      hoverColor: "hover:bg-emerald-100"
    }
  ];

  // Only add subscriber team settings for agency users
  const teamAction = {
    title: "Team Management",
    description: "Manage your team members and collaboration",
    icon: <Users className="h-5 w-5" />,
    href: "/dashboard/settings/team",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    hoverColor: "hover:bg-blue-100"
  };

  const actions = hasTeamAccess 
    ? [...baseActions.slice(0, 2), teamAction, baseActions[2]]
    : baseActions;

  return (
    <div className="space-y-6">
      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <QuickAction key={index} {...action} />
        ))}
      </div>
      
      {/* Upgrade Banner for non-agency users */}
      {!hasTeamAccess && (
        <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-10"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-20 w-20 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-10"></div>
          
          <div className="relative">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Crown className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">Unlock Team Collaboration</h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Agency Plan
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Collaborate with up to 3 team members, share projects, and manage permissions with our Agency plan.
                </p>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard/settings/subscription"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors group"
                  >
                    Upgrade Now
                    <ArrowUpRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/help"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 