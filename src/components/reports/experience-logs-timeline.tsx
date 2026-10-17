'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Image as ImageIcon, X, ZoomIn } from 'lucide-react'
import { SeverityLevel, ExperimentScreenshot } from '@/types/database'
import { useState } from 'react'

export interface ExperienceLog {
  screenshot_id: string
  step: number
  timestamp: string
  observation: string
  action: string
  severity?: SeverityLevel
}

interface ExperienceLogsTimelineProps {
  logs: ExperienceLog[]
  screenshots?: ExperimentScreenshot[]
}

export function ExperienceLogsTimeline({ logs, screenshots = [] }: ExperienceLogsTimelineProps) {
  const [sortBy, setSortBy] = useState<'chronological' | 'severity'>('chronological')
  const [expandedImage, setExpandedImage] = useState<{ url: string; label: string } | null>(null)

  const getSeverityConfig = (severity?: SeverityLevel) => {
    if (!severity) return { label: 'Info', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
        }
      case 'high':
        return {
          label: 'Distraction',
          className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
        }
      case 'medium':
        return {
          label: 'Friction',
          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        }
      case 'low':
        return {
          label: 'Minor',
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        }
      case 'positive':
        return {
          label: 'Success',
          className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
        }
    }
  }

  const severityOrder: Record<SeverityLevel, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    positive: 5,
  }

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortBy === 'severity') {
      const aOrder = a.severity ? severityOrder[a.severity] : 999
      const bOrder = b.severity ? severityOrder[b.severity] : 999
      return aOrder - bOrder
    }
    return a.step - b.step
  })

  const getScreenshotData = (screenshotId: string, step: number): { url: string | null; context: string | null } => {
    // First, try to find by step number (for live URL tests which use step-based indexing)
    const screenshotByStep = screenshots.find(s => {
      // Check if this screenshot's id or context matches the step
      const stepMatch = s.id?.match(/step-(\d+)/i) || s.context?.match(/Step (\d+)/i)
      if (stepMatch) {
        return parseInt(stepMatch[1]) === step
      }
      // Also check by order (0-indexed)
      return s.order === step - 1
    })
    
    if (screenshotByStep) {
      return {
        url: screenshotByStep.url || null,
        context: screenshotByStep.context || null,
      }
    }

    // Fallback: Extract screenshot number from ID (e.g., "Screenshot 1" -> 0)
    const match = screenshotId.match(/Screenshot (\d+)/i)
    if (match) {
      const index = parseInt(match[1]) - 1
      const screenshot = screenshots[index]
      return {
        url: screenshot?.url || null,
        context: screenshot?.context || null,
      }
    }
    
    // Final fallback: try to find by step-1 index
    const fallbackScreenshot = screenshots[step - 1]
    if (fallbackScreenshot) {
      return {
        url: fallbackScreenshot.url || null,
        context: fallbackScreenshot.context || null,
      }
    }
    
    return { url: null, context: null }
  }

  if (logs.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-[18px] w-[18px] text-primary" />
          Experience Logs
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">View:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'chronological' | 'severity')}
            className="text-xs border-none bg-transparent font-bold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer p-0 pr-6"
          >
            <option value="chronological">Chronological</option>
            <option value="severity">Severity</option>
          </select>
        </div>
      </div>
      <CardContent className="p-0">
        {sortedLogs.map((log, idx) => {
          const config = getSeverityConfig(log.severity)
          const screenshotData = getScreenshotData(log.screenshot_id, log.step)
          const totalSteps = logs.length
          const displayLabel = screenshotData.context || log.screenshot_id

          return (
            <div 
              key={idx} 
              className="group flex flex-col sm:flex-row gap-5 p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors last:border-b-0"
            >
              {/* Screenshot Thumbnail - Clickable */}
              <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-40">
                <button
                  onClick={() => screenshotData.url && setExpandedImage({ url: screenshotData.url, label: displayLabel })}
                  disabled={!screenshotData.url}
                  className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-default disabled:hover:ring-0"
                >
                  {screenshotData.url ? (
                    <>
                      <img
                        src={screenshotData.url}
                        alt={displayLabel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </button>
                <div className="flex justify-between items-center px-1">
                  <span className="font-mono text-[11px] text-gray-500 font-medium">
                    {log.timestamp}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400">
                    Step {log.step}/{totalSteps}
                  </span>
                </div>
              </div>

              {/* Log Content */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline"
                    className={`text-[10px] font-bold uppercase tracking-wide border ${config.className}`}
                  >
                    {config.label}
                  </Badge>
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {log.action}
                  </h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                  {log.observation}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1 text-[11px] font-mono text-gray-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      log.severity === 'critical' ? 'bg-red-400' :
                      log.severity === 'high' ? 'bg-orange-400' :
                      log.severity === 'medium' ? 'bg-yellow-400' :
                      log.severity === 'low' ? 'bg-blue-400' :
                      log.severity === 'positive' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    {displayLabel}
                  </Badge>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>

      {/* Lightbox Modal for Expanded Screenshot */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            
            {/* Image */}
            <img
              src={expandedImage.url}
              alt={expandedImage.label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Label */}
            <p className="mt-3 text-center text-white/80 text-sm">
              {expandedImage.label}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
