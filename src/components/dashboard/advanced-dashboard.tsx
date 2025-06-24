'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  Calendar,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  Download,
  Filter
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalContent: number
  generatedContent: number
  repurposedContent: number
  totalViews: number
  totalRepurposes: number
  thisMonthUsage: number
  monthlyLimit: number
  topPlatforms: Array<{ platform: string; count: number }>
  recentActivity: Array<{
    id: string
    type: 'content_created' | 'content_repurposed' | 'content_viewed'
    title: string
    timestamp: string
  }>
}

interface Widget {
  id: string
  title: string
  type: 'stat' | 'chart' | 'list' | 'progress'
  size: 'small' | 'medium' | 'large'
  enabled: boolean
  order: number
}

const defaultWidgets: Widget[] = [
  { id: 'content-overview', title: 'Content Overview', type: 'stat', size: 'medium', enabled: true, order: 1 },
  { id: 'usage-progress', title: 'Monthly Usage', type: 'progress', size: 'medium', enabled: true, order: 2 },
  { id: 'performance-stats', title: 'Performance', type: 'stat', size: 'medium', enabled: true, order: 3 },
  { id: 'top-platforms', title: 'Top Platforms', type: 'chart', size: 'medium', enabled: true, order: 4 },
  { id: 'recent-activity', title: 'Recent Activity', type: 'list', size: 'large', enabled: true, order: 5 },
  { id: 'quick-actions', title: 'Quick Actions', type: 'list', size: 'small', enabled: true, order: 6 }
]

export default function AdvancedDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [loading, setLoading] = useState(true)
  const [customizationMode, setCustomizationMode] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats()
      loadWidgetSettings()
    }
  }, [session])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        throw new Error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadWidgetSettings = () => {
    const saved = localStorage.getItem('dashboard-widgets')
    if (saved) {
      try {
        const savedWidgets = JSON.parse(saved)
        setWidgets(savedWidgets)
      } catch (error) {
        console.error('Error loading widget settings:', error)
      }
    }
  }

  const saveWidgetSettings = (newWidgets: Widget[]) => {
    setWidgets(newWidgets)
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets))
  }

  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    )
    saveWidgetSettings(newWidgets)
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = widgets.findIndex(w => w.id === widgetId)
    if (currentIndex === -1) return

    const newWidgets = [...widgets]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex >= 0 && targetIndex < widgets.length) {
      [newWidgets[currentIndex], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[currentIndex]]
      newWidgets.forEach((widget, index) => {
        widget.order = index + 1
      })
      saveWidgetSettings(newWidgets)
    }
  }

  const resetWidgets = () => {
    saveWidgetSettings(defaultWidgets)
    toast.success('Widget layout reset to default')
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/dashboard/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Dashboard data exported')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const renderWidget = (widget: Widget) => {
    if (!widget.enabled || !stats) return null

    const getCardSize = (size: string) => {
      switch (size) {
        case 'small': return 'col-span-1'
        case 'large': return 'col-span-2'
        default: return 'col-span-1'
      }
    }

    switch (widget.id) {
      case 'content-overview':
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalContent}</div>
                  <div className="text-sm text-gray-500">Total Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.generatedContent}</div>
                  <div className="text-sm text-gray-500">Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.repurposedContent}</div>
                  <div className="text-sm text-gray-500">Repurposed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'usage-progress':
        const usagePercentage = stats.monthlyLimit > 0 ? (stats.thisMonthUsage / stats.monthlyLimit) * 100 : 0
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage this month</span>
                  <span>{stats.thisMonthUsage} / {stats.monthlyLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-500">
                  {usagePercentage.toFixed(2)}% used
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'performance-stats':
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalViews}</div>
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" />
                    Total Views
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalRepurposes}</div>
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Share2 className="h-3 w-3" />
                    Repurposes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'top-platforms':
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topPlatforms.slice(0, 5).map((platform, index) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{platform.platform}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(platform.count / Math.max(...stats.topPlatforms.map(p => p.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{platform.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'recent-activity':
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      {activity.type === 'content_created' && <Plus className="h-4 w-4 text-green-500" />}
                      {activity.type === 'content_repurposed' && <Share2 className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'content_viewed' && <Eye className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'quick-actions':
        return (
          <Card key={widget.id} className={getCardSize(widget.size)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/new'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/content'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Library
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={exportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your content and performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizationMode(!customizationMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {customizationMode ? 'Done' : 'Customize'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardStats}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {customizationMode && (
        <Card>
          <CardHeader>
            <CardTitle>Customize Dashboard</CardTitle>
            <CardDescription>
              Enable/disable widgets and reorder them to your preference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {widgets.map((widget, index) => (
                <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={widget.enabled}
                      onChange={() => toggleWidget(widget.id)}
                      className="rounded"
                    />
                    <span className="font-medium">{widget.title}</span>
                    <Badge variant="outline">{widget.size}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={index === widgets.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={resetWidgets}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledWidgets.map(renderWidget)}
      </div>

      {enabledWidgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets enabled</h3>
            <p className="text-gray-500 mb-4">Enable some widgets to see your dashboard content</p>
            <Button onClick={() => setCustomizationMode(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Customize Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 