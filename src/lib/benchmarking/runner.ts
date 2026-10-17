/**
 * Benchmark Runner
 *
 * Orchestrates execution of benchmark tasks, verification, and scorecard
 * generation. Can be called programmatically or from the CLI.
 */

import type { Persona } from '@/types/database'
import { runPersonaBrowserTest, browserPool } from '../browser-automation'
import type {
  BenchmarkTask,
  BenchmarkResult,
  BenchmarkScorecard,
  BenchmarkPersona,
} from './types'
import { verifyBenchmarkRun } from './verify'
import { judgeCheckpointCompletion, formatJudgeNotes } from './judge'
import { ALL_TASKS } from './tasks'

export interface RunnerOptions {
  /** Subset of task IDs to run. If undefined, runs all tasks. */
  taskIds?: string[]
  /** Number of repetitions per task. Default: 3 (MVB). */
  repetitions?: number
  /** Per-task logger callback (optional). */
  onTaskStart?: (task: BenchmarkTask, runNumber: number) => void
  onTaskComplete?: (result: BenchmarkResult) => void
  /** Override the default persona for all tasks. */
  personaOverride?: BenchmarkPersona
}

/**
 * Convert a BenchmarkPersona into the Persona DB type expected by
 * runPersonaBrowserTest, using synthetic IDs.
 */
function synthesizePersona(
  bp: BenchmarkPersona,
  benchmarkId: string
): Persona {
  const id = `benchmark-${benchmarkId}-${bp.device_type}-${bp.experience_level}`
  const nowIso = new Date().toISOString()
  return {
    id,
    user_id: 'benchmark-runner',
    name: bp.name,
    description: bp.description,
    device_type: bp.device_type,
    experience_level: bp.experience_level,
    patience_level: bp.patience_level,
    is_default: false,
    avatar_url: null,
    created_at: nowIso,
    updated_at: nowIso,
  }
}

/**
 * Run a single task once and verify the outcome.
 */
export async function runSingleBenchmark(
  task: BenchmarkTask,
  runNumber: number,
  personaOverride?: BenchmarkPersona
): Promise<BenchmarkResult> {
  const persona = synthesizePersona(
    personaOverride || task.defaultPersona,
    task.id.toLowerCase()
  )

  const experimentId = `benchmark-${task.id.toLowerCase()}-${Date.now()}-${runNumber}`

  const testResult = await runPersonaBrowserTest({
    url: task.url,
    script: task.script,
    hypothesis: task.hypothesis,
    persona,
    experimentId,
    runNumber,
  })

  // Run LLM-as-judge to re-evaluate checkpoints from the actual trajectory
  // (more reliable than the in-loop keyword tracker).
  const judged = await judgeCheckpointCompletion(task, testResult)
  let judgeNotes: string[] = []
  if (judged) {
    testResult.checkpointResults = judged.results
    judgeNotes = formatJudgeNotes(judged.results, judged.raw)
  }

  const benchmarkResult = verifyBenchmarkRun(task, testResult, runNumber)

  // Annotate that the judge was used and surface its evidence
  if (judged) {
    benchmarkResult.notes.unshift(
      `Checkpoints validated by LLM judge (${judged.results.filter((c) => c.completed).length}/${judged.results.length} completed)`
    )
    benchmarkResult.notes.push(...judgeNotes)
  } else {
    benchmarkResult.notes.unshift(
      'Judge unavailable — fell back to keyword-based checkpoint tracker (less reliable)'
    )
  }

  return benchmarkResult
}

/**
 * Run the full benchmark suite (or a subset) with repetitions.
 */
export async function runBenchmarkSuite(
  options: RunnerOptions = {}
): Promise<{
  results: BenchmarkResult[]
  scorecard: BenchmarkScorecard
}> {
  const {
    taskIds,
    repetitions = 3,
    onTaskStart,
    onTaskComplete,
    personaOverride,
  } = options

  const tasks = taskIds && taskIds.length > 0
    ? ALL_TASKS.filter((t) => taskIds.map((id) => id.toUpperCase()).includes(t.id.toUpperCase()))
    : ALL_TASKS

  if (tasks.length === 0) {
    throw new Error(`No matching tasks for taskIds: ${taskIds?.join(', ')}`)
  }

  const results: BenchmarkResult[] = []

  for (const task of tasks) {
    for (let rep = 1; rep <= repetitions; rep++) {
      if (onTaskStart) onTaskStart(task, rep)

      try {
        const result = await runSingleBenchmark(task, rep, personaOverride)
        results.push(result)
        if (onTaskComplete) onTaskComplete(result)
      } catch (error) {
        // Runner-level failure (e.g., browser pool crash) — record as FAIL
        const failResult: BenchmarkResult = {
          taskId: task.id,
          taskName: task.name,
          runNumber: rep,
          verdict: 'FAIL',
          score: 0,
          timestampIso: new Date().toISOString(),
          agentReportedSuccess: false,
          totalSteps: 0,
          durationMs: 0,
          taskProgress: 0,
          verificationSignals: {
            agentReportedSuccess: false,
            finalUrlMatch: false,
            visitedExpectedUrls: false,
            finalContentMatch: false,
            checkpointCompletionRate: 0,
            withinStepBudget: false,
            noExplicitFailure: false,
            noForbiddenActions: true,
          },
          failureReasons: [
            `Runner-level crash: ${error instanceof Error ? error.message : 'Unknown'}`,
          ],
          notes: [],
        }
        results.push(failResult)
        if (onTaskComplete) onTaskComplete(failResult)
      }
    }
  }

  const scorecard = computeScorecard(results, tasks)
  return { results, scorecard }
}

