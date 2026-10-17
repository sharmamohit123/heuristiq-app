/**
 * Parallel Experiment Execution API
 * 
 * Runs multiple persona tests concurrently with multiplexed SSE progress streaming.
 * Supports both screenshot-based and live URL testing modes.
 * All runs execute truly in parallel (not batched sequentially).
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
import { Persona, ExperimentScreenshot, InputMode } from '@/types/database'
import { runPersonaBrowserTest, browserPool } from '@/lib/browser-automation'
import { analyzeScreenshotsForPersona } from '@/lib/ai'
import { 
  SSEMultiplexer, 
  createSSEHeaders, 
  generateRunId,
} from '@/lib/sse-multiplexer'

// Configuration - increased for truly parallel execution
const MAX_CONCURRENT_BROWSER = 15
const MAX_CONCURRENT_SCREENSHOT = 15

interface PersonaConfig {
  persona: Persona
  runsCount: number
}

interface ParallelRunRequest {
  experimentId: string
  inputMode: InputMode
  url?: string
  script: string
  hypothesis?: string
  personas: PersonaConfig[]
  screenshots?: ExperimentScreenshot[]
  maxConcurrent?: number
}

interface RunTask {
  runId: string
  persona: Persona
  runNumber: number
}

/**
 * Create run tasks from persona configurations
 */
function createRunTasks(personas: PersonaConfig[]): RunTask[] {
  const tasks: RunTask[] = []
  
  for (const { persona, runsCount } of personas) {
    for (let runNum = 1; runNum <= runsCount; runNum++) {
      tasks.push({
        runId: generateRunId(persona.id, runNum),
        persona,
        runNumber: runNum,
      })
    }
  }
  
  return tasks
}

// Track active run promises for cleanup
const activeRunAbortControllers = new Map<string, AbortController>()

