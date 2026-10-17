/**
 * Screenshot Analysis Module
 * 
 * AI-powered analysis of UI screenshots for usability testing.
 * Supports both single and batch analysis for parallel execution.
 */

import { AnalysisInput, PersonaAnalysisResult, ExperienceLog } from './types'
import { getScreenshotAnalysisPrompt } from './prompts/analysis'
import { Persona, ExperimentScreenshot } from '@/types/database'
import { LlmUsageTracker, extractTokenCounts, LlmUsageSummary } from './llm-usage'
import { getGenerativeModel, type GeminiPart } from './gemini-client'

const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3-flash-preview'

// Configuration for batch processing
const DEFAULT_MAX_CONCURRENT = 8  // Gemini can handle more concurrent requests

/**
 * Fetch an image as base64 data
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = blob.type || 'image/png'
    return { data: base64, mimeType }
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
}

/**
 * Analyze screenshots from a persona's perspective
 */
export async function analyzeScreenshotsForPersona(
  input: AnalysisInput,
  usageTracker?: LlmUsageTracker
): Promise<PersonaAnalysisResult> {
  if (!input.screenshots || input.screenshots.length === 0) {
    return {
      success: false,
      struggle_point: 'No Screenshots',
      reason: 'No screenshots provided for analysis',
      suggested_fix: 'Upload at least one screenshot',
      duration_ms: 0,
      logs: ['No screenshots to analyze'],
      experience_logs: [],
      insights: [],
      recommendations: [],
    }
  }

  const model = getGenerativeModel({ model: GEMINI_VISION_MODEL })
  const textPrompt = getScreenshotAnalysisPrompt(input)
  const tracker = usageTracker || new LlmUsageTracker()

  try {
    // Prepare image parts
    const imageParts: GeminiPart[] = []
    for (const screenshot of input.screenshots) {
      const imageData = await fetchImageAsBase64(screenshot.url)
      if (imageData) {
        imageParts.push({
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType,
          },
        })
      }
    }

    if (imageParts.length === 0) {
      throw new Error('Failed to load any screenshots')
    }

    const startTime = Date.now()
    const result = await model.generateContent([textPrompt, ...imageParts])
    const duration = Date.now() - startTime
    const response = result.response.text()

    const tokens = extractTokenCounts(result)
    tracker.record(GEMINI_VISION_MODEL, 'screenshot-analysis', tokens.input, tokens.output)

    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    return {
      success: parsed.success,
      struggle_point: parsed.struggle_point,
      reason: parsed.reason,
      suggested_fix: parsed.suggested_fix,
      duration_ms: duration,
      logs: parsed.experience_logs?.map((log: ExperienceLog) => log.observation) || [],
      experience_logs: parsed.experience_logs || [],
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      screenshot_issues: parsed.screenshot_issues || [],
      llm_usage: tracker.getSummary(),
    }
  } catch (error) {
    console.error('Error analyzing screenshots for persona:', error)
    return {
      success: false,
      struggle_point: 'Analysis Error',
      reason: `Failed to analyze screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggested_fix: null,
      duration_ms: 0,
      logs: ['Error occurred during screenshot analysis'],
      experience_logs: [],
      insights: [],
      recommendations: [],
    }
  }
}

// ============================================
// Batch Analysis for Parallel Execution
// ============================================

export interface BatchAnalysisTask {
  persona: Persona
  runNumber: number
}

export interface BatchAnalysisResult {
  persona: Persona
  runNumber: number
  result: PersonaAnalysisResult
}

export interface BatchAnalysisProgress {
  completed: number
  total: number
  current?: { persona: Persona; runNumber: number }
}

/**
 * Analyze screenshots for multiple personas in parallel batches
 * 
 * @param tasks - Array of persona/run configurations
 * @param screenshots - Screenshots to analyze
 * @param script - Task script
 * @param hypothesis - Optional hypothesis
 * @param maxConcurrent - Maximum concurrent API calls (default: 8)
 * @param onProgress - Optional progress callback
 */
export async function analyzeScreenshotsBatch(
  tasks: BatchAnalysisTask[],
  screenshots: ExperimentScreenshot[],
  script: string,
  hypothesis?: string,
  maxConcurrent: number = DEFAULT_MAX_CONCURRENT,
  onProgress?: (progress: BatchAnalysisProgress) => void
): Promise<BatchAnalysisResult[]> {
  const results: BatchAnalysisResult[] = []
  
  console.log(`[screenshot-analysis] Starting batch analysis: ${tasks.length} tasks, max concurrent: ${maxConcurrent}`)

  // Process in batches
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent)
    const batchNumber = Math.floor(i / maxConcurrent) + 1
    const totalBatches = Math.ceil(tasks.length / maxConcurrent)
    
    console.log(`[screenshot-analysis] Processing batch ${batchNumber}/${totalBatches}`)

    // Execute batch concurrently
    const batchPromises = batch.map(async (task) => {
      const { persona, runNumber } = task
      
      // Notify progress
      if (onProgress) {
        onProgress({
          completed: results.length,
          total: tasks.length,
          current: { persona, runNumber },
        })
      }

      try {
        const result = await analyzeScreenshotsForPersona({
          script,
          hypothesis,
          persona,
          screenshots,
        })

        return { persona, runNumber, result }
      } catch (error) {
        console.error(`[screenshot-analysis] Error for ${persona.name} run ${runNumber}:`, error)
        
        return {
          persona,
          runNumber,
          result: {
            success: false,
            struggle_point: 'Batch Analysis Error',
            reason: error instanceof Error ? error.message : 'Unknown error',
            suggested_fix: null,
            duration_ms: 0,
            logs: ['Error during batch analysis'],
            experience_logs: [],
            insights: [],
            recommendations: [],
          } as PersonaAnalysisResult,
        }
      }
    })

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises)
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }

    // Final progress update after batch
    if (onProgress) {
      onProgress({
        completed: results.length,
        total: tasks.length,
      })
    }
  }

  console.log(`[screenshot-analysis] Batch analysis complete: ${results.length}/${tasks.length} succeeded`)
  
  return results
}

/**
 * Create batch tasks from persona configurations
 */
export function createBatchTasks(
  personaConfigs: Array<{ persona: Persona; runsCount: number }>
): BatchAnalysisTask[] {
  const tasks: BatchAnalysisTask[] = []
  
  for (const { persona, runsCount } of personaConfigs) {
    for (let runNum = 1; runNum <= runsCount; runNum++) {
      tasks.push({ persona, runNumber: runNum })
    }
  }
  
  return tasks
}
