'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Persona } from '@/types/database'
import { ParallelLogEntry, useParallelRuns } from '@/lib/stores/parallel-runs'
import { PersonaConsoleTabs } from './persona-console-tabs'

interface LogEntry {
  id: string
  timestamp: Date
  persona: Persona
  message: string
  type: 'action' | 'observation' | 'decision' | 'error' | 'success'
}

interface AgentConsoleProps {
  logs: LogEntry[]
  isRunning: boolean
}

// New interface for parallel console
interface ParallelAgentConsoleProps {
  className?: string
}

const typeConfig = {
  action: { label: 'ACTION', color: 'bg-blue-500', icon: '→' },
  observation: { label: 'OBSERVE', color: 'bg-purple-500', icon: '👁' },
  decision: { label: 'DECIDE', color: 'bg-yellow-500', icon: '🤔' },
  error: { label: 'ERROR', color: 'bg-red-500', icon: '✗' },
  success: { label: 'SUCCESS', color: 'bg-green-500', icon: '✓' },
}

export function AgentConsole({ logs, isRunning }: AgentConsoleProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [userScrolled, setUserScrolled] = useState(false)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !userScrolled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll, userScrolled])

  // Detect user scroll to disable auto-scroll temporarily
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (isAtBottom) {
      setUserScrolled(false)
    } else {
      setUserScrolled(true)
    }
  }, [])

  // Re-enable auto-scroll when clicking the button
  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll)
    if (!autoScroll) {
      setUserScrolled(false)
      // Scroll to bottom immediately when enabling
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#16162a] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 text-sm font-mono">agent-console</span>
          {isRunning && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-1.5" />
              Running
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoScroll}
            className={cn(
              'text-xs px-2 py-1 rounded transition-colors',
              autoScroll && !userScrolled ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-gray-400'
            )}
          >
            Auto-scroll {autoScroll && !userScrolled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto"
      >
        <div className="space-y-3 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {isRunning ? 'Initializing agents...' : 'Waiting to start...'}
            </div>
          ) : (
            logs.map((log) => {
              const config = typeConfig[log.type]
              return (
                <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-5">
                  {/* Timestamp */}
                  <span className="text-gray-600 text-xs shrink-0 tabular-nums w-20">
                    {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                  </span>

                  {/* Persona Avatar */}
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                      {log.persona.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-gray-300 font-medium text-xs">
                        {log.persona.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded text-white',
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-gray-400 leading-relaxed',
                        log.type === 'error' && 'text-red-400',
                        log.type === 'success' && 'text-green-400'
                      )}
                    >
                      {config.icon} {log.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="animate-pulse">▌</span>
            </div>
          )}
          
          {/* Anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#16162a] border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>{logs.length} log entries</span>
        <span>Press Ctrl+C to abort</span>
      </div>
    </div>
  )
}

/**
 * Run Tabs Component - Shows individual runs within a persona
 */
interface RunTabsProps {
  runs: Array<{
    runId: string
    runNumber: number
    status: 'pending' | 'running' | 'completed' | 'error'
  }>
  activeRunId: string | null
  onRunSelect: (runId: string) => void
}

function RunTabs({ runs, activeRunId, onRunSelect }: RunTabsProps) {
  const statusColors = {
    pending: 'bg-gray-500',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      {runs.map((run) => (
        <button
          key={run.runId}
          onClick={() => onRunSelect(run.runId)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all',
            run.runId === activeRunId
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', statusColors[run.status])} />
          Run {run.runNumber}
        </button>
      ))}
    </div>
  )
}

/**
 * Parallel Agent Console - Shows logs from parallel runs with persona and run tabs
 */
export function ParallelAgentConsole({ className }: ParallelAgentConsoleProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [userScrolled, setUserScrolled] = useState(false)

  // Get state from parallel runs store
  const {
    activePersonaId,
    activeRunId,
    isRunning,
    completedCount,
    totalCount,
    getLogsForRun,
    getPersonaSummaries,
    getRunsForPersona,
    setActivePersona,
    setActiveRun,
  } = useParallelRuns()

  // Get logs for active run (filtered by specific run)
  const logs = getLogsForRun(activeRunId)
  const personaSummaries = getPersonaSummaries()
  const runsForActivePersona = activePersonaId ? getRunsForPersona(activePersonaId) : []

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !userScrolled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll, userScrolled])

  // Detect user scroll to disable auto-scroll temporarily
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (isAtBottom) {
      setUserScrolled(false)
    } else {
      setUserScrolled(true)
    }
  }, [])

  // Re-enable auto-scroll when clicking the button
  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll)
    if (!autoScroll) {
      setUserScrolled(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Get active run info
  const activeRun = runsForActivePersona.find(r => r.runId === activeRunId)
  const activePersona = personaSummaries.find(p => p.personaId === activePersonaId)

  return (
    <div className={cn('flex flex-col h-full bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden', className)}>
      {/* Sticky Header with Persona and Run Tabs */}
      <div className="flex-shrink-0 flex flex-col bg-[#16162a] border-b border-gray-800 sticky top-0 z-10">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-sm font-mono">parallel-agent-console</span>
            {isRunning && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-1.5" />
                Running
              </Badge>
            )}
            {totalCount > 0 && (
              <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">
                {completedCount}/{totalCount} runs
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoScroll}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                autoScroll && !userScrolled ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-gray-400'
              )}
            >
              Auto-scroll {autoScroll && !userScrolled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Persona Tabs */}
        {personaSummaries.length > 0 && (
          <div className="px-4 pb-2">
            <PersonaConsoleTabs
              personas={personaSummaries}
              activePersonaId={activePersonaId}
              onPersonaSelect={setActivePersona}
            />
          </div>
        )}

        {/* Run Tabs for active persona */}
        {runsForActivePersona.length > 1 && (
          <RunTabs
            runs={runsForActivePersona.map(r => ({
              runId: r.runId,
              runNumber: r.runNumber,
              status: r.status,
            }))}
            activeRunId={activeRunId}
            onRunSelect={setActiveRun}
          />
        )}
      </div>

      {/* Console Output */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto"
      >
        <div className="space-y-3 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {isRunning 
                ? activeRun?.status === 'pending' 
                  ? 'Waiting for run to start...' 
                  : 'Initializing agent...'
                : totalCount > 0 
                  ? 'Select a run to view logs' 
                  : 'Waiting to start...'}
            </div>
          ) : (
            logs.map((log) => {
              const config = typeConfig[log.type]
              return (
                <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-5">
                  {/* Timestamp */}
                  <span className="text-gray-600 text-xs shrink-0 tabular-nums w-20">
                    {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                  </span>

                  {/* Persona Avatar */}
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                      {log.personaName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-gray-300 font-medium text-xs">
                        {log.personaName}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded text-white',
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-gray-400 leading-relaxed',
                        log.type === 'error' && 'text-red-400',
                        log.type === 'success' && 'text-green-400'
                      )}
                    >
                      {config.icon} {log.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}

          {isRunning && activeRun?.status === 'running' && (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="animate-pulse">▌</span>
            </div>
          )}
          
          {/* Anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#16162a] border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>
          {logs.length} log entries
          {activeRunId && activePersona && (
            <span className="ml-2 text-gray-600">
              ({activePersona.personaName} - Run {activeRun?.runNumber})
            </span>
          )}
        </span>
        <span>Press Ctrl+C to abort</span>
      </div>
    </div>
  )
}
