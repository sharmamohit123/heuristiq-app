import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RunAnalysisSection } from '@/components/reports/run-analysis-section'
import { RunAnalysisPrintAll } from '@/components/reports/run-analysis-print-all'
import { DebugDataButton } from '@/components/reports/debug-data-button'
import { ReaggregateButton } from '@/components/reports/reaggregate-button'
import { ExecutiveSummaryEnhanced } from '@/components/reports/executive-summary-enhanced'
import { FindingsSection } from '@/components/reports/findings-section'
import { ExportButtons } from '@/components/reports/export-buttons'
import { TestEmailButton } from '@/components/reports/test-email-button'
import { PrintTitlePage } from '@/components/reports/print-title-page'
import './print-styles.css'
import { formatDistanceToNow, format } from 'date-fns'
import {
  ArrowLeft,
  ImageIcon,
} from 'lucide-react'
import { ExperimentScreenshot, InputMode } from '@/types/database'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const experimentId = resolvedParams.id
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch experiment with project
  const { data: experiment } = await supabase
    .from('experiments')
    .select(`
      *,
      project:projects(name)
    `)
    .eq('id', experimentId)
    .single()

  if (!experiment || experiment.status !== 'completed') {
    notFound()
  }

  // Fetch findings
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('frequency', { ascending: false })

  // Fetch runs
  const { data: runs } = await supabase
    .from('experiment_runs')
    .select('*, persona:personas(name)')
    .eq('experiment_id', experimentId)

  // Fetch personas
  const { data: expPersonas } = await supabase
    .from('experiment_personas')
    .select('persona_id')
    .eq('experiment_id', experimentId)

  const personaIds = expPersonas?.map((ep) => ep.persona_id) || []
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .in('id', personaIds)

  interface Recommendation {
    priority: number
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    frequency?: number
  }

  interface PositiveFinding {
    title: string
    description: string
    frequency: number
  }

  // Calculate metrics
  const results = experiment.results as {
    success_rate?: number
    avg_duration_ms?: number
    ux_score?: number
    total_runs?: number
    total_failures?: number
    summary?: string
    recommendations?: Recommendation[]
    positiveFindings?: PositiveFinding[]
  } | null

  const successRate = results?.success_rate || 0
  const avgDuration = results?.avg_duration_ms ? Math.round(results.avg_duration_ms / 1000) : 0
  const uxScore = results?.ux_score || 0
  const totalRuns = runs?.length || 0
  const successfulRuns = runs?.filter((r) => r.success).length || 0
  const failedRuns = runs?.filter((r) => !r.success).length || 0

  const inputLinks = experiment.input_links as { control?: string; variant?: string; single?: string }
  const inputMode = (experiment.input_mode || 'live_url') as InputMode
  const screenshots = (experiment.screenshots as unknown as ExperimentScreenshot[]) || []

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background print:overflow-visible print:block">
      {/* Print Title Page (hidden on screen) */}
      <PrintTitlePage 
        experiment={experiment}
        totalRuns={totalRuns}
        totalPersonas={personas?.length || 0}
      />

      {/* Header */}
      <div className="border-b bg-card py-4 no-print">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-start gap-4">
            <Link href={`/experiments/${experimentId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{experiment.name}</h1>
                <Badge variant="secondary">{experiment.type === 'ab_test' ? 'A/B Experiment' : 'Usability'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {experiment.project?.name} • Completed {formatDistanceToNow(new Date(experiment.completed_at!), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            {/* <ReaggregateButton experimentId={experimentId} />
            <DebugDataButton 
              experiment={experiment}
              runs={runs || []}
              findings={findings || []}
            /> */}
            <TestEmailButton experimentId={experimentId} />
            <ExportButtons 
              exportData={{
                experiment,
                findings: findings || [],
                runs: runs || [],
                personas: personas || [],
                screenshots,
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 print:max-w-none print:p-0">
          {/* Executive Summary */}
          <ExecutiveSummaryEnhanced
            summary={results?.summary || `The usability experiment completed with a ${Math.round(successRate)}% success rate across ${totalRuns} runs.`}
            uxScore={uxScore}
            successRate={successRate}
            successfulRuns={successfulRuns}
            totalRuns={totalRuns}
            avgDuration={avgDuration}
            findings={findings || []}
            positiveFindings={results?.positiveFindings || []}
            recommendations={results?.recommendations || []}
          />

          {/* Top Findings with Expandable View */}
          <FindingsSection findings={findings || []} />

          {/* Run Analysis Section with Enhanced Components */}
          <div className="print:hidden">
            <RunAnalysisSection 
              runs={runs || []}
              personas={personas || []}
              screenshots={screenshots}
              inputMode={inputMode}
            />
          </div>

          {/* Print: Show ALL runs (hidden on screen) */}
          <RunAnalysisPrintAll
            runs={runs || []}
            personas={personas || []}
            screenshots={screenshots}
          />

          {/* Test Details */}
          <section>
            <h2 className="text-lg font-bold mb-4">Test Configuration</h2>
            <Card>
              <CardContent className="pt-6">
                {/* Screenshots Section (if screenshot mode) */}
                {inputMode === 'screenshots' && screenshots.length > 0 && (
                  <>
                    <div className="mb-6">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Test Screenshots ({screenshots.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {screenshots.map((screenshot, index) => (
                          <div key={screenshot.id} className="relative group">
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                              <img
                                src={screenshot.url}
                                alt={screenshot.context || `Screenshot ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {screenshot.context || `Screen ${index + 1}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator className="my-6" />
                  </>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      {inputMode === 'screenshots' ? 'Input Mode' : 'Target URL'}
                    </p>
                    {inputMode === 'screenshots' ? (
                      <Badge variant="secondary" className="mt-1">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {screenshots.length} Screenshots
                      </Badge>
                    ) : (
                      <code className="text-sm bg-muted px-2 py-1 rounded block truncate">
                        https://{inputLinks.single || inputLinks.control}
                      </code>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Started
                    </p>
                    <p className="text-sm">
                      {experiment.started_at
                        ? format(new Date(experiment.started_at), 'PPp')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Completed
                    </p>
                    <p className="text-sm">
                      {experiment.completed_at
                        ? format(new Date(experiment.completed_at), 'PPp')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Total Runs
                    </p>
                    <p className="text-sm">{totalRuns} runs across {personas?.length || 0} personas</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                {/* Research Goal */}
                {experiment.hypothesis && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Research Goal
                    </p>
                    <div className="text-sm bg-muted p-4 rounded-lg border-l-4 border-primary">
                      {experiment.hypothesis}
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Test Script
                  </p>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                    {experiment.script || 'No script defined'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </div>
  )
}
