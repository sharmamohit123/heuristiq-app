/**
 * Browser Agent Module
 * 
 * AI-powered browser navigation and decision making for live URL testing.
 */

import { AINavigationDecision, BrowserActionType } from '@/types/database'
import { PageAnalysisInput } from './types'
import { getBrowserAgentPrompt } from './prompts/browser-agent'
import { LlmUsageTracker, extractTokenCounts } from './llm-usage'
import { getGenerativeModel, ThinkingLevel, type GeminiPart } from './gemini-client'

const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview'

// Per-step decisions run up to 20 times per persona. Default thinking made a
// step take ~20 s, often over 45 s on busy pages; LOW keeps it around 5 s.
const NAVIGATION_THINKING_LEVEL = ThinkingLevel.LOW

/**
 * Analyze the current page state and decide the next browser action
 */
export async function analyzePageAndDecideAction(
  input: PageAnalysisInput,
  checkpointStatus?: string,
  usageTracker?: LlmUsageTracker
): Promise<AINavigationDecision> {
  const model = getGenerativeModel({ model: GEMINI_VISION_MODEL, thinkingLevel: NAVIGATION_THINKING_LEVEL })

  // Build context of previous actions
  const previousActionsContext = input.previousActions.length > 0
    ? input.previousActions.slice(-5).map((a, i) => 
        `Step ${input.stepNumber - input.previousActions.length + i}: ${a.action} - ${a.description}`
      ).join('\n')
    : 'No previous actions yet.'

  const prompt = getBrowserAgentPrompt(input, previousActionsContext, checkpointStatus)

  try {
    // Convert screenshot buffer to base64
    const base64Screenshot = input.screenshot.toString('base64')

    const imagePart: GeminiPart = {
      inlineData: {
        data: base64Screenshot,
        mimeType: 'image/png',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response.text()

    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_VISION_MODEL, 'browser-agent-step', tokens.input, tokens.output)
    }

    // Parse the JSON response
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    // Validate and normalize the response
    const validActions: BrowserActionType[] = ['click', 'type', 'scroll', 'navigate', 'wait', 'hover', 'select', 'done', 'failed']
    const action = validActions.includes(parsed.action) ? parsed.action : 'wait'

    return {
      action,
      selector: parsed.selector || undefined,
      value: parsed.value || undefined,
      description: parsed.description || `Performing ${action}`,
      reasoning: parsed.reasoning || 'AI decision',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      taskProgress: Math.max(0, Math.min(100, parsed.taskProgress || 0)),
      isTaskComplete: parsed.isTaskComplete || false,
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.map(Number).filter(Number.isInteger)
        : undefined,
      observation: parsed.observation || 'Page analyzed',
      uxObservation: parsed.uxObservation || undefined,
    }
  } catch (error) {
    console.error('[analyzePageAndDecideAction] Error:', error)

    // Return a safe fallback action
    return {
      action: 'wait',
      value: '2000',
      description: 'Waiting due to analysis error',
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0.1,
      taskProgress: 0,
      isTaskComplete: false,
      observation: 'Error occurred during page analysis',
      uxObservation: undefined,
    }
  }
}

// Re-export types for convenience
export type { PageAnalysisInput }
