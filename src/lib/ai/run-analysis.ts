/**
 * Run Analysis Module
 * 
 * LLM-based analysis of UX observations after a run completes.
 * Generates curated insights and recommendations instead of keyword-based classification.
 */

import { Persona } from '@/types/database'
import { RunInsight, RunRecommendation } from './types'
import { getRunAnalysisPrompt, RunAnalysisInput } from './prompts/run-analysis'
import { LlmUsageTracker, extractTokenCounts } from './llm-usage'
import { getGenerativeModel } from './gemini-client'

const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'

export interface RunAnalysisResult {
  insights: RunInsight[]
  recommendations: RunRecommendation[]
}

/**
 * Analyze raw UX observations from a run and generate curated insights + recommendations
 */
export async function analyzeRunObservations(
  observations: string[],
  persona: Persona,
  taskScript: string,
  taskOutcome: {
    success: boolean
    stepCount: number
    maxSteps: number
    strugglePoint?: string
  },
  usageTracker?: LlmUsageTracker
): Promise<RunAnalysisResult> {
  // Filter out empty or trivial observations
  const validObservations = observations.filter(obs => {
    if (!obs) return false
    const lower = obs.toLowerCase().trim()
    // Filter out "no issues" type observations
    if (lower === 'no issues - ui is clear' || 
        lower === 'no issues' || 
        lower.includes('no ux issues') ||
        lower.length < 10) {
      return false
    }
    return true
  })

  // If no valid observations, return defaults based on outcome
  if (validObservations.length === 0) {
    console.log('[Run Analysis] No valid observations to analyze')
    return getDefaultAnalysis(taskOutcome)
  }

  const input: RunAnalysisInput = {
    observations: validObservations,
    persona,
    taskScript,
    taskOutcome,
  }

  const prompt = getRunAnalysisPrompt(input)

  try {
    console.log(`[Run Analysis] Analyzing ${validObservations.length} observations for ${persona.name}`)
    
    const model = getGenerativeModel({ model: GEMINI_TEXT_MODEL })
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'run-analysis', tokens.input, tokens.output)
    }
    
    // Clean and parse the response
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    // Validate response structure
    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      console.error('[Run Analysis] Invalid response - missing insights array')
      return getDefaultAnalysis(taskOutcome)
    }

    // Map insights to RunInsight format
    const insights: RunInsight[] = parsed.insights.map((insight: any) => ({
      severity: validateSeverity(insight.severity),
      text: insight.text,
      screenshot_id: insight.screenContext || undefined,
    }))

    // Map recommendations to RunRecommendation format
    const recommendations: RunRecommendation[] = (parsed.recommendations || []).map(
      (rec: any, idx: number) => ({
        priority: idx + 1,
        title: rec.title || 'Improvement Suggestion',
        description: rec.description || '',
      })
    )

    console.log(`[Run Analysis] Generated ${insights.length} insights and ${recommendations.length} recommendations`)
    
    // Add task completion insight if not already present
    const hasCompletionInsight = insights.some(i => 
      i.text.toLowerCase().includes('completed') || 
      i.text.toLowerCase().includes('steps')
    )
    
    if (!hasCompletionInsight) {
      if (taskOutcome.success) {
        insights.push({
          severity: 'positive',
          text: `Task completed successfully in ${taskOutcome.stepCount} steps.`,
        })
      } else if (taskOutcome.stepCount >= taskOutcome.maxSteps) {
        insights.push({
          severity: 'high',
          text: 'The task required too many steps to complete, suggesting the flow could be simplified.',
        })
      }
    }

    return { insights, recommendations }
  } catch (error) {
    console.error('[Run Analysis] Error analyzing observations:', error)
    return getDefaultAnalysis(taskOutcome)
  }
}

/**
 * Validate severity value
 */
function validateSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'positive' {
  const validSeverities = ['critical', 'high', 'medium', 'low', 'positive']
  const lower = (severity || '').toLowerCase()
  if (validSeverities.includes(lower)) {
    return lower as 'critical' | 'high' | 'medium' | 'low' | 'positive'
  }
  return 'medium' // Default to medium if invalid
}

/**
 * Generate default analysis when LLM fails or no observations
 */
function getDefaultAnalysis(taskOutcome: {
  success: boolean
  stepCount: number
  maxSteps: number
  strugglePoint?: string
}): RunAnalysisResult {
  const insights: RunInsight[] = []
  const recommendations: RunRecommendation[] = []

  if (taskOutcome.success) {
    insights.push({
      severity: 'positive',
      text: `Task completed successfully in ${taskOutcome.stepCount} steps.`,
    })
    
    if (taskOutcome.stepCount <= 10) {
      recommendations.push({
        priority: 1,
        title: 'Maintain Streamlined Flow',
        description: 'The task was completed efficiently. Continue maintaining this user experience.',
      })
    } else if (taskOutcome.stepCount > 15) {
      insights.push({
        severity: 'medium',
        text: `The task took ${taskOutcome.stepCount} steps which may feel lengthy for some users.`,
      })
      recommendations.push({
        priority: 1,
        title: 'Consider Streamlining',
        description: 'Review if any steps can be combined or eliminated to reduce task complexity.',
      })
    }
  } else {
    if (taskOutcome.strugglePoint) {
      insights.push({
        severity: 'high',
        text: `Task could not be completed: ${taskOutcome.strugglePoint}`,
      })
      recommendations.push({
        priority: 1,
        title: 'Address Primary Blocker',
        description: `Fix the issue that prevented task completion: ${taskOutcome.strugglePoint}`,
      })
    } else {
      insights.push({
        severity: 'high',
        text: 'Task could not be completed within the allowed steps.',
      })
      recommendations.push({
        priority: 1,
        title: 'Simplify User Flow',
        description: 'Review the task flow to identify and remove unnecessary complexity.',
      })
    }
  }

  return { insights, recommendations }
}
