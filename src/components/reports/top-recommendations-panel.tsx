import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

export interface Recommendation {
  priority: number
  title: string
  description: string
}

interface TopRecommendationsPanelProps {
  recommendations: Recommendation[]
  showPlaceholder?: boolean
}

export function TopRecommendationsPanel({ recommendations, showPlaceholder = false }: TopRecommendationsPanelProps) {
  // Show placeholder if no recommendations and showPlaceholder is true
  if (recommendations.length === 0) {
    if (!showPlaceholder) return null
    
    return (
      <Card className="h-full">
        <CardContent className="p-5 h-full flex flex-col">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <ArrowRight className="h-5 w-5 text-primary" />
            Top Recommendations
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center py-4">
              No specific recommendations for this run. Continue monitoring user feedback for optimization opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="p-5 h-full flex flex-col">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 flex-shrink-0">
          <ArrowRight className="h-5 w-5 text-primary" />
          Top Recommendations
        </h4>
        <ul className="space-y-4 overflow-y-auto flex-1 max-h-[280px]">
          {recommendations.map((rec) => (
            <li key={rec.priority} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-xs font-bold">{rec.priority}</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                <strong className="text-gray-900 dark:text-white font-semibold block mb-0.5">
                  {rec.title}
                </strong>
                {rec.description}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
