'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Experiment, Persona, ExperimentRun, ExperimentScreenshot, InputMode, BrowserTestProgress } from '@/types/database'
import { combineUsageSummaries, LlmUsageCompact } from '@/lib/ai'
import { AgentConsole, ParallelAgentConsole } from '@/components/experiments/agent-console'
import { CloneExperimentDialog } from '@/components/experiments/clone-experiment-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useParallelRuns } from '@/lib/stores/parallel-runs'
import { MultiplexedEvent } from '@/lib/sse-multiplexer'
import {
  ArrowLeft,
  Play,
  Square,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  ImageIcon,
  Link as LinkIcon,
  Copy,
  Video,
  Globe,
  FlaskConical,
  FileText,
  Zap,
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  persona: Persona
  message: string
  type: 'action' | 'observation' | 'decision' | 'error' | 'success'
}

// Helper function to render basic markdown
function renderSimpleMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  
  lines.forEach((line, index) => {
    let element: React.ReactNode = line
    
    // Handle ## headers
    if (line.startsWith('## ')) {
      element = (
        <span key={index} className="font-semibold text-foreground block mb-2 mt-3 first:mt-0">
          {renderBoldText(line.slice(3))}
        </span>
      )
    }
    // Handle numbered list items
    else if (/^\d+\.\s/.test(line)) {
      element = (
        <span key={index} className="block ml-2 mb-1">
          {renderBoldText(line)}
        </span>
      )
    }
    // Handle regular lines
    else if (line.trim()) {
      element = (
        <span key={index} className="block mb-1">
          {renderBoldText(line)}
        </span>
      )
    }
    // Handle empty lines
    else {
      element = <br key={index} />
    }
    
    elements.push(element)
  })
  
  return <>{elements}</>
}