/**
 * Compute the aggregate scorecard across all runs.
 */
export function computeScorecard(
  results: BenchmarkResult[],
  tasks: BenchmarkTask[]
): BenchmarkScorecard {
  const totalRuns = results.length
  if (totalRuns === 0) {
    return {
      totalRuns: 0,
      passRate: 0,
      partialRate: 0,
      failRate: 0,
      avgScore: 0,
      avgCheckpointCompletion: 0,
      avgStepEfficiency: 0,
      avgDurationMs: 0,
      fatalErrorRate: 0,
      maxStepsExhaustionRate: 0,
      totalCostUsd: 0,
      totalLlmCalls: 0,
      navigationReliabilityScore: 0,
      byTask: {},
    }
  }

  const passes = results.filter((r) => r.verdict === 'PASS').length
  const partials = results.filter((r) => r.verdict === 'PARTIAL').length
  const fails = results.filter((r) => r.verdict === 'FAIL').length

  const avgScore = results.reduce((s, r) => s + r.score, 0) / totalRuns
  const avgCheckpointCompletion =
    results.reduce((s, r) => s + r.verificationSignals.checkpointCompletionRate, 0) / totalRuns
  const avgDurationMs =
    results.reduce((s, r) => s + r.durationMs, 0) / totalRuns

  // Step efficiency = script_steps / actual_steps, capped at 1.0 per run
  const stepEfficiencies = results.map((r) => {
    const task = tasks.find((t) => t.id === r.taskId)
    if (!task || r.totalSteps === 0) return 0
    // Approximate script_steps by counting lines starting with "N." in the script
    const scriptSteps = (task.script.match(/^\s*\d+[.)]/gm) || []).length || 1
    return Math.min(1, scriptSteps / r.totalSteps)
  })
  const avgStepEfficiency =
    stepEfficiencies.reduce((s, e) => s + e, 0) / totalRuns

  const fatalErrors = results.filter(
    (r) =>
      !r.verificationSignals.noExplicitFailure && r.totalSteps < 3
  ).length
  const maxStepsExhausted = results.filter((r) => {
    const task = tasks.find((t) => t.id === r.taskId)
    return task && r.totalSteps >= task.verification.maxSteps
  }).length

  const totalCostUsd = results.reduce(
    (s, r) => s + (r.llmUsage?.total_cost_usd || 0),
    0
  )
  const totalLlmCalls = results.reduce(
    (s, r) => s + (r.llmUsage?.total_calls || 0),
    0
  )

  // Per-task breakdown
  const byTask: BenchmarkScorecard['byTask'] = {}
  for (const task of tasks) {
    const taskResults = results.filter((r) => r.taskId === task.id)
    if (taskResults.length === 0) continue
    byTask[task.id] = {
      taskId: task.id,
      taskName: task.name,
      difficulty: task.difficulty,
      runs: taskResults.length,
      passRate: taskResults.filter((r) => r.verdict === 'PASS').length / taskResults.length,
      avgScore: taskResults.reduce((s, r) => s + r.score, 0) / taskResults.length,
      avgCheckpointCompletion:
        taskResults.reduce((s, r) => s + r.verificationSignals.checkpointCompletionRate, 0) /
        taskResults.length,
      avgSteps: taskResults.reduce((s, r) => s + r.totalSteps, 0) / taskResults.length,
      avgCostUsd:
        taskResults.reduce((s, r) => s + (r.llmUsage?.total_cost_usd || 0), 0) /
        taskResults.length,
    }
  }

  // Navigation Reliability score (tightened — May 2026, post-MVB-3)
  // The previous formula was too lenient: a 50% pass rate produced a 79/100
  // score (above the 70 release gate). Pass rate is now the dominant factor
  // and target thresholds are tightened to industry norms.
  //
  //   Task Success Rate       → 50 pts × min(1, actual / 0.95)
  //   Checkpoint Completion   → 25 pts × min(1, actual / 0.80)
  //   Step Efficiency         → 10 pts × min(1, actual / 0.60)
  //   No Fatal Errors         → 15 pts × max(0, 1 - fatal_rate / 0.05)
  const passRate = passes / totalRuns
  const fatalRate = fatalErrors / totalRuns

  const successPts = 50 * Math.min(1, passRate / 0.95)
  const checkpointPts = 25 * Math.min(1, avgCheckpointCompletion / 0.80)
  const efficiencyPts = 10 * Math.min(1, avgStepEfficiency / 0.60)
  const noFatalPts = 15 * Math.max(0, 1 - fatalRate / 0.05)

  const navigationReliabilityScore = Math.round(
    successPts + checkpointPts + efficiencyPts + noFatalPts
  )

  return {
    totalRuns,
    passRate,
    partialRate: partials / totalRuns,
    failRate: fails / totalRuns,
    avgScore: Math.round(avgScore),
    avgCheckpointCompletion,
    avgStepEfficiency,
    avgDurationMs,
    fatalErrorRate: fatalRate,
    maxStepsExhaustionRate: maxStepsExhausted / totalRuns,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    totalLlmCalls,
    navigationReliabilityScore,
    byTask,
  }
}

/**
 * Graceful shutdown of the browser pool after the suite finishes.
 * Should be called by the CLI wrapper.
 */
export async function shutdownBenchmarkRunner(): Promise<void> {
  await browserPool.shutdown()
}
