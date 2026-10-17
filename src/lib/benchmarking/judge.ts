/**
 * LLM-as-Judge for Checkpoint Completion
 *
 * The in-loop checkpoint tracker (`task-tracking.ts`) uses keyword matching
 * on the AGENT'S OWN observation/action descriptions. This means an agent
 * that *thinks* it clicked a habit checkmark — but actually clicked the
 * wrong element or no element — will still get its checkpoint marked as
 * DONE. The MVB-2 results showed T09 scoring 100% on runs where the user
 * verified (via recordings) that key actions failed.
 *
 * This module re-evaluates checkpoint completion AFTER the run by sending
 * the full trajectory + observations to an LLM judge, asking it to rule on
 * each checkpoint based on actual evidence (URL changes, observation text,
 * action success). This is the same approach used by BU Bench V1 and other
 * production browser-agent benchmarks.
 */

import type {
  BrowserTestResult,
  CheckpointResult,
  TrajectoryStep,
  ExperienceLog,
} from '@/types/database'
import type { BenchmarkTask } from './types'
import { parseTaskCheckpoints } from '../task-tracking'
import { getGenerativeModel } from '../ai/gemini-client'

const JUDGE_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'

interface JudgeVerdict {
  id: number
  completed: boolean
  evidence: string
}

interface JudgeResult {
  checkpoints: JudgeVerdict[]
}

/**
 * Build the judge prompt from the trajectory + script.
 */
function buildJudgePrompt(
  task: BenchmarkTask,
  result: BrowserTestResult,
  parsedCheckpoints: { id: number; description: string }[]
): string {
  const trajectory = result.trajectory || []
  const expLogs = result.experienceLogs || []

  // Pair trajectory steps with their observations for richer context.
  const stepLines: string[] = []
  for (const step of trajectory) {
    const obs = expLogs.find((l) => l.step === step.step)
    const obsText = obs ? ` | observation: ${obs.observation}` : ''
    stepLines.push(
      `Step ${step.step}: action=${step.action} url=${step.url} title="${step.title}" success=${step.actionSuccess} strategy=${step.strategyUsed || 'n/a'}${obsText}`
    )
  }

  const checkpointList = parsedCheckpoints
    .map((c) => `${c.id}. ${c.description}`)
    .join('\n')

  const trajectoryText = stepLines.join('\n')

  return `You are an impartial benchmark judge evaluating a web automation agent's run.

## TASK
Name: ${task.name}
Starting URL: ${task.url}

## SCRIPT (numbered checkpoints)
${checkpointList}

## AGENT TRAJECTORY (${trajectory.length} steps)
${trajectoryText || '(no trajectory recorded)'}

## FINAL STATE
Final URL: ${result.finalUrl || 'unknown'}
Agent self-reported success: ${result.success}
Total steps used: ${result.totalSteps ?? 0}

## YOUR JOB
For EACH numbered checkpoint above, determine whether the agent ACTUALLY completed it
based on EVIDENCE in the trajectory — NOT on what the agent claimed.

## EVIDENCE RULES — apply these strictly

A checkpoint is COMPLETED only if there is concrete evidence such as:
  - The URL navigated to the expected page (for navigation steps)
  - A search results page appeared (for "submit a search" steps)
  - The trajectory shows a successful click/type/select on a relevant element
    AND the subsequent step's URL/title/observation reflects the expected change
  - The observation explicitly confirms the intended state was reached
    (e.g., "the modal opened", "the toggle is now ON", "the item was added")

A checkpoint is NOT completed if:
  - The agent skipped to a later step without performing this one
  - The agent's observation contradicts the script (e.g., wrong element clicked)
  - The action failed (success=false in trajectory)
  - There is no URL change AND no DOM evidence of the intended effect, even
    if the agent says it did the action (e.g., toggling a switch with no
    visual confirmation)
  - The agent reached an unintended page (e.g., script asked for "Request"
    sub-page but agent ended up on "XMLHttpRequest")

Be STRICT. When in doubt, mark NOT completed. Provide a brief evidence note.

## OUTPUT
Return ONLY valid JSON in this exact shape (no markdown, no code fences):
{
  "checkpoints": [
    { "id": 1, "completed": true, "evidence": "URL changed to /search?q=quantum at step 3" },
    { "id": 2, "completed": false, "evidence": "agent clicked XMLHttpRequest link instead of Request sub-page" }
  ]
}

Include EXACTLY ${parsedCheckpoints.length} entries, one per script checkpoint, in order.`
}

/**
 * Run the LLM judge on a completed BrowserTestResult and return the
 * authoritative checkpoint completion data.
 *
 * Returns null on failure (caller should fall back to in-loop tracker results).
 */
export async function judgeCheckpointCompletion(
  task: BenchmarkTask,
  result: BrowserTestResult
): Promise<{ results: CheckpointResult[]; raw: JudgeResult } | null> {
  // Use the in-loop tracker's checkpoint list as the canonical source of IDs/descriptions.
  // This ensures the judge sees exactly the same checkpoint set the verifier would.
  const seedCheckpoints =
    result.checkpointResults && result.checkpointResults.length > 0
      ? result.checkpointResults.map((c) => ({ id: c.id, description: c.description }))
      : parseTaskCheckpoints(task.script).map((c) => ({
          id: c.id,
          description: c.description,
        }))

  if (seedCheckpoints.length === 0) return null

  // Skip judge if there's no trajectory to judge against
  if (!result.trajectory || result.trajectory.length === 0) {
    console.log('[judge] No trajectory available — skipping LLM judge')
    return null
  }

  const prompt = buildJudgePrompt(task, result, seedCheckpoints)

  try {
    const model = getGenerativeModel({ model: JUDGE_MODEL })
    const apiResult = await model.generateContent(prompt)
    const responseText = apiResult.response.text()

    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned) as JudgeResult

    if (!parsed.checkpoints || !Array.isArray(parsed.checkpoints)) {
      console.error('[judge] Invalid response shape:', parsed)
      return null
    }

    // Build CheckpointResult[] aligned with seedCheckpoints by id.
    // Anything the judge omits is treated as not completed.
    const verdictById = new Map<number, JudgeVerdict>()
    for (const v of parsed.checkpoints) verdictById.set(v.id, v)

    const results: CheckpointResult[] = seedCheckpoints.map((c) => {
      const verdict = verdictById.get(c.id)
      const original = result.checkpointResults?.find((r) => r.id === c.id)
      return {
        id: c.id,
        description: c.description,
        completed: verdict?.completed === true,
        attempts: original?.attempts ?? 0,
        completedAtStep: verdict?.completed ? original?.completedAtStep : undefined,
      }
    })

    const passed = results.filter((r) => r.completed).length
    console.log(
      `[judge] ${passed}/${results.length} checkpoints judged as completed`
    )

    return { results, raw: parsed }
  } catch (error) {
    console.error('[judge] LLM judge failed:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Helper: format judge evidence into human-readable notes for the BenchmarkResult.
 */
export function formatJudgeNotes(
  judged: CheckpointResult[],
  raw: JudgeResult
): string[] {
  const notes: string[] = []
  for (const cp of judged) {
    const verdict = raw.checkpoints.find((v) => v.id === cp.id)
    if (verdict && !cp.completed) {
      notes.push(
        `Judge: checkpoint #${cp.id} NOT completed — ${verdict.evidence}`
      )
    }
  }
  return notes
}
