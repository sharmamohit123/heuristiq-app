/**
 * Benchmarking Types
 *
 * Shared types for the navigation reliability benchmark suite.
 * See: docs/benchmarking-navigation-tasks.md for the full specification.
 */

import type {
  Persona,
  DeviceType,
  ExperienceLevel,
  PatienceLevel,
  BrowserTestResult,
  TrajectoryStep,
  LlmUsageSummary,
} from '@/types/database'

// A persona definition used for benchmarking (no DB fields required)
export interface BenchmarkPersona {
  name: string
  description: string
  device_type: DeviceType
  experience_level: ExperienceLevel
  patience_level: PatienceLevel
}

// Per-task verification rules evaluated after a run completes
export interface TaskVerification {
  /** Regex the final page URL must match */
  expectedFinalUrl: RegExp

  /** Optional regexes the agent must have visited at some point in the trajectory */
  expectedVisitedUrls?: RegExp[]

  /** Minimum fraction of checkpoints that must be marked DONE (0.0 – 1.0) */
  minCheckpointCompletion: number

  /** Hard step budget; runs that exceed this fail the step budget check */
  maxSteps: number

  /** Optional substring or regex the final page body should contain */
  expectedFinalContent?: string | RegExp

  /**
   * Optional explicit forbidden action — e.g. for T10 where the agent must
   * fill a form but must NOT submit it. Checks trajectory for any step
   * whose `action` description matches these patterns.
   */
  forbiddenActions?: RegExp[]

  /** Advanced: custom check that receives the full result + trajectory */
  customCheck?: (
    result: BrowserTestResult,
    trajectory: TrajectoryStep[]
  ) => { pass: boolean; reason?: string }
}

// Full benchmark task specification
export interface BenchmarkTask {
  id: string // "T01"
  name: string
  url: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  device: DeviceType
  maxExpectedSteps: number
  hypothesis: string
  script: string
  credentials?: Record<string, string>
  defaultPersona: BenchmarkPersona
  verification: TaskVerification
  failureModesProbed: string[]
}

// Verdict for a single benchmark run
export type Verdict = 'PASS' | 'PARTIAL' | 'FAIL'

// Signals extracted from a completed run, used to compute the verdict
export interface VerificationSignals {
  agentReportedSuccess: boolean
  finalUrlMatch: boolean
  visitedExpectedUrls: boolean // true if all required URLs were visited (or no requirement)
  finalContentMatch: boolean // true if no expectedFinalContent or it matched
  checkpointCompletionRate: number // 0.0 – 1.0
  withinStepBudget: boolean
  noExplicitFailure: boolean
  noForbiddenActions: boolean
}

// Result of running a single task once
export interface BenchmarkResult {
  taskId: string
  taskName: string
  runNumber: number
  verdict: Verdict
  score: number // 0–100
  timestampIso: string

  // Mirrored from BrowserTestResult
  agentReportedSuccess: boolean
  totalSteps: number
  durationMs: number
  taskProgress: number
  finalUrl?: string

  // Evaluation
  verificationSignals: VerificationSignals

  // Cost observability
  llmUsage?: LlmUsageSummary

  // Human-readable failure annotations
  failureReasons: string[]
  notes: string[]
}

// Aggregate scorecard after running many tasks
export interface BenchmarkScorecard {
  totalRuns: number
  passRate: number // fraction of PASS verdicts
  partialRate: number
  failRate: number

  avgScore: number
  avgCheckpointCompletion: number
  avgStepEfficiency: number // scriptSteps / actualSteps across all runs
  avgDurationMs: number
  fatalErrorRate: number
  maxStepsExhaustionRate: number

  totalCostUsd: number
  totalLlmCalls: number

  // Navigation Reliability dimension score (0-100) per the strategy doc
  navigationReliabilityScore: number

  byTask: Record<string, {
    taskId: string
    taskName: string
    difficulty: string
    runs: number
    passRate: number
    avgScore: number
    avgCheckpointCompletion: number
    avgSteps: number
    avgCostUsd: number
  }>
}
