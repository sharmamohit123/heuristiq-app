/**
 * SSE Multiplexer
 * 
 * Utility for streaming progress from multiple parallel runs through a single SSE connection.
 * Each event is tagged with runId and personaId for client-side routing.
 */

import { BrowserTestProgress } from '@/types/database'

// Multiplexed event that wraps individual run events
export interface MultiplexedEvent {
  runId: string           // Unique run identifier (personaId-runNumber)
  personaId: string       // For UI routing to correct console
  personaName: string     // Display name
  runNumber: number       // 1, 2, 3...
  eventType: 'progress' | 'log' | 'complete' | 'error' | 'aggregation'
  data: any               // Actual event payload
  timestamp: number
}

// Log entry for console display
export interface MultiplexedLogEntry {
  id: string
  runId: string
  personaId: string
  personaName: string
  runNumber: number
  timestamp: Date
  message: string
  type: 'action' | 'observation' | 'decision' | 'error' | 'success'
}

// Run completion event
export interface RunCompletionEvent {
  runId: string
  personaId: string
  personaName: string
  runNumber: number
  success: boolean
  result: any
}

/**
 * SSE Multiplexer class for managing multiple concurrent run streams
 */
export class SSEMultiplexer {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null
  private activeRuns = new Map<string, boolean>()
  private completedRuns = 0
  private totalRuns = 0

  constructor(totalRuns: number) {
    this.totalRuns = totalRuns
  }

  /**
   * Create a ReadableStream that can be returned as SSE response
   */
  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller
      },
      cancel: () => {
        this.controller = null
      },
    })
  }

  /**
   * Register a run to track
   */
  registerRun(runId: string): void {
    this.activeRuns.set(runId, true)
  }

  /**
   * Send a multiplexed event to the stream
   */
  sendEvent(event: MultiplexedEvent): void {
    if (!this.controller) return

    const data = JSON.stringify(event)
    this.controller.enqueue(
      this.encoder.encode(`event: ${event.eventType}\ndata: ${data}\n\n`)
    )
  }

  /**
   * Send a progress update from a specific run
   */
  sendProgress(
    runId: string,
    personaId: string,
    personaName: string,
    runNumber: number,
    progress: Partial<BrowserTestProgress>
  ): void {
    this.sendEvent({
      runId,
      personaId,
      personaName,
      runNumber,
      eventType: 'progress',
      data: progress,
      timestamp: Date.now(),
    })
  }

  /**
   * Send a log entry from a specific run
   */
  sendLog(
    runId: string,
    personaId: string,
    personaName: string,
    runNumber: number,
    message: string,
    type: 'action' | 'observation' | 'decision' | 'error' | 'success'
  ): void {
    this.sendEvent({
      runId,
      personaId,
      personaName,
      runNumber,
      eventType: 'log',
      data: { message, type },
      timestamp: Date.now(),
    })
  }

  /**
   * Mark a run as complete
   */
  sendRunComplete(
    runId: string,
    personaId: string,
    personaName: string,
    runNumber: number,
    success: boolean,
    result: any
  ): void {
    this.activeRuns.set(runId, false)
    this.completedRuns++

    this.sendEvent({
      runId,
      personaId,
      personaName,
      runNumber,
      eventType: 'complete',
      data: { success, result, completedCount: this.completedRuns, totalCount: this.totalRuns },
      timestamp: Date.now(),
    })
  }

  /**
   * Send an error from a specific run
   */
  sendError(
    runId: string,
    personaId: string,
    personaName: string,
    runNumber: number,
    error: string
  ): void {
    this.activeRuns.set(runId, false)
    this.completedRuns++

    this.sendEvent({
      runId,
      personaId,
      personaName,
      runNumber,
      eventType: 'error',
      data: { error, completedCount: this.completedRuns, totalCount: this.totalRuns },
      timestamp: Date.now(),
    })
  }

  /**
   * Send aggregation progress
   */
  sendAggregationProgress(message: string): void {
    this.sendEvent({
      runId: 'aggregation',
      personaId: 'system',
      personaName: 'System',
      runNumber: 0,
      eventType: 'aggregation',
      data: { message },
      timestamp: Date.now(),
    })
  }

  /**
   * Check if all runs are complete
   */
  isComplete(): boolean {
    return this.completedRuns >= this.totalRuns
  }

  /**
   * Get completion stats
   */
  getStats(): { completed: number; total: number; active: number } {
    const active = Array.from(this.activeRuns.values()).filter(Boolean).length
    return {
      completed: this.completedRuns,
      total: this.totalRuns,
      active,
    }
  }

  /**
   * Close the stream
   */
  close(): void {
    if (this.controller) {
      // Send final close event
      const closeData = JSON.stringify({
        type: 'stream_close',
        completedRuns: this.completedRuns,
        totalRuns: this.totalRuns,
        timestamp: Date.now(),
      })
      this.controller.enqueue(
        this.encoder.encode(`event: close\ndata: ${closeData}\n\n`)
      )
      this.controller.close()
      this.controller = null
    }
  }
}

/**
 * Helper to create SSE Response headers
 */
export function createSSEHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
}

/**
 * Generate a unique run ID
 */
export function generateRunId(personaId: string, runNumber: number): string {
  return `${personaId}-run-${runNumber}`
}
