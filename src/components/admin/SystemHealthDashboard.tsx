'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface HealthDiagnostic {
  component: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  message: string
  details?: string
  actionable_steps?: string[]
  technical_details?: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
  impact: string
  resolution_time?: string
  last_checked: string
}

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  diagnostics: {
    overall_message: string
    priority_issues: HealthDiagnostic[]
    all_components: HealthDiagnostic[]
    summary: {
      healthy_count: number
      degraded_count: number
      unhealthy_count: number
      total_checks: number
    }
    recommendations: string[]
    estimated_fix_time?: string
  }
  timestamp: string
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/system/health')
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const toggleComponentExpansion = (component: string) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(component)) {
      newExpanded.delete(component)
    } else {
      newExpanded.add(component)
    }
    setExpandedComponents(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'degraded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'unhealthy':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getSeverityBadge = (severity: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded text-xs font-medium"
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'error':
        return `${baseClasses} bg-red-50 text-red-700`
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Health Check Failed</h3>
        <p className="text-gray-500 mb-4">Unable to retrieve system health information</p>
        <button
          onClick={fetchHealthData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-500">Real-time system monitoring and diagnostics</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchHealthData}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(healthData.status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {healthData.diagnostics.overall_message}
              </h2>
              <p className="text-sm text-gray-500">
                Last checked: {new Date(healthData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={getStatusBadge(healthData.status)}>
            {healthData.status.toUpperCase()}
          </span>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {healthData.diagnostics.summary.healthy_count}
            </div>
            <div className="text-sm text-gray-500">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {healthData.diagnostics.summary.degraded_count}
            </div>
            <div className="text-sm text-gray-500">Degraded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {healthData.diagnostics.summary.unhealthy_count}
            </div>
            <div className="text-sm text-gray-500">Unhealthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {healthData.diagnostics.summary.total_checks}
            </div>
            <div className="text-sm text-gray-500">Total Checks</div>
          </div>
        </div>
      </div>

      {/* Priority Issues */}
      {healthData.diagnostics.priority_issues.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Priority Issues ({healthData.diagnostics.priority_issues.length})</span>
              {healthData.diagnostics.estimated_fix_time && (
                <span className="text-sm text-gray-500 ml-2">
                  Est. fix time: {healthData.diagnostics.estimated_fix_time}
                </span>
              )}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {healthData.diagnostics.priority_issues.map((issue, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <h4 className="font-medium text-gray-900">{issue.component}</h4>
                      <p className="text-sm text-gray-600">{issue.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getSeverityBadge(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </span>
                    {issue.resolution_time && (
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{issue.resolution_time}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {issue.details && (
                  <div className="mb-3 p-3 bg-white rounded border-l-4 border-red-400">
                    <p className="text-sm text-gray-700">{issue.details}</p>
                  </div>
                )}

                {issue.actionable_steps && issue.actionable_steps.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {issue.actionable_steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Impact: {issue.impact}</span>
                  <span>Last checked: {new Date(issue.last_checked).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthData.diagnostics.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>System Recommendations</span>
          </h3>
          <ul className="space-y-2">
            {healthData.diagnostics.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2 text-blue-800">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Components */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All System Components</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {healthData.diagnostics.all_components.map((component, index) => (
            <div key={index} className="p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleComponentExpansion(component.component)}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{component.component}</h4>
                    <p className="text-sm text-gray-600">{component.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={getStatusBadge(component.status)}>
                    {component.status.toUpperCase()}
                  </span>
                  {expandedComponents.has(component.component) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedComponents.has(component.component) && (
                <div className="mt-4 pl-8 space-y-3">
                  {component.details && (
                    <div className="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                      <p className="text-sm text-gray-700">{component.details}</p>
                    </div>
                  )}

                  {component.actionable_steps && component.actionable_steps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Actionable Steps:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {component.actionable_steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <span className="text-gray-500 mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {component.technical_details && Object.keys(component.technical_details).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Technical Details:</h5>
                      <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                        {Object.entries(component.technical_details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Impact: {component.impact}</span>
                    <span>Severity: {component.severity}</span>
                    <span>Last checked: {new Date(component.last_checked).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 