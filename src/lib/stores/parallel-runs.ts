/**
 * Parallel Runs Store
 * 
 * Zustand store for managing parallel experiment run state,
 * including per-persona logs and progress tracking.
 */

import { create } from 'zustand'
import { Persona } from '@/types/database'
import { MultiplexedEvent } from '@/lib/sse-multiplexer'

// Log entry for console display
export interface ParallelLogEntry {
  id: string
  runId: string
  personaId: string
  personaName: string
  runNumber: number
  timestamp: Date
  message: string
  type: 'action' | 'observation' | 'decision' | 'error' | 'success'
}

// Run state
export interface RunState {
  runId: string
  personaId: string
  personaName: string
  runNumber: number
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
}

// Persona summary for tabs
export interface PersonaSummary {
  personaId: string
  personaName: string
  persona: Persona
  totalRuns: number
  completedRuns: number
  successfulRuns: number
  failedRuns: number
  status: 'pending' | 'running' | 'completed' | 'error'
}

// Store state interface
export interface ParallelRunsState {
  // State
  runs: Map<string, RunState>
  logs: ParallelLogEntry[]
  runsByPersona: Map<string, string[]>
  personas: Map<string, Persona>
  activePersonaId: string | null
  activeRunId: string | null // Track selected run within persona
  completedCount: number
  totalCount: number
  isRunning: boolean
  aggregationMessage: string | null
  
  // Actions
  initializeRuns: (personaConfigs: Array<{ persona: Persona; runsCount: number }>) => void
  initializeFromCompletedRuns: (runs: Array<{ 
    id: string
    persona_id: string
    run_number: number
    success: boolean
    logs: any
    created_at: string
    persona: Persona
  }>) => void
  handleSSEEvent: (event: MultiplexedEvent) => void
  addLog: (log: Omit<ParallelLogEntry, 'id' | 'timestamp'>) => void
  setActivePersona: (personaId: string | null) => void
  setActiveRun: (runId: string | null) => void
  setRunning: (isRunning: boolean) => void
  
  // Selectors (computed values as methods)
  getLogsForPersona: (personaId: string | null) => ParallelLogEntry[]
  getLogsForRun: (runId: string | null) => ParallelLogEntry[]
  getPersonaSummaries: () => PersonaSummary[]
  getRunsForPersona: (personaId: string) => RunState[]
  getAllResults: () => Array<{ runId: string; result: any }>
  
  // Reset
  reset: () => void
}

const initialState = {
  runs: new Map<string, RunState>(),
  logs: [] as ParallelLogEntry[],
  runsByPersona: new Map<string, string[]>(),
  personas: new Map<string, Persona>(),
  activePersonaId: null as string | null,
  activeRunId: null as string | null,
  completedCount: 0,
  totalCount: 0,
  isRunning: false,
  aggregationMessage: null as string | null,
}

