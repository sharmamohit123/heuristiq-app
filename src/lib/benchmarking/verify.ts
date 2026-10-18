/**
 * Benchmark Result Verifier
 *
 * Evaluates a BrowserTestResult against a task's TaskVerification rules
 * and produces a verdict (PASS / PARTIAL / FAIL) with a numeric score.
 *
 * Scoring philosophy (post-MVB revision):
 *   Checkpoint completion is the DOMINANT factor — agents that match the
 *   final URL but skip steps must NOT score 100.
 *
 *   Score breakdown (0-100):
 *     - Checkpoint completion        →  60 pts × completion_rate
 *     - finalUrlMatch                →  15 pts
 *     - visitedExpectedUrls          →  10 pts (if specified, else N/A → granted)
 *     - withinStepBudget             →   5 pts
 *     - noExplicitFailure            →   5 pts
 *     - noForbiddenActions           →   5 pts
 *
 *   HARD CAPS (a single severe failure cannot be hidden by other signals):
 *     - Forbidden action executed     → max score 25 (FAIL)
 *     - Explicit failure / timeout    → max score 40
 *     - Checkpoint completion < 0.30  → max score 35
 *     - Checkpoint completion < 0.50  → max score 60
 */

import type {
  BrowserTestResult,
  TrajectoryStep,
  CheckpointResult,
} from '@/types/database'
import type {
  BenchmarkTask,
  BenchmarkResult,
  VerificationSignals,
  Verdict,
} from './types'
import { parseTaskCheckpoints } from '../task-tracking'

/**
 * Compute the fraction of script checkpoints that were marked DONE
 * by the in-loop checkpoint tracker (task-tracking.ts).
 *
 * Falls back to taskProgress estimation only if checkpointResults is missing
 * (e.g., older runs without the new field).
 */
function computeCheckpointCompletion(
  task: BenchmarkTask,
  result: BrowserTestResult
): { rate: number; completed: number; total: number; results: CheckpointResult[] } {
  if (result.checkpointResults && result.checkpointResults.length > 0) {
    const total = result.checkpointResults.length
    const completed = result.checkpointResults.filter((c) => c.completed).length
    return {
      rate: completed / total,
      completed,
      total,
      results: result.checkpointResults,
    }
  }
  // Fallback for legacy results
  const checkpoints = parseTaskCheckpoints(task.script)
  const total = checkpoints.length || 1
  const progress = result.taskProgress ?? (result.success ? 100 : 0)
  const rate = Math.max(0, Math.min(1, progress / 100))
  return {
    rate,
    completed: Math.round(rate * total),
    total,
    results: [],
  }
}

/**
 * Check whether the trajectory or final URL matches each required pattern.
 */
function checkVisitedUrls(
  trajectory: TrajectoryStep[],
  requiredPatterns: RegExp[],
  finalUrl?: string
): { allMatched: boolean; missing: RegExp[] } {
  if (requiredPatterns.length === 0) return { allMatched: true, missing: [] }
  const missing: RegExp[] = []
  for (const pattern of requiredPatterns) {
    const visitedMatch = trajectory.some((step) => pattern.test(step.url))
    const finalMatch = finalUrl ? pattern.test(finalUrl) : false
    if (!visitedMatch && !finalMatch) missing.push(pattern)
  }
  return { allMatched: missing.length === 0, missing }
}

function checkFinalUrl(result: BrowserTestResult, pattern: RegExp): boolean {
  const finalUrl =
    result.finalUrl ||
    (result.trajectory && result.trajectory.length > 0
      ? result.trajectory[result.trajectory.length - 1].url
      : undefined)
  if (!finalUrl) return false
  return pattern.test(finalUrl)
}

// Only steps that act on an element can trigger a forbidden action. Typing,
// scrolling, and the agent's closing "done" note are excluded, so a note like
// "filled the form without submitting" is not mistaken for a submit.
const ELEMENT_ACTIONS = new Set(['click', 'select', 'navigate'])

function checkForbiddenActions(
  result: BrowserTestResult,
  forbiddenPatterns: RegExp[]
): { ok: boolean; matched?: string } {
  if (forbiddenPatterns.length === 0) return { ok: true }
  const trajectory = result.trajectory || []
  for (const step of trajectory) {
    if (!ELEMENT_ACTIONS.has(step.action)) continue
    const text = [step.target, step.description].filter(Boolean).join(' ')
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) return { ok: false, matched: step.description || text }
    }
  }
  return { ok: true }
}

function detectExplicitFailure(result: BrowserTestResult): boolean {
  if (result.struggle_point === 'Max steps reached without completing task') return true
  const reason = (result.reason || '').toLowerCase()
  if (reason.includes('timeout')) return true
  if (reason.includes('aborted')) return true
  if (reason.includes('unexpected error')) return true
  return false
}

/**
 * Run the verification logic for a single task run.
 */
