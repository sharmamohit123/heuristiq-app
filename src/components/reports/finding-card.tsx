'use client'

import { Finding } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Lightbulb, AlertTriangle, Users, ExternalLink } from 'lucide-react'

interface FindingCardProps {
  finding: Finding
  index: number
}

const confidenceConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
}

const severityConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200' },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200' },
  positive: { label: 'Positive', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200' },
}

export function FindingCard({ finding, index }: FindingCardProps) {
  const confidence = confidenceConfig[finding.confidence]
  const severity = finding.severity ? severityConfig[finding.severity as keyof typeof severityConfig] : null

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {index + 1}
            </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight mb-2">{finding.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {severity && (
                <Badge variant="outline" className={cn('text-xs font-bold uppercase', severity.color)}>
                  {severity.label}
                </Badge>
              )}
                <Badge variant="outline" className={cn('text-xs', confidence.color)}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {confidence.label} Confidence
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {finding.frequency}x observed
                </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {finding.explanation}
          </p>
        </div>
        
        {finding.suggested_fix && (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  Suggested Fix
                </p>
                <p className="text-sm text-emerald-800">{finding.suggested_fix}</p>
              </div>
            </div>
          </div>
        )}

        {finding.screenshot_url && (
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-3 w-3 mr-2" />
            View Screenshot
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