export const useParallelRuns = create<ParallelRunsState>((set, get) => ({
  ...initialState,

  initializeRuns: (personaConfigs) => {
    const runs = new Map<string, RunState>()
    const runsByPersona = new Map<string, string[]>()
    const personas = new Map<string, Persona>()
    let totalCount = 0

    for (const { persona, runsCount } of personaConfigs) {
      personas.set(persona.id, persona)
      const personaRunIds: string[] = []

      for (let runNum = 1; runNum <= runsCount; runNum++) {
        const runId = `${persona.id}-run-${runNum}`
        runs.set(runId, {
          runId,
          personaId: persona.id,
          personaName: persona.name,
          runNumber: runNum,
          status: 'pending',
          progress: 0,
        })
        personaRunIds.push(runId)
        totalCount++
      }

      runsByPersona.set(persona.id, personaRunIds)
    }

    // Set the first persona and first run as active by default
    const firstPersonaId = personaConfigs.length > 0 ? personaConfigs[0].persona.id : null
    const firstRunId = firstPersonaId ? `${firstPersonaId}-run-1` : null

    set({
      runs,
      runsByPersona,
      personas,
      totalCount,
      completedCount: 0,
      activePersonaId: firstPersonaId,
      activeRunId: firstRunId,
      logs: [],
      isRunning: true,
      aggregationMessage: null,
    })
  },

  initializeFromCompletedRuns: (completedRuns) => {
    const runs = new Map<string, RunState>()
    const runsByPersona = new Map<string, string[]>()
    const personas = new Map<string, Persona>()
    const logs: ParallelLogEntry[] = []
    let totalCount = 0

    // Group runs by persona
    const personaRunsMap = new Map<string, typeof completedRuns>()
    for (const run of completedRuns) {
      if (!run.persona) continue
      
      personas.set(run.persona_id, run.persona)
      const existing = personaRunsMap.get(run.persona_id) || []
      existing.push(run)
      personaRunsMap.set(run.persona_id, existing)
    }

    // Process each persona's runs
    personaRunsMap.forEach((personaRuns, personaId) => {
      const persona = personas.get(personaId)
      if (!persona) return

      const personaRunIds: string[] = []

      // Sort runs by run_number, then by created_at to handle duplicates
      personaRuns.sort((a, b) => a.run_number - b.run_number || a.created_at.localeCompare(b.created_at))

      // Deduplicate: keep only the latest run per run_number
      const seenRunNumbers = new Set<number>()
      const deduplicatedRuns = personaRuns.filter((run) => {
        if (seenRunNumbers.has(run.run_number)) {
          return false // Skip duplicate run_number
        }
        seenRunNumbers.add(run.run_number)
        return true
      })

      for (const run of deduplicatedRuns) {
        // Use the database ID to guarantee uniqueness
        const runId = `${personaId}-run-${run.run_number}-${run.id}`
        const runCreatedAt = new Date(run.created_at)
        
        // Add run state
        runs.set(runId, {
          runId,
          personaId: persona.id,
          personaName: persona.name,
          runNumber: run.run_number,
          status: run.success ? 'completed' : 'error',
          progress: 100,
          result: run,
          completedAt: runCreatedAt,
        })
        personaRunIds.push(runId)
        totalCount++

        // Extract logs from the run data
        const runLogs = run.logs || {}
        const experienceLogs = runLogs.experience_logs || []
        const insights = runLogs.insights || []

        // Add experience logs
        experienceLogs.forEach((expLog: any, idx: number) => {
          const logTime = new Date(runCreatedAt.getTime() + (idx * 2000))
          
          logs.push({
            id: `${runId}-exp-${idx}`,
            runId,
            personaId,
            personaName: persona.name,
            runNumber: run.run_number,
            timestamp: logTime,
            message: `Step ${expLog.step || idx + 1}: ${expLog.action || 'Action'}`,
            type: 'action',
          })

          if (expLog.observation) {
            logs.push({
              id: `${runId}-obs-${idx}`,
              runId,
              personaId,
              personaName: persona.name,
              runNumber: run.run_number,
              timestamp: new Date(logTime.getTime() + 500),
              message: expLog.observation,
              type: 'observation',
            })
          }
        })

        // Add completion log
        logs.push({
          id: `${runId}-complete`,
          runId,
          personaId,
          personaName: persona.name,
          runNumber: run.run_number,
          timestamp: new Date(runCreatedAt.getTime() + experienceLogs.length * 2000 + 1000),
          message: run.success ? 'Task completed successfully!' : `Failed: ${run.logs?.struggle_point || 'Unknown error'}`,
          type: run.success ? 'success' : 'error',
        })
      }

      runsByPersona.set(personaId, personaRunIds)
    })

    // Sort logs by timestamp
    logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Set the first persona and first run as active by default
    const firstPersonaId = completedRuns.length > 0 ? completedRuns[0].persona_id : null
    const firstRunId = firstPersonaId ? (runsByPersona.get(firstPersonaId)?.[0] || null) : null

    set({
      runs,
      runsByPersona,
      personas,
      totalCount,
      completedCount: totalCount,
      activePersonaId: firstPersonaId,
      activeRunId: firstRunId,
      logs,
      isRunning: false,
      aggregationMessage: null,
    })
  },

  handleSSEEvent: (event) => {
    const { runId, personaId, personaName, runNumber, eventType, data, timestamp } = event

    set((state) => {
      const newRuns = new Map(state.runs)
      const newLogs = [...state.logs]
      let newCompletedCount = state.completedCount
      let newAggregationMessage = state.aggregationMessage

      // Handle different event types
      switch (eventType) {
        case 'progress': {
          const existingRun = newRuns.get(runId)
          if (existingRun) {
            newRuns.set(runId, {
              ...existingRun,
              status: 'running',
              progress: data.taskProgress || existingRun.progress,
              startedAt: existingRun.startedAt || new Date(timestamp),
            })
          }
          break
        }

        case 'log': {
          const logEntry: ParallelLogEntry = {
            id: `${runId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            runId,
            personaId,
            personaName,
            runNumber,
            timestamp: new Date(timestamp),
            message: data.message,
            type: data.type,
          }
          newLogs.push(logEntry)
          
          // Update run status to running if it was pending
          const run = newRuns.get(runId)
          if (run && run.status === 'pending') {
            newRuns.set(runId, { ...run, status: 'running', startedAt: new Date(timestamp) })
          }
          break
        }

        case 'complete': {
          const existingRun = newRuns.get(runId)
          if (existingRun) {
            newRuns.set(runId, {
              ...existingRun,
              status: 'completed',
              progress: 100,
              result: data.result,
              completedAt: new Date(timestamp),
            })
          }
          newCompletedCount = data.completedCount || newCompletedCount + 1
          break
        }

        case 'error': {
          const existingRun = newRuns.get(runId)
          if (existingRun) {
            newRuns.set(runId, {
              ...existingRun,
              status: 'error',
              error: data.error,
              completedAt: new Date(timestamp),
            })
          }
          newCompletedCount = data.completedCount || newCompletedCount + 1
          
          // Add error to logs
          const errorLog: ParallelLogEntry = {
            id: `${runId}-error-${Date.now()}`,
            runId,
            personaId,
            personaName,
            runNumber,
            timestamp: new Date(timestamp),
            message: `Error: ${data.error}`,
            type: 'error',
          }
          newLogs.push(errorLog)
          break
        }

        case 'aggregation': {
          newAggregationMessage = data.message
          break
        }
      }

      return {
        runs: newRuns,
        logs: newLogs,
        completedCount: newCompletedCount,
        aggregationMessage: newAggregationMessage,
        isRunning: newCompletedCount < state.totalCount,
      }
    })
  },

  addLog: (logData) => {
    const log: ParallelLogEntry = {
      ...logData,
      id: `${logData.runId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    set((state) => ({
      logs: [...state.logs, log],
    }))
  },

  setActivePersona: (personaId) => {
    // When changing persona, also select the first run of that persona
    const { runsByPersona } = get()
    const firstRunId = personaId ? runsByPersona.get(personaId)?.[0] || null : null
    set({ activePersonaId: personaId, activeRunId: firstRunId })
  },

  setActiveRun: (runId) => {
    set({ activeRunId: runId })
  },

  setRunning: (isRunning) => {
    set({ isRunning })
  },

  getLogsForPersona: (personaId) => {
    const { logs } = get()
    if (personaId === null) {
      // Return all logs when no persona is selected (system view)
      return logs
    }
    return logs.filter((log) => log.personaId === personaId)
  },

  getLogsForRun: (runId) => {
    const { logs } = get()
    if (runId === null) {
      // Return all logs when no run is selected
      return logs
    }
    return logs.filter((log) => log.runId === runId)
  },

  getPersonaSummaries: () => {
    const { runs, runsByPersona, personas } = get()
    const summaries: PersonaSummary[] = []

    runsByPersona.forEach((runIds, personaId) => {
      const persona = personas.get(personaId)
      if (!persona) return

      let completedRuns = 0
      let successfulRuns = 0
      let failedRuns = 0
      let hasRunning = false
      let hasError = false

      for (const runId of runIds) {
        const run = runs.get(runId)
        if (!run) continue

        if (run.status === 'completed') {
          completedRuns++
          if (run.result?.success) {
            successfulRuns++
          } else {
            failedRuns++
          }
        } else if (run.status === 'error') {
          completedRuns++
          failedRuns++
          hasError = true
        } else if (run.status === 'running') {
          hasRunning = true
        }
      }

      // Determine overall status
      let status: PersonaSummary['status'] = 'pending'
      if (hasRunning) {
        status = 'running'
      } else if (completedRuns === runIds.length) {
        status = hasError || failedRuns > 0 ? 'error' : 'completed'
      }

      summaries.push({
        personaId,
        personaName: persona.name,
        persona,
        totalRuns: runIds.length,
        completedRuns,
        successfulRuns,
        failedRuns,
        status,
      })
    })

    return summaries
  },

  getRunsForPersona: (personaId) => {
    const { runs, runsByPersona } = get()
    const runIds = runsByPersona.get(personaId) || []
    return runIds.map((runId) => runs.get(runId)).filter((r): r is RunState => !!r)
  },

  getAllResults: () => {
    const { runs } = get()
    const results: Array<{ runId: string; result: any }> = []
    
    runs.forEach((run, runId) => {
      if (run.result) {
        results.push({ runId, result: run.result })
      }
    })
    
    return results
  },

  reset: () => {
    set({
      ...initialState,
      runs: new Map(),
      runsByPersona: new Map(),
      personas: new Map(),
      logs: [],
      activePersonaId: null,
      activeRunId: null,
    })
  },
}))
