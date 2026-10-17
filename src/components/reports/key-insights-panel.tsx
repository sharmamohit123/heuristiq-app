import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb } from 'lucide-react'
import { SeverityLevel } from '@/types/database'

export interface Insight {
  severity: SeverityLevel
  text: string
  screenshot_id?: string
}

interface KeyInsightsPanelProps {
  insights: Insight[]
  maxInsights?: number  // Set to 0 or undefined for unlimited
  showPlaceholder?: boolean
}

// Severity priority for sorting (lower = higher priority)
const severityPriority: Record<string, number> = {
  critical: 1,
  high: 2,
  positive: 3, // Show positive insights prominently
  medium: 4,
  low: 5,
}

export function KeyInsightsPanel({ insights, maxInsights, showPlaceholder = false }: KeyInsightsPanelProps) {
  const getSeverityConfig = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-900',
        }
      case 'high':
        return {
          label: 'High',
          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        }
      case 'medium':
        return {
          label: 'Med',
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
        }
      case 'low':
        return {
          label: 'Low',
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        }
      case 'positive':
        return {
          label: 'Pos',
          className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-900',
        }
    }
  }

  // Show placeholder if no insights and showPlaceholder is true
  if (insights.length === 0) {
    if (!showPlaceholder) return null
    
    return (
      <Card className="h-full">
        <CardContent className="p-5 h-full flex flex-col">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Key Insights
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center py-4">
              No specific insights identified for this run. The user experience appears to be smooth overall.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter out duplicate/similar insights and prioritize by severity
  const uniqueInsights = insights.reduce((acc, insight) => {
    // Check for near-duplicates (similar text)
    const isDuplicate = acc.some(existing => {
      const similarity = calculateTextSimilarity(existing.text.toLowerCase(), insight.text.toLowerCase())
      return similarity > 0.7 // 70% similarity threshold
    })
    
    if (!isDuplicate) {
      acc.push(insight)
    }
    return acc
  }, [] as Insight[])

  // Sort by severity priority and optionally limit
  const sortedInsights = [...uniqueInsights]
    .sort((a, b) => {
      const priorityA = severityPriority[a.severity] || 99
      const priorityB = severityPriority[b.severity] || 99
      return priorityA - priorityB
    })
  
  // Only slice if maxInsights is specified and > 0
  const displayInsights = maxInsights && maxInsights > 0 
    ? sortedInsights.slice(0, maxInsights) 
    : sortedInsights

  return (
    <Card className="h-full">
      <CardContent className="p-5 h-full flex flex-col">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Key Insights
          {/* {maxInsights && maxInsights > 0 && insights.length > maxInsights && (
            <span className="text-xs font-normal text-muted-foreground">
              (showing top {maxInsights} of {insights.length})
            </span>
          )} */}
        </h4>
        <div className="space-y-3 overflow-y-auto flex-1 max-h-[400px]">
          {displayInsights.map((insight, idx) => {
            const config = getSeverityConfig(insight.severity)
            return (
              <div key={idx} className="flex gap-3 items-start">
                <Badge 
                  variant="outline"
                  className={`mt-0.5 flex-shrink-0 text-[10px] font-bold uppercase tracking-wide border ${config.className}`}
                >
                  {config.label}
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                  {insight.text}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to calculate text similarity (simple word overlap)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  const intersection = [...words1].filter(w => words2.has(w)).length
  const union = new Set([...words1, ...words2]).size
  
  return intersection / union
}
