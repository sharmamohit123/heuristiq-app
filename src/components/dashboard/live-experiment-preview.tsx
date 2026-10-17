'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface LiveExperimentPreviewProps {
  experiment: any
}

export function LiveExperimentPreview({ experiment }: LiveExperimentPreviewProps) {
  const isRunning = experiment.status === 'running'
  const isCompleted = experiment.status === 'completed'
  const results = experiment.results as any

  if (isRunning) {
    // Show live analysis preview
    return (
      <Link href={`/experiments/${experiment.id}`} className="block">
        <Card className="w-full lg:w-80 h-48 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 relative overflow-hidden border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="absolute inset-0 flex flex-col p-5">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-blue-600 text-white gap-1.5">
                <span className="flex h-2 w-2 bg-white rounded-full animate-pulse" />
                Live Analysis
              </Badge>
            </div>
            
            <h3 className="font-bold text-sm mb-2 line-clamp-2">
              {experiment.name}
            </h3>
            
            {/* Live chart/progress */}
            <div className="mt-auto">
              <div className="flex gap-1 items-end h-20 pb-1">
                {[40, 70, 50, 90, 60, 75].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary rounded-sm transition-all"
                    style={{ height: `${h}%`, opacity: 0.4 + (i * 0.1) }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  if (isCompleted && results) {
    // Show report snippet
    const uxScore = results.ux_score || 0
    const successRate = results.success_rate || 0
    const totalRuns = results.total_runs || 0

    // Dynamic background based on success rate
    const getCompletedGradient = () => {
      if (successRate >= 80) {
        return {
          gradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
          border: 'border-emerald-200 dark:border-emerald-800',
          badge: 'bg-emerald-600',
          textColor: 'text-emerald-900 dark:text-emerald-100',
          metricColor: 'text-emerald-700 dark:text-emerald-300',
          bgBox: 'bg-white/60 dark:bg-black/20'
        }
      } else if (successRate >= 50) {
        return {
          gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900',
          border: 'border-yellow-200 dark:border-yellow-800',
          badge: 'bg-yellow-600',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          metricColor: 'text-yellow-700 dark:text-yellow-300',
          bgBox: 'bg-white/60 dark:bg-black/20'
        }
      } else {
        return {
          gradient: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
          border: 'border-red-200 dark:border-red-800',
          badge: 'bg-red-600',
          textColor: 'text-red-900 dark:text-red-100',
          metricColor: 'text-red-700 dark:text-red-300',
          bgBox: 'bg-white/60 dark:bg-black/20'
        }
      }
    }

    const colors = getCompletedGradient()

    return (
      <Link href={`/experiments/${experiment.id}/report`} className="block">
        <Card className={`w-full lg:w-80 h-48 rounded-xl bg-gradient-to-br ${colors.gradient} relative overflow-hidden ${colors.border} hover:shadow-lg transition-shadow cursor-pointer`}>
          <div className="absolute inset-0 flex flex-col p-5">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className={colors.badge + " text-white"}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
              <span className={`text-xs ${colors.metricColor} font-medium`}>
                {formatDistanceToNow(new Date(experiment.completed_at), { addSuffix: true })}
              </span>
            </div>
            
            <h3 className={`font-bold text-sm mb-4 line-clamp-2 ${colors.textColor}`}>
              {experiment.name}
            </h3>
            
            {/* Report metrics */}
            <div className="mt-auto grid grid-cols-3 gap-2">
              <div className={`text-center p-2 ${colors.bgBox} rounded`}>
                <div className={`text-lg font-bold ${colors.metricColor}`}>{uxScore}</div>
                <div className={`text-[10px] ${colors.metricColor} font-medium`}>UX Score</div>
              </div>
              <div className={`text-center p-2 ${colors.bgBox} rounded`}>
                <div className={`text-lg font-bold ${colors.metricColor}`}>{Math.round(successRate)}%</div>
                <div className={`text-[10px] ${colors.metricColor} font-medium`}>Success</div>
              </div>
              <div className={`text-center p-2 ${colors.bgBox} rounded`}>
                <div className={`text-lg font-bold ${colors.metricColor}`}>{totalRuns}</div>
                <div className={`text-[10px] ${colors.metricColor} font-medium`}>Runs</div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  return null
}
