#!/usr/bin/env tsx
/**
 * Navigation Reliability Benchmark — CLI
 *
 * Usage:
 *   npm run benchmark                      # run all tasks × 3 reps (MVB)
 *   npm run benchmark -- --tasks T01,T02   # subset
 *   npm run benchmark -- --reps 1          # single repetition (smoke test)
 *   npm run benchmark -- --reps 5          # full statistical run
 *   npm run benchmark -- --output out.json # write results JSON to file
 *
 * IMPORTANT: This script loads .env.local FIRST and then *dynamically*
 * imports the benchmark runner. ES module imports are hoisted, so any
 * static `import` of the runner would cause `browser-automation.ts` and
 * `browser-agent.ts` to read process.env BEFORE we have a chance to load
 * the env file — causing 403 Forbidden (no Gemini key) and "supabaseUrl
 * is required" errors.
 */

import * as fs from 'fs'
import * as path from 'path'
import type {
  BenchmarkResult,
  BenchmarkScorecard,
} from '../src/lib/benchmarking/types'

// ============================================================================
// STEP 1 — Load env vars from .env.local BEFORE any runtime imports
// ============================================================================

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(`WARN: .env.local not found at ${filePath}`)
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  let loaded = 0
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
      loaded++
    }
  }
  console.log(`Loaded ${loaded} env vars from ${path.basename(filePath)}`)
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'))

// ============================================================================
// STEP 2 — Validate required env vars
// ============================================================================

const REQUIRED_ENV = ['GOOGLE_VERTEX_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL']
const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`ERROR: Missing required env vars: ${missing.join(', ')}`)
  console.error('Check that .env.local exists in the working directory and contains these keys.')
  process.exit(1)
}

// ============================================================================
// STEP 3 — Argument parsing (no runtime imports needed)
// ============================================================================

interface CliArgs {
  tasks?: string[]
  reps: number
  output?: string
  parallel: boolean
  help: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { reps: 3, parallel: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      args.help = true
    } else if (arg === '--tasks' && i + 1 < argv.length) {
      args.tasks = argv[++i].split(',').map((t) => t.trim())
    } else if (arg === '--reps' && i + 1 < argv.length) {
      args.reps = parseInt(argv[++i], 10)
    } else if (arg === '--output' && i + 1 < argv.length) {
      args.output = argv[++i]
    } else if (arg === '--parallel') {
      args.parallel = true
    }
  }
  return args
}

function printHelp() {
  console.log(`
Heuristiq Navigation Reliability Benchmark

Usage:
  npm run benchmark [-- --tasks T01,T02] [-- --reps N] [-- --output FILE]

Options:
  --tasks IDs    Comma-separated task IDs (e.g. T01,T02,T05)
  --reps N       Repetitions per task (default: 3)
  --output FILE  Write results JSON to FILE (default: ./benchmark-results-{timestamp}.json)
  --parallel     Run each task's repetitions at the same time
  --help         Show this help

Examples:
  npm run benchmark
  npm run benchmark -- --tasks T01 --reps 1
  npm run benchmark -- --reps 5
`)
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const min = Math.floor(ms / 60_000)
  const sec = Math.round((ms % 60_000) / 1000)
  return `${min}m ${sec}s`
}

function printScorecard(scorecard: BenchmarkScorecard) {
  console.log('\n' + '='.repeat(72))
  console.log('  HEURISTIQ NAVIGATION RELIABILITY — SCORECARD')
  console.log('='.repeat(72))
  console.log(`  Total Runs:                ${scorecard.totalRuns}`)
  console.log(`  PASS / PARTIAL / FAIL:     ${(scorecard.passRate * 100).toFixed(0)}% / ${(scorecard.partialRate * 100).toFixed(0)}% / ${(scorecard.failRate * 100).toFixed(0)}%`)
  console.log(`  Average Score:             ${scorecard.avgScore}/100`)
  console.log(`  Avg Checkpoint Completion: ${(scorecard.avgCheckpointCompletion * 100).toFixed(0)}%`)
  console.log(`  Avg Step Efficiency:       ${(scorecard.avgStepEfficiency * 100).toFixed(0)}%`)
  console.log(`  Avg Duration:              ${formatDuration(scorecard.avgDurationMs)}`)
  console.log(`  Fatal Error Rate:          ${(scorecard.fatalErrorRate * 100).toFixed(0)}%`)
  console.log(`  Max Steps Exhaustion:      ${(scorecard.maxStepsExhaustionRate * 100).toFixed(0)}%`)
  console.log(`  Total Cost:                $${scorecard.totalCostUsd.toFixed(4)}`)
  console.log(`  Total LLM Calls:           ${scorecard.totalLlmCalls}`)
  console.log('-'.repeat(72))
  console.log(`  NAVIGATION RELIABILITY SCORE:  ${scorecard.navigationReliabilityScore}/100`)
  console.log('-'.repeat(72))

  const releaseGate = scorecard.navigationReliabilityScore >= 70
    ? 'READY FOR RELEASE (>=70)'
    : 'NEEDS WORK (<70)'
  console.log(`  Release Gate:              ${releaseGate}`)
  console.log('='.repeat(72))

  console.log('\n  Per-Task Breakdown:')
  console.log('  ' + '-'.repeat(70))
  console.log('  ID    PASS%   SCORE   CHKPT%  AVG-STEPS  COST      TASK')
  console.log('  ' + '-'.repeat(70))
  for (const id of Object.keys(scorecard.byTask).sort()) {
    const t = scorecard.byTask[id]
    console.log(
      `  ${t.taskId.padEnd(5)} ` +
      `${(t.passRate * 100).toFixed(0).padStart(3)}%    ` +
      `${t.avgScore.toFixed(0).padStart(3)}     ` +
      `${(t.avgCheckpointCompletion * 100).toFixed(0).padStart(3)}%    ` +
      `${t.avgSteps.toFixed(1).padStart(4)}       ` +
      `$${t.avgCostUsd.toFixed(4)}  ` +
      `${t.taskName}`
    )
  }
  console.log()
}