// Helper to render **bold** text
function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function ExperimentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const experimentId = params.id as string
  const shouldAutoStart = searchParams.get('autostart') === 'true'
  const hasAutoStartedRef = useRef(false)

  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [personaRunCounts, setPersonaRunCounts] = useState<Record<string, number>>({})
  const [runs, setRuns] = useState<ExperimentRun[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isAggregating, setIsAggregating] = useState(false)
  const [progressStatus, setProgressStatus] = useState<string>('') // Status text for progress bar
  const abortControllerRef = useRef<AbortController | null>(null)
  const runProgressRef = useRef<Map<string, number>>(new Map()) // Track progress per run

  // Parallel runs store
  const parallelRuns = useParallelRuns()

  const fetchExperiment = useCallback(async () => {
    const supabase = createClient()
    
    const { data: expData, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single()

    const exp = expData as Experiment | null

    if (error || !exp) {
      toast.error('Experiment not found')
      router.push('/experiments')
      return
    }

    setExperiment(exp)
    setIsRunning(exp.status === 'running')

    // Fetch assigned personas and their run counts
    const { data: expPersonasData } = await supabase
      .from('experiment_personas')
      .select('persona_id, runs_count')
      .eq('experiment_id', experimentId)

    const expPersonas = expPersonasData as Array<{ persona_id: string; runs_count: number }> | null

    if (expPersonas && expPersonas.length > 0) {
      const personaIds = expPersonas.map((ep) => ep.persona_id)
      
      // Store run counts per persona
      const runCounts: Record<string, number> = {}
      expPersonas.forEach((ep) => {
        runCounts[ep.persona_id] = ep.runs_count || 1
      })
      setPersonaRunCounts(runCounts)
      
      const { data: personaData } = await supabase
        .from('personas')
        .select('*')
        .in('id', personaIds)

      setPersonas((personaData as Persona[]) || [])
    }

    // Fetch existing runs
    const { data: runsData } = await supabase
      .from('experiment_runs')
      .select('*, persona:personas(*)')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: true })

    const fetchedRuns = (runsData as (ExperimentRun & { persona: Persona })[]) || []
    setRuns(fetchedRuns)
    
    // For completed experiments, reconstruct logs from runs data
    if (exp.status === 'completed' && fetchedRuns.length > 0) {
      const reconstructedLogs: LogEntry[] = []
      const personaMap = new Map<string, Persona>()
      
      // First pass: collect persona data
      fetchedRuns.forEach((run) => {
        if (run.persona) {
          personaMap.set(run.persona_id, run.persona)
        }
      })
      
      // Group runs by persona
      const runsByPersona = new Map<string, (ExperimentRun & { persona: Persona })[]>()
      fetchedRuns.forEach((run) => {
        const existing = runsByPersona.get(run.persona_id) || []
        existing.push(run)
        runsByPersona.set(run.persona_id, existing)
      })
      
      // Generate logs for each persona's runs
      runsByPersona.forEach((personaRuns, personaId) => {
        const persona = personaMap.get(personaId)
        if (!persona) return
        
        reconstructedLogs.push({
          id: `start-${personaId}`,
          timestamp: new Date(personaRuns[0].created_at),
          persona,
          message: `Started analysis for ${persona.name}`,
          type: 'action',
        })
        
        personaRuns.forEach((run) => {
          const runCreatedAt = new Date(run.created_at)
          
          // Add experience logs if available (for live URL tests)
          const experienceLogs = (run.logs as any)?.experience_logs || []
          if (experienceLogs.length > 0) {
            experienceLogs.forEach((expLog: any, idx: number) => {
              // Parse the timestamp from experience log or create incremental timestamps
              const logTime = new Date(runCreatedAt.getTime() + (idx * 2000)) // 2 seconds between logs
              
              reconstructedLogs.push({
                id: `exp-${run.id}-${idx}-action`,
                timestamp: logTime,
                persona,
                message: `Step ${expLog.step}: ${expLog.action}`,
                type: 'action',
              })
              
              if (expLog.observation) {
                reconstructedLogs.push({
                  id: `exp-${run.id}-${idx}-obs`,
                  timestamp: new Date(logTime.getTime() + 500),
                  persona,
                  message: expLog.observation,
                  type: 'observation',
                })
              }
            })
          }
          
          // Add final result
          if (run.success) {
            reconstructedLogs.push({
              id: `success-${run.id}`,
              timestamp: new Date(runCreatedAt.getTime() + (experienceLogs.length * 2000) + 1000),
              persona,
              message: `Run ${run.run_number}: Task completed successfully`,
              type: 'success',
            })
          } else {
            reconstructedLogs.push({
              id: `fail-${run.id}`,
              timestamp: new Date(runCreatedAt.getTime() + (experienceLogs.length * 2000) + 1000),
              persona,
              message: `Run ${run.run_number}: ${run.struggle_point || 'Task failed'}`,
              type: 'error',
            })
            if (run.reason) {
              reconstructedLogs.push({
                id: `reason-${run.id}`,
                timestamp: new Date(runCreatedAt.getTime() + (experienceLogs.length * 2000) + 2000),
                persona,
                message: `Reason: ${run.reason}`,
                type: 'decision',
              })
            }
          }
        })
      })
      
      // Sort by timestamp
      reconstructedLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      setLogs(reconstructedLogs)
      
      // For live_url and screenshots experiments, also initialize the parallel runs store
      const expInputMode = exp.input_mode || 'live_url'
      if (expInputMode === 'live_url' || expInputMode === 'screenshots') {
        // Prepare runs data for parallel store initialization
        const runsForStore = fetchedRuns.map(run => ({
          id: run.id,
          persona_id: run.persona_id,
          run_number: run.run_number,
          success: run.success,
          logs: run.logs,
          created_at: run.created_at,
          persona: run.persona,
        }))
        parallelRuns.initializeFromCompletedRuns(runsForStore)
      }
    }
    
    setIsLoading(false)
  }, [experimentId, router])

  useEffect(() => {
    fetchExperiment()
  }, [fetchExperiment])

  // Reset parallel runs store when experiment changes or on unmount
  useEffect(() => {
    return () => {
      parallelRuns.reset()
    }
  }, [experimentId])

  // Auto-start experiment if coming from launch
  useEffect(() => {
    if (
      shouldAutoStart &&
      !hasAutoStartedRef.current &&
      experiment?.status === 'queued' &&
      personas.length > 0 &&
      !isRunning
    ) {
      hasAutoStartedRef.current = true
      // Remove autostart from URL without reloading
      router.replace(`/experiments/${experimentId}`, { scroll: false })
      // Small delay to ensure UI is ready
      setTimeout(() => {
        runExperiment()
      }, 500)
    }
  }, [shouldAutoStart, experiment?.status, personas.length, isRunning, router, experimentId])

  const addLog = (persona: Persona, message: string, type: LogEntry['type']) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      persona,
      message,
      type,
    }
    setLogs((prev) => [...prev, newLog])
  }

  const runExperiment = async () => {
    if (!experiment || personas.length === 0) return

    setIsRunning(true)
    setLogs([])
    setProgress(0)
    setProgressStatus('')
    setRuns([]) // Clear previous runs from state
    parallelRuns.reset() // Clear parallel runs store
    runProgressRef.current.clear() // Clear per-run progress tracking
    abortControllerRef.current = new AbortController()

    const supabase = createClient()

    // Clear previous runs from database (for re-running aborted experiments)
    const { error: deleteError } = await supabase
      .from('experiment_runs')
      .delete()
      .eq('experiment_id', experimentId)
    
    if (deleteError) {
      console.warn('[Experiment] Failed to clear previous runs:', deleteError)
    }

    // Update experiment status
    await supabase
      .from('experiments')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', experimentId)

    setExperiment((prev) => prev ? { ...prev, status: 'running' } : null)

    const inputLinks = experiment.input_links as { control?: string; variant?: string; single?: string }
    const screenshots = (experiment.screenshots as unknown as ExperimentScreenshot[]) || []
    const inputMode: string = experiment.input_mode || 'live_url'
    const targetUrl = inputLinks.single || inputLinks.control || ''

    // Calculate total runs for progress tracking
    const totalRuns = personas.reduce((sum, persona) => 
      sum + (personaRunCounts[persona.id] || 1), 0)
    let completedRuns = 0

    try {
      // ============================================
      // PARALLEL EXECUTION MODE (always used for live_url and screenshots)
      // ============================================
      if (inputMode === 'live_url' || inputMode === 'screenshots') {
        // Initialize parallel runs store
        const personaConfigs = personas.map(persona => ({
          persona,
          runsCount: personaRunCounts[persona.id] || 1,
        }))
        parallelRuns.initializeRuns(personaConfigs)

        // Call parallel API with SSE
        const response = await fetch('/api/experiments/run-parallel', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            experimentId,
            inputMode,
            url: targetUrl,
            script: experiment.script,
            hypothesis: experiment.hypothesis,
            personas: personaConfigs,
            screenshots: inputMode === 'screenshots' ? screenshots : undefined,
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          throw new Error(`Parallel execution failed: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonData = line.substring(6)
                try {
                  const event = JSON.parse(jsonData) as MultiplexedEvent
                  
                  // Update parallel runs store with the event
                  parallelRuns.handleSSEEvent(event)

                  // Update progress based on event type
                  // Track per-run progress to avoid fluctuation in parallel execution
                  const runKey = `${event.personaId}-${event.runNumber}`
                  
                  if (event.eventType === 'progress') {
                    // Update this run's progress (only if it's higher than current - never decrease)
                    const taskProgress = event.data?.taskProgress || 0
                    const currentRunProgress = runProgressRef.current.get(runKey) || 0
                    if (taskProgress > currentRunProgress) {
                      runProgressRef.current.set(runKey, taskProgress)
                    }
                    
                    // Calculate total progress from all runs
                    let totalProgress = 0
                    runProgressRef.current.forEach((p) => {
                      totalProgress += p
                    })
                    // Each run contributes equally to total progress
                    const newProgress = Math.min(99, totalProgress / totalRuns)
                    setProgress((prev) => Math.max(prev, newProgress)) // Never decrease
                    setProgressStatus('Analysis in progress...')
                  } else if (event.eventType === 'complete' || event.eventType === 'error') {
                    // Mark this run as 100% complete
                    runProgressRef.current.set(runKey, 100)
                    completedRuns++
                    
                    // Calculate total progress
                    let totalProgress = 0
                    runProgressRef.current.forEach((p) => {
                      totalProgress += p
                    })
                    const newProgress = Math.min(99, totalProgress / totalRuns)
                    setProgress((prev) => Math.max(prev, newProgress)) // Never decrease
                    setProgressStatus(`Completed ${completedRuns}/${totalRuns} runs`)

                    // Save run to database
                    if (event.eventType === 'complete' && event.data?.result) {
                      const result = event.data.result
                      const { data: runData } = await supabase
                        .from('experiment_runs')
                        .insert({
                          experiment_id: experimentId,
                          persona_id: event.personaId,
                          run_number: event.runNumber,
                          success: result.success,
                          struggle_point: result.struggle_point,
                          reason: result.reason,
                          suggested_fix: result.suggested_fix,
                          duration_ms: result.duration_ms,
                          recording_url: result.recordingUrl || null,
                          recording_expires_at: result.recordingExpiresAt || null,
                          interaction_screenshots: result.interactionScreenshots || [],
                          logs: {
                            simple_logs: result.logs || [],
                            experience_logs: result.experienceLogs || result.experience_logs || [],
                            insights: result.insights || [],
                            recommendations: result.recommendations || [],
                            screenshot_issues: result.screenshot_issues || [],
                          },
                          llm_usage: result.llm_usage || null,
                        })
                        .select()
                        .single()

                      if (runData) {
                        setRuns((prev) => [...prev, runData])
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        }
      }
      // ============================================
      // SEQUENTIAL EXECUTION MODE (Legacy)
      // ============================================
      // Handle Live URL mode with browser automation
      else if (inputMode === 'live_url') {
        for (let i = 0; i < personas.length; i++) {
          if (abortControllerRef.current?.signal.aborted) break

          const persona = personas[i]
          const runsPerPersona = personaRunCounts[persona.id] || 1

          addLog(persona, `Starting live browser testing for ${persona.name}...`, 'action')

          for (let runNum = 1; runNum <= runsPerPersona; runNum++) {
            if (abortControllerRef.current?.signal.aborted) break

            addLog(persona, `Run ${runNum}/${runsPerPersona}: Launching browser and navigating to https://${targetUrl}`, 'action')

            try {
              // Call browser-analyze API with SSE
              const response = await fetch('/api/ai/browser-analyze', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                  url: targetUrl,
                  script: experiment.script,
                  hypothesis: experiment.hypothesis,
                  persona,
                  experimentId,
                  runNumber: runNum,
                }),
                signal: abortControllerRef.current?.signal,
              })

              if (!response.ok) {
                throw new Error(`Browser analysis failed: ${response.statusText}`)
              }

              const reader = response.body?.getReader()
              const decoder = new TextDecoder()

              if (reader) {
                let result: any = null

                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  const chunk = decoder.decode(value)
                  const lines = chunk.split('\n')

                  for (const line of lines) {
                    if (line.startsWith('event: progress')) {
                      // Next line should be data
                      continue
                    }
                    if (line.startsWith('data: ')) {
                      const jsonData = line.substring(6)
                      try {
                        const progress = JSON.parse(jsonData) as BrowserTestProgress
                        
                        if (progress.type === 'action' || progress.type === 'step') {
                          addLog(persona, `Step ${progress.step}: ${progress.action}`, 'action')
                          if (progress.observation) {
                            addLog(persona, progress.observation, 'observation')
                          }
                        } else if (progress.type === 'screenshot') {
                          addLog(persona, `Captured screenshot at step ${progress.step}`, 'observation')
                        } else if (progress.type === 'error') {
                          addLog(persona, `Error: ${progress.error}`, 'error')
                        }

                        if (progress.taskProgress) {
                          const runProgress = ((completedRuns + (progress.taskProgress / 100)) / totalRuns) * 100
                          setProgress(runProgress)
                        }
                      } catch (e) {
                        // Ignore parse errors for incomplete chunks
                      }
                    }
                    if (line.startsWith('event: complete')) {
                      // Next line should be data with result
                      continue
                    }
                    if (line.includes('"type":"result"')) {
                      try {
                        const parsed = JSON.parse(line.substring(6))
                        result = parsed.data
                      } catch (e) {
                        // Try to find result in the line
                      }
                    }
                  }
                }

                // Process final result
                if (result) {
                  if (result.success) {
                    addLog(persona, 'Live browser test completed successfully!', 'success')
                  } else {
                    addLog(persona, `Struggle point: ${result.struggle_point}`, 'error')
                    addLog(persona, `Reason: ${result.reason}`, 'decision')
                  }

                  // Save run to database with recording data
                  const { data: runData } = await supabase
                    .from('experiment_runs')
                    .insert({
                      experiment_id: experimentId,
                      persona_id: persona.id,
                      run_number: runNum,
                      success: result.success,
                      struggle_point: result.struggle_point,
                      reason: result.reason,
                      suggested_fix: result.suggested_fix,
                      duration_ms: result.duration_ms,
                      recording_url: result.recordingUrl,
                      recording_expires_at: result.recordingExpiresAt,
                      interaction_screenshots: result.interactionScreenshots || [],
                      logs: {
                        simple_logs: [],
                        experience_logs: result.experienceLogs || [],
                        insights: result.insights || [],
                        recommendations: result.recommendations || [],
                        screenshot_issues: [],
                      },
                    })
                    .select()
                    .single()

                  if (runData) {
                    setRuns((prev) => [...prev, runData])
                  }
                }
              }
            } catch (error) {
              if ((error as Error).name === 'AbortError') {
                throw error
              }
              addLog(persona, `Browser test failed: ${(error as Error).message}`, 'error')
            }

            completedRuns++
            setProgress((completedRuns / totalRuns) * 100)
          }
        }
      } else {
        // Original logic for url and screenshots modes
        for (let i = 0; i < personas.length; i++) {
          if (abortControllerRef.current?.signal.aborted) break

          const persona = personas[i]
          const runsPerPersona = personaRunCounts[persona.id] || 1

          addLog(persona, `Starting analysis for ${persona.name}...`, 'action')

          for (let runNum = 1; runNum <= runsPerPersona; runNum++) {
            if (abortControllerRef.current?.signal.aborted) break

            if (inputMode === 'screenshots') {
              addLog(persona, `Run ${runNum}/${runsPerPersona}: Analyzing ${screenshots.length} screenshots...`, 'action')
            } else {
              addLog(persona, `Run ${runNum}/${runsPerPersona}: Navigating to https://${targetUrl}`, 'action')
            }
            await new Promise((r) => setTimeout(r, 500))

            addLog(persona, inputMode === 'screenshots' 
              ? 'Examining visual elements and layout...' 
              : 'Analyzing page structure and elements...', 'observation')
            await new Promise((r) => setTimeout(r, 800))

            addLog(persona, `Executing script: "${experiment.script?.substring(0, 50)}..."`, 'action')
            await new Promise((r) => setTimeout(r, 1000))

            // Call AI API with appropriate mode
            const response = await fetch('/api/ai/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: targetUrl,
                controlUrl: inputLinks.control,
                variantUrl: inputLinks.variant,
                script: experiment.script,
                hypothesis: experiment.hypothesis,
                persona,
                inputMode,
                experimentType: experiment.type,
                screenshots: inputMode === 'screenshots' ? screenshots : undefined,
              }),
              signal: abortControllerRef.current?.signal,
            })

            const result = await response.json()

            if (result.success) {
              addLog(persona, 'Task completed successfully!', 'success')
            } else {
              addLog(persona, `Struggle point: ${result.struggle_point}`, 'error')
              addLog(persona, `Reason: ${result.reason}`, 'decision')
            }

            // Save run to database with enhanced data
            const { data: runData } = await supabase
              .from('experiment_runs')
              .insert({
                experiment_id: experimentId,
                persona_id: persona.id,
                run_number: runNum,
                success: result.success,
                struggle_point: result.struggle_point,
                reason: result.reason,
                suggested_fix: result.suggested_fix,
                duration_ms: result.duration_ms,
                logs: {
                  // Legacy format for backward compatibility
                  simple_logs: result.logs || [],
                  // Enhanced structured data
                  experience_logs: result.experience_logs || [],
                  insights: result.insights || [],
                  recommendations: result.recommendations || [],
                  screenshot_issues: result.screenshot_issues || [],
                },
              })
              .select()
              .single()

            if (runData) {
              setRuns((prev) => [...prev, runData])
            }

            completedRuns++
            setProgress((completedRuns / totalRuns) * 100)
            await new Promise((r) => setTimeout(r, 500))
          }
        }
      }

      // Check if aborted before running aggregation
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[Experiment] Skipping aggregation - experiment was aborted')
        return
      }

      // Start aggregation phase
      setIsAggregating(true)
      setProgressStatus('Generating report...')

      // Generate aggregated findings
      addLog(personas[0], 'Aggregating findings across all personas...', 'observation')

      const { data: allRuns } = await supabase
        .from('experiment_runs')
        .select('*')
        .eq('experiment_id', experimentId)

      // Skip aggregation if no runs completed (all were aborted/cleaned up)
      if (!allRuns || allRuns.length === 0) {
        console.log('[Experiment] No runs to aggregate - experiment may have been aborted')
        setIsAggregating(false)
        return
      }

      // Call aggregation API
      const aggResponse = await fetch('/api/ai/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runs: allRuns,
          personas,
        }),
      })

      const aggregated = await aggResponse.json()

      // Save findings
      if (aggregated.findings && aggregated.findings.length > 0) {
        console.log('[Experiment] Saving', aggregated.findings.length, 'findings to database...')
        
        for (const finding of aggregated.findings) {
          const findingData: any = {
            experiment_id: experimentId,
            title: finding.title,
            explanation: finding.explanation,
            suggested_fix: finding.suggested_fix,
            confidence: finding.confidence,
            frequency: finding.frequency,
          }
          
          // Add severity if it exists (backward compatible)
          if ((finding as any).severity) {
            findingData.severity = (finding as any).severity
          }
          
          const { error: findingError } = await supabase.from('findings').insert(findingData)
          
          if (findingError) {
            console.error('[Experiment] Error saving finding:', findingError)
        }
        }
        
        console.log('[Experiment] All findings saved successfully')
      } else {
        console.log('[Experiment] No findings to save (aggregated.findings is empty or null)')
      }

      // For URL-based experiments (live_url or url mode), get a screenshot from runs for the thumbnail
      let thumbnailUrl = experiment.thumbnail_url
      
      // Check if this is a URL-based experiment (not screenshots mode) and has runs with interaction screenshots
      const isUrlBasedExperiment = inputMode === 'live_url'
      if (isUrlBasedExperiment && allRuns && allRuns.length > 0) {
        // Find any run with interaction screenshots
        const runWithScreenshots = allRuns.find(
          (r: any) => r.interaction_screenshots && Array.isArray(r.interaction_screenshots) && r.interaction_screenshots.length > 0
        )
        if (runWithScreenshots) {
          const runScreenshots = (runWithScreenshots as any).interaction_screenshots as any[]
          // Pick a screenshot from the middle (skip first few which might be blank/loading)
          const validScreenshots = runScreenshots.filter((s: any) => s.url && s.url.length > 0)
          console.log('[Experiment] Found', validScreenshots.length, 'valid screenshots for thumbnail')
          if (validScreenshots.length > 0) {
            // Pick from middle of the screenshots (skip first 2 if possible, as they might be loading states)
            const startIndex = Math.min(2, Math.floor(validScreenshots.length / 3))
            const endIndex = Math.min(validScreenshots.length - 1, startIndex + 5)
            const randomIndex = startIndex + Math.floor(Math.random() * (endIndex - startIndex + 1))
            thumbnailUrl = validScreenshots[randomIndex]?.url || validScreenshots[0]?.url || null
            console.log('[Experiment] Selected thumbnail:', thumbnailUrl)
          }
        } else {
          console.log('[Experiment] No runs found with interaction screenshots')
        }
      }

      // Compute total LLM usage across all runs + aggregation
      const runUsageSummaries = (allRuns || [])
        .map((r: any) => r.llm_usage as LlmUsageCompact | null)
        .filter((u): u is LlmUsageCompact => !!u)
      const experimentLlmUsage = combineUsageSummaries(
        runUsageSummaries,
        aggregated.llm_usage || undefined
      )

      // Update experiment with results (including new positiveFindings)
      await supabase
        .from('experiments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          thumbnail_url: thumbnailUrl,
          results: {
            success_rate: aggregated.success_rate,
            avg_duration_ms: aggregated.avg_duration_ms,
            ux_score: aggregated.ux_score,
            total_runs: allRuns?.length || 0,
            total_failures: allRuns?.filter((r) => !r.success).length || 0,
            summary: aggregated.summary,
            recommendations: aggregated.recommendations,
            positiveFindings: aggregated.positiveFindings,
          },
          llm_usage: experimentLlmUsage,
        })
        .eq('id', experimentId)

      setExperiment((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              results: {
                success_rate: aggregated.success_rate,
                avg_duration_ms: aggregated.avg_duration_ms,
                ux_score: aggregated.ux_score,
              },
            }
          : null
      )

      // Finalize states
      setProgress(100)
      setIsRunning(false)
      setIsAggregating(false)
      setProgressStatus('')

      toast.success('Experiment completed!')

      // Send experiment completion email (non-blocking)
      fetch('/api/email/experiment-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      }).catch((err) => {
        console.error('[Experiment] Failed to send completion email:', err)
      })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Abort is handled by abortExperiment function, don't show duplicate toast
        console.log('[Experiment] Caught AbortError in runExperiment')
      } else {
        toast.error('Experiment failed')
        await supabase
          .from('experiments')
          .update({ status: 'failed' })
          .eq('id', experimentId)
        setIsRunning(false)
        setIsAggregating(false)
        setProgress(0)
        setProgressStatus('')
      }
    }
  }

  const abortExperiment = async () => {
    console.log('[Experiment] Aborting experiment...')
    
    // Abort the fetch request
    abortControllerRef.current?.abort()
    
    // Call the DELETE endpoint to abort server-side runs and clean up data
    try {
      await fetch('/api/experiments/run-parallel', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      })
      console.log('[Experiment] Server-side runs aborted and data cleaned up')
    } catch (e) {
      console.error('[Experiment] Failed to abort server-side runs:', e)
    }
    
    // Reset parallel runs store
    parallelRuns.reset()
    
    // Clear runs from local state
    setRuns([])
    setLogs([])
    
    // Update experiment status
    const supabase = createClient()
    await supabase
      .from('experiments')
      .update({ status: 'queued' })
      .eq('id', experimentId)
    
    setExperiment((prev) => prev ? { ...prev, status: 'queued' } : null)
    setIsRunning(false)
    setIsAggregating(false)
    setProgress(0)
    setProgressStatus('')
    runProgressRef.current.clear()
    toast.info('Experiment aborted - all data cleaned up')
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <div className="border-b bg-card px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-64 bg-muted animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
              <div className="h-9 w-32 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Console Skeleton */}
            <div className="lg:col-span-2 min-h-[600px] rounded-xl border bg-[#1a1a2e] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/40" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
                <div className="h-3 w-3 rounded-full bg-green-500/40" />
                <div className="h-4 w-40 bg-gray-700 animate-pulse rounded ml-2" />
              </div>
              <div className="space-y-3 pt-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ opacity: 1 - i * 0.1 }}>
                    <div className="h-3 w-16 bg-gray-700 animate-pulse rounded" />
                    <div className="h-6 w-6 bg-gray-700 animate-pulse rounded-full" />
                    <div className="h-3 bg-gray-700 animate-pulse rounded" style={{ width: `${Math.random() * 40 + 40}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Cards Skeleton */}
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!experiment) {
    return null
  }

  const inputLinks = experiment.input_links as { control?: string; variant?: string; single?: string }
  const screenshots = (experiment.screenshots as unknown as ExperimentScreenshot[]) || []
  const inputMode: string = experiment.input_mode || 'live_url'
  const successCount = runs.filter((r) => r.success).length
  const failCount = runs.filter((r) => !r.success).length
  const successRate = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card px-4 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/experiments">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{experiment.name}</h1>
                <Badge
                  variant={
                    experiment.status === 'completed'
                      ? 'default'
                      : experiment.status === 'running'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {experiment.status === 'running' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                  )}
                  {experiment.status}
                </Badge>
                <Badge variant="outline">
                  {inputMode === 'screenshots' ? (
                    <><ImageIcon className="h-3 w-3 mr-1" /> Screenshots</>
                  ) : inputMode === 'live_url' ? (
                    <><Globe className="h-3 w-3 mr-1" /> Live URL</>
                  ) : (
                    <><LinkIcon className="h-3 w-3 mr-1" /> URL</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                {inputMode === 'screenshots' ? (
                  <span>{screenshots.length} screenshots</span>
                ) : (
                  <a 
                    href={`https://${inputLinks.single || inputLinks.control}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary hover:underline transition-colors"
                  >
                    <span>Target: {inputLinks.single || inputLinks.control}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Clone Button - always visible */}
            <CloneExperimentDialog experiment={experiment}>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Clone
              </Button>
            </CloneExperimentDialog>

            {experiment.status === 'queued' && (
              <Button onClick={runExperiment} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                Start Experiment
              </Button>
            )}
            {experiment.status === 'running' && isRunning && (
              <Button variant="destructive" onClick={abortExperiment}>
                <Square className="h-4 w-4 mr-2" />
                Abort
              </Button>
            )}
            {experiment.status === 'completed' && (
              <Link href={`/experiments/${experimentId}/report`}>
                <Button>View Full Report</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(isRunning || isAggregating) && (
        <div className="px-4 lg:px-8 py-2 bg-muted/50">
          <div className="flex items-center gap-4">
            {isAggregating ? (
              // Indeterminate progress during aggregation
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-full" />
              </div>
            ) : (
              <Progress value={progress} className="flex-1 h-2" />
            )}
            <div className="flex items-center gap-2 min-w-[180px] justify-end">
              {isAggregating && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              <span className="text-sm font-medium">
                {isAggregating 
                  ? 'Generating report...' 
                  : progressStatus || `${Math.round(progress)}%`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Side - Console */}
          <div className="lg:col-span-2 min-h-[600px]">
            {(inputMode === 'live_url' || inputMode === 'screenshots') ? (
              <ParallelAgentConsole />
            ) : (
              <AgentConsole logs={logs} isRunning={isRunning} />
            )}
          </div>

          {/* Right Side - Stats */}
          <div className="space-y-6">
            {/* Research Goal Card */}
            {experiment.hypothesis && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Research Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderSimpleMarkdown(experiment.hypothesis)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions Card */}
            {experiment.script && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {experiment.script}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Screenshots Preview (if screenshot mode) */}
            {inputMode === 'screenshots' && screenshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Screenshots ({screenshots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {screenshots.slice(0, 3).map((screenshot, index) => (
                      <div key={screenshot.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={screenshot.url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {screenshots.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      +{screenshots.length - 3} more
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{successCount}</p>
                      <p className="text-xs text-muted-foreground">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{failCount}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* LLM API Cost (dev-only observability) */}
            {experiment.llm_usage && (
              <Card className="border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold">
                          ${(experiment.llm_usage as any).total_cost_usd?.toFixed(4) || '0.0000'}
                        </p>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">DEV</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(experiment.llm_usage as any).total_llm_calls || 0} API calls &middot; {(
                          ((experiment.llm_usage as any).total_input_tokens || 0) +
                          ((experiment.llm_usage as any).total_output_tokens || 0)
                        ).toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Personas ({personas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {personas.map((persona) => {
                  const personaRuns = runs.filter((r) => r.persona_id === persona.id)
                  const personaSuccess = personaRuns.filter((r) => r.success).length
                  return (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {persona.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{persona.name}</span>
                      </div>
                      <Badge variant="outline">
                        {personaSuccess}/{personaRuns.length}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {runs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Recent Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {runs
                    .filter((r) => !r.success && r.struggle_point)
                    .slice(-3)
                    .map((run) => (
                      <div key={run.id} className="p-2 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs font-medium text-red-700">{run.struggle_point}</p>
                        <p className="text-xs text-red-600 mt-1 line-clamp-2">{run.reason}</p>
                      </div>
                    ))}
                  {runs.filter((r) => !r.success).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No issues found yet
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {experiment.status === 'completed' && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-primary">{successRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <Link href={`/experiments/${experimentId}/report`}>
                    <Button className="mt-4 w-full">View Full Report</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
