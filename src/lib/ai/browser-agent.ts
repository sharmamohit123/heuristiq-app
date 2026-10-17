/**
 * Browser Agent Module
 * 
 * AI-powered browser navigation and decision making for live URL testing.
 */

import { AINavigationDecision, BrowserActionType } from '@/types/database'
import { PageAnalysisInput } from './types'
import { getBrowserAgentPrompt } from './prompts/browser-agent'
import { LlmUsageTracker, extractTokenCounts } from './llm-usage'
import { getGenerativeModel, type GeminiPart } from './gemini-client'

const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview'

/**
 * Analyze the current page state and decide the next browser action
 */
export async function analyzePageAndDecideAction(
  input: PageAnalysisInput,
  checkpointStatus?: string,
  usageTracker?: LlmUsageTracker
): Promise<AINavigationDecision> {
  const model = getGenerativeModel({ model: GEMINI_VISION_MODEL })

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