export async function POST(request: NextRequest) {
  let multiplexer: SSEMultiplexer | null = null
  const experimentAbortController = new AbortController()
  
  try {
    const body = await request.json() as ParallelRunRequest
    const { 
      experimentId, 
      inputMode, 
      url, 
      script, 
      hypothesis, 
      personas, 
      screenshots,
      maxConcurrent: customMaxConcurrent 
    } = body

    // Validate required fields
    if (!experimentId || !script || !personas || personas.length === 0) {
      return Response.json(
        { error: 'Missing required fields: experimentId, script, and personas are required' },
        { status: 400 }
      )
    }

    if (inputMode === 'live_url' && !url) {
      return Response.json(
        { error: 'URL is required for live_url mode' },
        { status: 400 }
      )
    }

    if (inputMode === 'screenshots' && (!screenshots || screenshots.length === 0)) {
      return Response.json(
        { error: 'Screenshots are required for screenshots mode' },
        { status: 400 }
      )
    }

    // Create run tasks
    const tasks = createRunTasks(personas)
    const totalRuns = tasks.length

    // Check if SSE is requested
    const acceptHeader = request.headers.get('accept')
    const useSSE = acceptHeader?.includes('text/event-stream')

    if (!useSSE) {
      // Non-SSE mode: run all and return final results
      return await runWithoutSSE(tasks, {
        inputMode,
        url,
        script,
        hypothesis,
        experimentId,
        screenshots,
        customMaxConcurrent,
      })
    }

    // SSE mode: stream progress from all parallel runs
    multiplexer = new SSEMultiplexer(totalRuns)
    const stream = multiplexer.createStream()

    // Register all runs
    tasks.forEach(task => multiplexer!.registerRun(task.runId))

    // Handle request abort (client disconnect)
    request.signal.addEventListener('abort', () => {
      console.log('[run-parallel] Client disconnected, aborting all runs')
      experimentAbortController.abort()
      
      // Abort all individual run controllers
      activeRunAbortControllers.forEach((controller, runId) => {
        console.log(`[run-parallel] Aborting run ${runId}`)
        controller.abort()
      })
      activeRunAbortControllers.clear()
      
      // Close the multiplexer
      if (multiplexer) {
        multiplexer.close()
      }
    })

    // Start ALL runs in parallel immediately (not batched)
    executeAllRunsInParallel(
      tasks,
      multiplexer,
      experimentAbortController.signal,
      {
        inputMode,
        url,
        script,
        hypothesis,
        experimentId,
        screenshots,
      }
    )

    return new Response(stream, {
      headers: createSSEHeaders(),
    })

  } catch (error) {
    console.error('[run-parallel] Error:', error)
    experimentAbortController.abort()
    return Response.json(
      { 
        error: 'Failed to start parallel execution',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

interface ExecutionContext {
  inputMode: InputMode
  url?: string
  script: string
  hypothesis?: string
  experimentId: string
  screenshots?: ExperimentScreenshot[]
}

/**
 * Execute ALL runs in parallel immediately (not batched)
 */
async function executeAllRunsInParallel(
  tasks: RunTask[],
  multiplexer: SSEMultiplexer,
  abortSignal: AbortSignal,
  context: ExecutionContext
): Promise<void> {
  const { inputMode, url, script, hypothesis, experimentId, screenshots } = context

  console.log(`[run-parallel] Starting ${tasks.length} runs in parallel`)

  // Create individual abort controllers for each run
  tasks.forEach(task => {
    const controller = new AbortController()
    activeRunAbortControllers.set(task.runId, controller)
    
    // Link to parent abort signal
    abortSignal.addEventListener('abort', () => controller.abort())
  })

  // Start ALL runs at once
  const runPromises = tasks.map(async (task) => {
    const { runId, persona, runNumber } = task
    const runAbortController = activeRunAbortControllers.get(runId)
    
    // Check if already aborted
    if (abortSignal.aborted) {
      multiplexer.sendError(runId, persona.id, persona.name, runNumber, 'Execution aborted')
      return
    }

    // Send start event
    multiplexer.sendLog(
      runId,
      persona.id,
      persona.name,
      runNumber,
      `Starting ${inputMode === 'live_url' ? 'browser test' : 'analysis'}...`,
      'action'
    )

    try {
      let result: any

      if (inputMode === 'live_url') {
        // Browser automation mode
        const targetUrl = url!.startsWith('http') ? url! : `https://${url}`
        
        result = await runPersonaBrowserTest({
          url: targetUrl,
          script,
          hypothesis,
          persona,
          experimentId,
          runNumber,
          abortSignal: runAbortController?.signal,
          onProgress: (progress) => {
            // Check if aborted
            if (abortSignal.aborted || runAbortController?.signal.aborted) {
              return
            }
            
            // Forward progress to multiplexer
            multiplexer.sendProgress(
              runId,
              persona.id,
              persona.name,
              runNumber,
              progress
            )
            
            // Also send as log entries for console display
            if (progress.type === 'action' || progress.type === 'step') {
              multiplexer.sendLog(
                runId,
                persona.id,
                persona.name,
                runNumber,
                `Step ${progress.step}: ${progress.action}`,
                'action'
              )
              if (progress.observation) {
                multiplexer.sendLog(
                  runId,
                  persona.id,
                  persona.name,
                  runNumber,
                  progress.observation,
                  'observation'
                )
              }
            } else if (progress.type === 'error') {
              multiplexer.sendLog(
                runId,
                persona.id,
                persona.name,
                runNumber,
                `Error: ${progress.error}`,
                'error'
              )
            }
          },
        })
        
        // If the run was aborted, don't save it
        if (result?.aborted) {
          multiplexer.sendLog(runId, persona.id, persona.name, runNumber, 'Run aborted - skipping', 'action')
          return
        }
      } else {
        // Check if aborted before screenshot analysis
        if (abortSignal.aborted || runAbortController?.signal.aborted) {
          multiplexer.sendLog(runId, persona.id, persona.name, runNumber, 'Run aborted - skipping', 'action')
          return
        }
        
        // Screenshot analysis mode
        multiplexer.sendLog(
          runId,
          persona.id,
          persona.name,
          runNumber,
          `Analyzing ${screenshots!.length} screenshots...`,
          'observation'
        )
        
        result = await analyzeScreenshotsForPersona({
          script,
          hypothesis,
          persona,
          screenshots: screenshots!,
        })
      }

      // Check if aborted before sending completion
      if (abortSignal.aborted || runAbortController?.signal.aborted) {
        return
      }

      // Send completion event
      const success = result.success === true
      multiplexer.sendLog(
        runId,
        persona.id,
        persona.name,
        runNumber,
        success ? 'Completed successfully!' : `Failed: ${result.struggle_point || result.reason}`,
        success ? 'success' : 'error'
      )
      
      multiplexer.sendRunComplete(
        runId,
        persona.id,
        persona.name,
        runNumber,
        success,
        result
      )

    } catch (error) {
      // Check if it was an abort
      if (abortSignal.aborted || runAbortController?.signal.aborted) {
        multiplexer.sendError(runId, persona.id, persona.name, runNumber, 'Execution aborted')
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[run-parallel] Error in run ${runId}:`, error)
      
      multiplexer.sendError(
        runId,
        persona.id,
        persona.name,
        runNumber,
        errorMessage
      )
    } finally {
      // Cleanup the abort controller
      activeRunAbortControllers.delete(runId)
    }
  })

  // Wait for all runs to complete (they're running in parallel)
  await Promise.allSettled(runPromises)

  // Clear any remaining abort controllers
  activeRunAbortControllers.clear()

  // All runs complete
  if (!abortSignal.aborted) {
    console.log(`[run-parallel] All ${tasks.length} runs complete`)
    multiplexer.sendAggregationProgress('All runs complete. Ready for aggregation.')
  }
  
  multiplexer.close()
}

/**
 * Run without SSE (for programmatic use)
 */
async function runWithoutSSE(
  tasks: RunTask[],
  context: ExecutionContext & { customMaxConcurrent?: number }
): Promise<Response> {
  const { inputMode, url, script, hypothesis, experimentId, screenshots } = context

  const results: Array<{ runId: string; persona: Persona; runNumber: number; result: any }> = []

  // Run all in parallel
  const runPromises = tasks.map(async (task) => {
    const { runId, persona, runNumber } = task
    
    try {
      let result: any

      if (inputMode === 'live_url') {
        const targetUrl = url!.startsWith('http') ? url! : `https://${url}`
        result = await runPersonaBrowserTest({
          url: targetUrl,
          script,
          hypothesis,
          persona,
          experimentId,
          runNumber,
        })
      } else {
        result = await analyzeScreenshotsForPersona({
          script,
          hypothesis,
          persona,
          screenshots: screenshots!,
        })
      }

      return { runId, persona, runNumber, result }
    } catch (error) {
      return {
        runId,
        persona,
        runNumber,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  })

  const settledResults = await Promise.allSettled(runPromises)
  
  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    }
  }

  return Response.json({
    totalRuns: tasks.length,
    completedRuns: results.length,
    results,
  })
}

// GET endpoint to check status
export async function GET() {
  const poolStatus = browserPool.getStatus()
  
  return Response.json({
    endpoint: 'run-parallel',
    description: 'Parallel experiment execution with multiplexed SSE streaming',
    maxConcurrentBrowser: MAX_CONCURRENT_BROWSER,
    maxConcurrentScreenshot: MAX_CONCURRENT_SCREENSHOT,
    browserPool: poolStatus,
    activeRuns: activeRunAbortControllers.size,
  })
}

// DELETE endpoint to abort all runs and clean up data
export async function DELETE(request: NextRequest) {
  console.log('[run-parallel] Aborting all active runs')
  
  // Get experiment ID from request body (optional)
  let experimentId: string | null = null
  try {
    const body = await request.json()
    experimentId = body.experimentId || null
  } catch (e) {
    // No body provided, that's ok
  }
  
  const abortedControllers = activeRunAbortControllers.size
  activeRunAbortControllers.forEach((controller) => {
    controller.abort()
  })
  activeRunAbortControllers.clear()
  
  // Also abort all browser contexts
  let abortedContexts = 0
  try {
    abortedContexts = await browserPool.abortAll()
  } catch (e) {
    console.error('[run-parallel] Error aborting browser pool:', e)
  }
  
  // Clean up Supabase data if experiment ID provided
  let cleanedUp = false
  if (experimentId) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      // Delete all runs for this experiment
      const { error: runsError } = await supabase
        .from('experiment_runs')
        .delete()
        .eq('experiment_id', experimentId)
      
      if (runsError) {
        console.error('[run-parallel] Error deleting runs:', runsError)
      } else {
        console.log('[run-parallel] Deleted runs for experiment:', experimentId)
      }
      
      // Delete recordings from storage
      const recordingPath = `${experimentId}/`
      const { data: files } = await supabase.storage
        .from('experiment-recordings')
        .list(experimentId)
      
      if (files && files.length > 0) {
        // List all files recursively and delete
        const filesToDelete: string[] = []
        for (const file of files) {
          const { data: subFiles } = await supabase.storage
            .from('experiment-recordings')
            .list(`${experimentId}/${file.name}`)
          
          if (subFiles) {
            for (const subFile of subFiles) {
              const { data: deepFiles } = await supabase.storage
                .from('experiment-recordings')
                .list(`${experimentId}/${file.name}/${subFile.name}`)
              
              if (deepFiles) {
                deepFiles.forEach(f => {
                  filesToDelete.push(`${experimentId}/${file.name}/${subFile.name}/${f.name}`)
                })
              }
            }
          }
        }
        
        if (filesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('experiment-recordings')
            .remove(filesToDelete)
          
          if (storageError) {
            console.error('[run-parallel] Error deleting recordings:', storageError)
          } else {
            console.log('[run-parallel] Deleted', filesToDelete.length, 'recordings')
          }
        }
      }
      
      // Delete screenshots from storage
      const { data: screenshotFiles } = await supabase.storage
        .from('experiment-screenshots')
        .list(experimentId)
      
      if (screenshotFiles && screenshotFiles.length > 0) {
        const screenshotPaths = screenshotFiles.map(f => `${experimentId}/${f.name}`)
        await supabase.storage
          .from('experiment-screenshots')
          .remove(screenshotPaths)
        console.log('[run-parallel] Deleted', screenshotPaths.length, 'screenshots')
      }
      
      cleanedUp = true
    } catch (e) {
      console.error('[run-parallel] Error cleaning up Supabase data:', e)
    }
  }
  
  return Response.json({
    message: 'All runs aborted',
    abortedControllers,
    abortedContexts,
    cleanedUp,
    experimentId,
  })
}
