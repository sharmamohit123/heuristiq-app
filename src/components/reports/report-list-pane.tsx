'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getUxScoreColor, getSuccessRateColor, getIssuesColor } from '@/lib/kpi-utils'
import { FileText, ExternalLink, Clock, Globe, ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { InputMode } from '@/types/database'

interface ReportListPaneProps {
  experiments: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  findingsCounts: Record<string, number>
}

export function ReportListPane({ experiments, selectedId, onSelect, findingsCounts }: ReportListPaneProps) {
  return (
    <div className="w-full lg:w-[440px] flex flex-col h-full overflow-hidden border-r">
      {/* Header with Count */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-sm text-muted-foreground">
          Total <span className="font-semibold text-foreground">{experiments.length}</span> {experiments.length === 1 ? 'report' : 'reports'} generated
        </p>
      </div>

      {/* Report List */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
        {experiments.map((experiment) => {
          const results = experiment.results as any
          const isSelected = selectedId === experiment.id
          const issuesCount = findingsCounts[experiment.id] || 0
          const inputMode = (experiment.input_mode || 'live_url') as InputMode
          const inputLinks = experiment.input_links as { single?: string; control?: string } | null
          const targetUrl = inputLinks?.single || inputLinks?.control
          
          const uxScore = results?.ux_score || 0
          const successRate = results?.success_rate || 0
          const uxScoreColor = getUxScoreColor(uxScore)
          const successColor = getSuccessRateColor(successRate)
          const issuesColor = getIssuesColor(issuesCount)
          
          return (
            <div key={experiment.id} className="group relative">
              {/* Active indicator bar */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg z-10" />
              )}
              
              <button
                onClick={() => onSelect(experiment.id)}
                className={cn(
                  "w-full text-left p-5 rounded-lg border transition-all duration-200 cursor-pointer bg-card",
                  isSelected 
                    ? "border-primary shadow-[0_0_15px_rgba(37,99,235,0.12)]" 
                    : "border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                )}
              >
                {/* Top row: Icon + Title + Open link */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors flex-shrink-0",
                    isSelected 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-sm leading-tight transition-colors",
                      isSelected ? "text-primary" : "group-hover:text-primary"
                    )}>
                      {experiment.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span>{experiment.project?.name}</span>
                      <span className="text-border">•</span>
                      <span>{formatDistanceToNow(new Date(experiment.completed_at), { addSuffix: true })}</span>
                    </p>
                    {targetUrl && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1 truncate">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{targetUrl}</span>
                      </p>
                    )}
                  </div>
                  <Link 
                    href={`/experiments/${experiment.id}/report`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex-shrink-0 transition-colors p-1 rounded-md hover:bg-primary/10",
                      isSelected ? "text-primary" : "text-muted-foreground/30 group-hover:text-primary"
                    )}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                {/* KPI metrics row */}
                <div className={cn(
                  "flex items-center gap-6 mt-4 pl-[2.75rem]",
                  !isSelected && "opacity-70 group-hover:opacity-100 transition-opacity"
                )}>
                  <div className="text-center">
                    <div className={cn("text-xl font-bold tabular-nums", uxScoreColor.text)}>{uxScore}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">UX Score</div>
                  </div>
                  <div className="text-center">
                    <div className={cn("text-xl font-bold tabular-nums", successColor.text)}>{Math.round(successRate)}%</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Success</div>
                  </div>
                  {issuesCount > 0 && (
                    <div className="text-center">
                      <div className={cn("text-xl font-bold tabular-nums", issuesColor.text)}>{issuesCount}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Issues</div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