export function verifyBenchmarkRun(
  task: BenchmarkTask,
  result: BrowserTestResult,
  runNumber: number
): BenchmarkResult {
  const trajectory = result.trajectory || []
  const verification = task.verification

  const checkpoint = computeCheckpointCompletion(task, result)
  const finalUrlMatch = checkFinalUrl(result, verification.expectedFinalUrl)
  const visited = checkVisitedUrls(
    trajectory,
    verification.expectedVisitedUrls || [],
    result.finalUrl
  )
  const withinStepBudget = (result.totalSteps ?? 0) <= verification.maxSteps
  const explicitFailure = detectExplicitFailure(result)
  const noExplicitFailure = !explicitFailure
  const forbidden = checkForbiddenActions(result, verification.forbiddenActions || [])
  const noForbiddenActions = forbidden.ok
  const finalContentMatch = true // reserved for customCheck

  const customResult = verification.customCheck
    ? verification.customCheck(result, trajectory)
    : { pass: true }

  const signals: VerificationSignals = {
    agentReportedSuccess: result.success === true,
    finalUrlMatch,
    visitedExpectedUrls: visited.allMatched,
    finalContentMatch,
    checkpointCompletionRate: checkpoint.rate,
    withinStepBudget,
    noExplicitFailure,
    noForbiddenActions,
  }

  // ============================================================
  // Scoring (max 100, with hard caps)
  // ============================================================
  let score = 0
  score += Math.round(60 * checkpoint.rate)              // up to 60
  if (finalUrlMatch) score += 15
  if (visited.allMatched) score += 10
  if (withinStepBudget) score += 5
  if (noExplicitFailure) score += 5
  if (noForbiddenActions) score += 5

  // Hard caps
  if (!noForbiddenActions) score = Math.min(score, 25)
  if (explicitFailure) score = Math.min(score, 40)
  if (checkpoint.rate < 0.30) score = Math.min(score, 35)
  else if (checkpoint.rate < 0.50) score = Math.min(score, 60)
  if (!customResult.pass) score = Math.min(score, 30)

  score = Math.max(0, Math.min(100, score))

  // ============================================================
  // Verdict
  // ============================================================
  const failureReasons: string[] = []
  const notes: string[] = []

  if (!noForbiddenActions) {
    failureReasons.push(
      `Forbidden action executed: "${forbidden.matched || 'unknown'}"`
    )
  }
  if (!withinStepBudget) {
    failureReasons.push(
      `Exceeded step budget (${result.totalSteps} > ${verification.maxSteps})`
    )
  }
  if (explicitFailure) {
    failureReasons.push(
      `Explicit failure: ${result.reason || result.struggle_point || 'unknown'}`
    )
  }
  if (!finalUrlMatch) {
    failureReasons.push(
      `Final URL did not match expected pattern (got: ${result.finalUrl || 'unknown'})`
    )
  }
  if (!visited.allMatched) {
    const missingStrs = visited.missing.map((p) => p.source).join(', ')
    failureReasons.push(`Required URL(s) never visited: ${missingStrs}`)
  }
  if (checkpoint.rate < verification.minCheckpointCompletion) {
    failureReasons.push(
      `Checkpoint completion ${(checkpoint.rate * 100).toFixed(0)}% (${checkpoint.completed}/${checkpoint.total}) below threshold ${(verification.minCheckpointCompletion * 100).toFixed(0)}%`
    )
  }
  if (customResult.reason) {
    failureReasons.push(`Custom check: ${customResult.reason}`)
  }

  // List of skipped checkpoints for actionable diagnostics
  if (checkpoint.results.length > 0) {
    const skipped = checkpoint.results.filter((c) => !c.completed)
    if (skipped.length > 0) {
      notes.push(
        `Skipped checkpoints: ${skipped.map((c) => `#${c.id} "${c.description.slice(0, 60)}..."`).join(' | ')}`
      )
    }
  }

  // PASS requires ALL of: checkpoint threshold, final URL match, visited URLs,
  // no explicit failure, no forbidden action, custom check pass.
  const passes =
    checkpoint.rate >= verification.minCheckpointCompletion &&
    finalUrlMatch &&
    visited.allMatched &&
    noExplicitFailure &&
    noForbiddenActions &&
    customResult.pass

  // PARTIAL = some real progress (>= 30% checkpoints), no forbidden action,
  //           and either final URL matched OR > 60% checkpoints completed.
  const partial =
    !passes &&
    noForbiddenActions &&
    !explicitFailure &&
    checkpoint.rate >= 0.3 &&
    (finalUrlMatch || checkpoint.rate >= 0.6)

  let verdict: Verdict
  if (passes) verdict = 'PASS'
  else if (partial) verdict = 'PARTIAL'
  else verdict = 'FAIL'

  // Self-report sanity flags
  if (result.success === true && !passes) {
    notes.push(
      'Agent self-reported success but external verification disagrees (possible hallucinated completion)'
    )
  }
  if (result.success === false && passes) {
    notes.push(
      'Agent self-reported failure but verification indicates the task was completed'
    )
  }

  return {
    taskId: task.id,
    taskName: task.name,
    runNumber,
    verdict,
    score,
    timestampIso: new Date().toISOString(),

    agentReportedSuccess: result.success === true,
    totalSteps: result.totalSteps ?? 0,
    durationMs: result.duration_ms,
    taskProgress: result.taskProgress ?? 0,
    finalUrl: result.finalUrl,

    verificationSignals: signals,
    llmUsage: result.llm_usage,
    failureReasons,
    notes,
  }
}