function printRunLine(result: BenchmarkResult) {
  const verdictIcon =
    result.verdict === 'PASS' ? '[PASS]' :
    result.verdict === 'PARTIAL' ? '[WARN]' : '[FAIL]'
  const cost = result.llmUsage ? `$${result.llmUsage.total_cost_usd.toFixed(4)}` : '-----'
  console.log(
    `  ${verdictIcon}  ${result.taskId} run#${result.runNumber}  ` +
    `score=${result.score.toString().padStart(3)}/100  ` +
    `steps=${result.totalSteps.toString().padStart(2)}  ` +
    `dur=${formatDuration(result.durationMs).padStart(7)}  ` +
    `cost=${cost}`
  )
  if (result.failureReasons.length > 0) {
    for (const reason of result.failureReasons) {
      console.log(`         - ${reason}`)
    }
  }
}

// ============================================================================
// STEP 4 — Main: dynamically import the runner (env vars now in place)
// ============================================================================

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  // Dynamic import — happens AFTER env vars are loaded
  const { runBenchmarkSuite, shutdownBenchmarkRunner } = await import(
    '../src/lib/benchmarking/runner'
  )

  console.log('Heuristiq Navigation Reliability Benchmark')
  console.log(`  Tasks: ${args.tasks ? args.tasks.join(', ') : 'ALL'}`)
  console.log(`  Repetitions: ${args.reps}${args.parallel ? ' (in parallel)' : ''}`)
  console.log()

  const startTime = Date.now()

  // Default output: ./benchmark-results/{timestamp}.json
  const defaultDir = path.resolve(process.cwd(), 'benchmark-results')
  const defaultFile = `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`
  const outputPath = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.join(defaultDir, defaultFile)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  // Completed runs are saved as they finish so an interrupted suite keeps them.
  const partialPath = outputPath.replace(/\.json$/, '') + '.partial.json'
  const completed: BenchmarkResult[] = []

  try {
    const { results, scorecard } = await runBenchmarkSuite({
      taskIds: args.tasks,
      repetitions: args.reps,
      parallelReps: args.parallel,
      onTaskStart: (task, runNumber) => {
        console.log(`\n--> Starting ${task.id} run #${runNumber}: ${task.name}`)
      },
      onTaskComplete: (result) => {
        printRunLine(result)
        completed.push(result)
        fs.writeFileSync(partialPath, JSON.stringify({ results: completed }, null, 2))
      },
    })

    printScorecard(scorecard)

    fs.writeFileSync(
      outputPath,
      JSON.stringify({ results, scorecard, durationMs: Date.now() - startTime }, null, 2)
    )
    fs.rmSync(partialPath, { force: true })
    console.log(`\nResults written to: ${path.relative(process.cwd(), outputPath)}`)
    console.log(`Total elapsed: ${formatDuration(Date.now() - startTime)}`)

    await shutdownBenchmarkRunner().catch(() => {})

    // Force-exit to bypass lingering HTTP/2 sockets held open by the Gemini SDK.
    // Without this, Node will idle for ~30-60s waiting for keep-alive sockets to time out.
    process.exit(0)
  } catch (error) {
    console.error('\nBenchmark suite crashed:', error)
    try {
      await shutdownBenchmarkRunner()
    } catch {
      // ignore
    }
    process.exit(1)
  }
}

main()
