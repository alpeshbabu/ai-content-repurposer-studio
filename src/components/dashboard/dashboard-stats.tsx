'use client';

import { FileText, Share2, Layers, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  contentCount: number;
  platformCount: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

function StatCard({ title, value, description, icon, bgColor, textColor }: StatCardProps) {
  return (
    <div className="bg-white border rounded-lg p-5 flex items-start">
      <div className={`${bgColor} p-3 rounded-lg mr-4`}>
        <div className={textColor}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function DashboardStats({ contentCount, platformCount }: DashboardStatsProps) {
  // Calculate average platforms per content
  const avgPlatforms = contentCount > 0 
    ? Math.round((platformCount / contentCount) * 10) / 10
    : 0;

  const stats = [
    {
      title: "Total Content",
      value: contentCount,
      description: "Pieces of content created",
      icon: <FileText className="h-6 w-6" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Platforms Used",
      value: platformCount,
      description: "Different platforms targeted",
      icon: <Share2 className="h-6 w-6" />,
      textColor: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Avg. Platforms",
      value: avgPlatforms,
      description: "Platforms per content",
      icon: <Layers className="h-6 w-6" />,
      textColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Efficiency",
      value: `${contentCount > 0 ? Math.min(100, contentCount * 10) : 0}%`,
      description: "Content utilization",
      icon: <TrendingUp className="h-6 w-6" />,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
} 