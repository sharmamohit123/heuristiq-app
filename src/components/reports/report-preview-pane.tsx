'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getUxScoreColor, getSuccessRateColor, getIssuesColor } from '@/lib/kpi-utils'
import { ExternalLink, FileText, TrendingUp, Clock, AlertTriangle, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReportPreviewPaneProps {
  experiment: any
  findings: any[]
}

export function ReportPreviewPane({ experiment, findings }: ReportPreviewPaneProps) {
  const results = experiment.results as any
  const successRate = results?.success_rate || 0
  const uxScore = results?.ux_score || 0
  const avgDuration = results?.avg_duration_ms ? Math.round(results.avg_duration_ms / 1000) : 0
  const totalRuns = results?.total_runs || 0
  
  // Get dynamic colors based on values
  const uxScoreColor = getUxScoreColor(uxScore)
  const successColor = getSuccessRateColor(successRate)
  const issuesColor = getIssuesColor(findings.length)

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs font-bold uppercase tracking-wide">
                <span className="flex h-2 w-2 bg-green-500 rounded-full mr-1.5" />
                Completed
              </Badge>
              <span className="text-xs text-muted-foreground">
                ID: #{experiment.id.split('-')[0]}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-1">{experiment.name}</h1>
            <p className="text-muted-foreground">
              Project: <span className="font-medium text-primary">{experiment.project?.name}</span>
              <span className="mx-2 text-border">•</span>
              Completed {formatDistanceToNow(new Date(experiment.completed_at), { addSuffix: true })}
            </p>
          </div>
          <Link href={`/experiments/${experiment.id}/report`}>
            <Button className="shadow-lg shadow-primary/20">
              View Full Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* KPI Tiles - 3-column design matching reference */}
        <div className="grid grid-cols-3 gap-4">
          <div className={cn(
            "flex flex-col items-center justify-center text-center p-6 rounded-xl border shadow-sm",
            "bg-gradient-to-br from-primary/5 to-card",
            uxScoreColor.border
          )}>
            <div className={cn("text-4xl font-bold tabular-nums mb-1", uxScoreColor.text)}>
              {uxScore}
            </div>
            <div className="text-sm font-medium text-muted-foreground">UX Score</div>
            <div className={cn(
              "mt-2 text-xs px-2 py-0.5 rounded-full",
              uxScoreColor.bg, uxScoreColor.text
            )}>
              {uxScoreColor.label}
            </div>
          </div>

          <div className={cn(
            "flex flex-col items-center justify-center text-center p-6 rounded-xl border shadow-sm bg-card",
            successColor.border
          )}>
            <div className={cn("text-4xl font-bold tabular-nums mb-1", successColor.text)}>
              {Math.round(successRate)}%
            </div>
            <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {totalRuns} total runs
            </div>
          </div>

          <div className={cn(
            "flex flex-col items-center justify-center text-center p-6 rounded-xl border shadow-sm bg-card",
            findings.length > 0 ? issuesColor.border : "border-border"
          )}>
            <div className={cn(
              "text-4xl font-bold tabular-nums mb-1",
              findings.length === 0 ? "text-muted-foreground" : issuesColor.text
            )}>
              {findings.length}
            </div>
            <div className="text-sm font-medium text-muted-foreground">Critical Issues</div>
            {findings.length === 0 ? (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Perfect
              </div>
            ) : (
              <div className={cn("mt-2 text-xs", issuesColor.text)}>
                {issuesColor.label}
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        {results?.summary && (
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Executive Summary
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {results.summary}
            </p>
          </div>
        )}

        {/* Key Findings */}
        {findings.length > 0 && (
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Key Findings
            </h3>
            <div className="space-y-3">
              {findings.slice(0, 4).map((finding, idx) => {
                const severityConfig: Record<string, { className: string; label: string }> = {
                  critical: { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', label: 'CRITICAL' },
                  high: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'HIGH' },
                  medium: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', label: 'MED' },
                  low: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'LOW' },
                  positive: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', label: 'POS' },
                }
                const severity = severityConfig[finding.severity] || severityConfig.medium
                
                return (
                  <div
                    key={finding.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">{finding.title}</h4>
                          {finding.severity && (
                            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase border flex-shrink-0", severity.className)}>
                              {severity.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {finding.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {findings.length > 4 && (
                <Link href={`/experiments/${experiment.id}/report`}>
                  <Button variant="outline" className="w-full mt-2" size="sm">
                    View All {findings.length} Findings
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {results?.recommendations && results.recommendations.length > 0 && (
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Top Recommendations
            </h3>
            <div className="space-y-3">
              {results.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className={cn(
                    "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs",
                    rec.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-gradient-to-t from-muted/80 to-transparent pt-6 pb-2">
          <Link href={`/experiments/${experiment.id}/report`}>
            <Button className="w-full shadow-lg shadow-primary/20" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Report & Export
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
