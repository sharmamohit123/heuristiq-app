import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getUxScoreColor, getSuccessRateColor, getIssuesColor } from '@/lib/kpi-utils'
import { TrendingUp, Clock, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react'

interface Finding {
  title: string
  explanation: string
  confidence: string
  frequency: number
  severity?: string
}

interface PositiveFinding {
  title: string
  description: string
  frequency: number
}

interface Recommendation {
  priority: number
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  frequency?: number
}

interface ExecutiveSummaryEnhancedProps {
  summary: string
  uxScore: number
  successRate: number
  successfulRuns: number
  totalRuns: number
  avgDuration: number
  findings: Finding[]
  positiveFindings?: PositiveFinding[]
  recommendations: Recommendation[]
}

export function ExecutiveSummaryEnhanced({
  summary,
  uxScore,
  successRate,
  successfulRuns,
  totalRuns,
  avgDuration,
  findings,
  positiveFindings = [],
  recommendations,
}: ExecutiveSummaryEnhancedProps) {
  // Get dynamic colors based on metric values
  const uxScoreColor = getUxScoreColor(uxScore)
  const successColor = getSuccessRateColor(successRate)
  // Issues count should only include actual issues (findings), not positive findings
  const issuesColor = getIssuesColor(findings.length)
  
  return (
    <section>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Executive Summary
      </h2>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Completion Rate*/}
        <div className={cn("flex flex-col gap-2 rounded-xl p-5 border shadow-sm", successColor.bg, successColor.border)}>
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completion Rate</p>
            <TrendingUp className={cn("h-5 w-5", successColor.icon)} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-3xl font-bold leading-tight tabular-nums", successColor.text)}>{Math.round(successRate)}%</p>
          </div>
        </div>

        {/* Avg Time on Task */}
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-[#1a202c] border border-[#e7ebf4] dark:border-[#2a3441] shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Time on Task</p>
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold leading-tight tabular-nums">
              {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
            </p>
          </div>
        </div>

        {/* System Usability Score */}
        <div className={cn("flex flex-col gap-2 rounded-xl p-5 border shadow-sm", uxScoreColor.bg, uxScoreColor.border)}>
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">System Usability Score</p>
            <svg className={cn("h-5 w-5", uxScoreColor.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-3xl font-bold leading-tight tabular-nums", uxScoreColor.text)}>
              {uxScore}<span className="text-lg text-gray-400 font-normal">/100</span>
            </p>
          </div>
        </div>

        {/* Issues Found */}
        <div className={cn("flex flex-col gap-2 rounded-xl p-5 border shadow-sm", issuesColor.bg, issuesColor.border)}>
          <div className="flex justify-between items-start">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Issues Found</p>
            <AlertTriangle className={cn("h-5 w-5", issuesColor.icon)} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-3xl font-bold leading-tight tabular-nums", issuesColor.text)}>{findings.length}</p>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">across {totalRuns} runs</span>
          </div>
        </div>
      </div>

      {/* Three-Column Summary Layout */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-bold">Analysis Overview</h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Aggregated Summary */}
            <div className="lg:w-1/4">
              <h4 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-3">
                Aggregated Summary
              </h4>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {summary}
              </p>
            </div>

            {/* Key Issues - TL;DR */}
            <div className="lg:w-1/4 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-4 lg:pt-0 lg:pl-8">
              <h4 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Key Issues
              </h4>
              {findings.length > 0 ? (
                <ul className="space-y-3">
                  {findings.slice(0, 4).map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="leading-snug">{finding.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No issues identified. The user experience appears smooth.
                </p>
              )}
            </div>

            {/* What Works Well - Positive Findings */}
            <div className="lg:w-1/4 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-4 lg:pt-0 lg:pl-8">
              <h4 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                What Works Well
              </h4>
              {positiveFindings.length > 0 ? (
                <ul className="space-y-3">
                  {positiveFindings.slice(0, 3).map((pf, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                      <span className="leading-snug">{pf.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific strengths highlighted in this test.
                </p>
              )}
            </div>

            {/* Top Recommendations - TL;DR */}
            <div className="lg:w-1/4 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-4 lg:pt-0 lg:pl-8">
              <h4 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Top Recommendations
              </h4>
              {recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {recommendations.slice(0, 4).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                      <span className="leading-snug">{rec.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific recommendations at this time.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
