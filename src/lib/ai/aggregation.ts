/**
 * Aggregation Module
 * 
 * AI-powered aggregation and merging of findings across experiment runs.
 */

import { Persona, ExperimentRun, ConfidenceLevel } from '@/types/database'
import {
  AggregatedFindings,
  InsightWithFrequency,
  RecommendationWithFrequency,
  RunInsight,
  RunRecommendation,
} from './types'
import {
  getGenerateFindingsPrompt,
  getExecutiveSummaryPrompt,
  getMergeInsightsPrompt,
  getMergeRecommendationsPrompt,
  getAggregatedAnalysisPrompt,
} from './prompts/aggregation'
import { PositiveFinding } from './types'
import { LlmUsageTracker, extractTokenCounts } from './llm-usage'
import { getGenerativeModel } from './gemini-client'

const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'

/**
 * Generate finding titles and explanations from insights using AI
 */
async function generateFindingsWithTitles(
  insights: InsightWithFrequency[],
  totalRuns: number,
  model: any,
  usageTracker?: LlmUsageTracker
): Promise<Array<{
  title: string
  explanation: string
  suggested_fix: string | null
  confidence: ConfidenceLevel
  frequency: number
  severity: string
  screenshot_url: null
}>> {
  if (insights.length === 0) return []

  console.log('[Generate Findings] Processing', insights.length, 'insights into findings')

  const prompt = getGenerateFindingsPrompt(insights)

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'generate-findings', tokens.input, tokens.output)
    }
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    if (!parsed.findings || !Array.isArray(parsed.findings)) {
      console.error('[Generate Findings] Invalid response format:', parsed)
      // Fallback to simple format
      return insights.map((insight) => ({
        title: insight.text.split('.')[0].substring(0, 60).trim(),
        explanation: insight.text,
        suggested_fix: null,
        confidence: insight.count > totalRuns / 2 ? 'high' as ConfidenceLevel : 
                    insight.count > 1 ? 'medium' as ConfidenceLevel : 'low' as ConfidenceLevel,
        frequency: Math.min(insight.count, totalRuns),
        severity: insight.severity,
        screenshot_url: null,
      }))
    }

    // Validate AI returned correct number
    if (parsed.findings.length !== insights.length) {
      console.warn(`[Generate Findings] AI returned ${parsed.findings.length} findings but expected ${insights.length}. Using fallback for missing ones.`)
    }

    // Map parsed findings, using insight data for missing ones
    const generatedFindings = insights.map((insight, idx) => {
      const aiFinding = parsed.findings[idx]
      
      if (!aiFinding) {
        // Fallback if AI didn't generate this finding
        console.warn(`[Generate Findings] Missing finding at index ${idx}, using fallback`)
        return {
          title: insight.text.split('.')[0].substring(0, 60).trim(),
          explanation: insight.text,
          suggested_fix: null,
          confidence: insight.count > totalRuns / 2 ? 'high' as ConfidenceLevel : 
                      insight.count > 1 ? 'medium' as ConfidenceLevel : 'low' as ConfidenceLevel,
          frequency: Math.min(insight.count, totalRuns),
          severity: insight.severity,
          screenshot_url: null,
        }
      }

      return {
        title: aiFinding.title,
        explanation: aiFinding.explanation,
        suggested_fix: aiFinding.suggested_fix,
        confidence: insight.count > totalRuns / 2 ? 'high' as ConfidenceLevel : 
                    insight.count > 1 ? 'medium' as ConfidenceLevel : 'low' as ConfidenceLevel,
        frequency: Math.min(insight.count, totalRuns),
        severity: insight.severity,
        screenshot_url: null,
      }
    })

    console.log('[Generate Findings] Successfully generated', generatedFindings.length, 'findings from', insights.length, 'insights')
    
    return generatedFindings
  } catch (error) {
    console.error('[Generate Findings] Error:', error)
    // Fallback to simple format
    console.log('[Generate Findings] Using fallback format for all', insights.length, 'insights')
    return insights.map((insight) => ({
      title: insight.text.split('.')[0].substring(0, 60).trim(),
      explanation: insight.text,
      suggested_fix: null,
      confidence: insight.count > totalRuns / 2 ? 'high' as ConfidenceLevel : 
                  insight.count > 1 ? 'medium' as ConfidenceLevel : 'low' as ConfidenceLevel,
      frequency: Math.min(insight.count, totalRuns),
      severity: insight.severity,
      screenshot_url: null,
    }))
  }
}

/**
 * Generate an executive summary using AI
 */
async function generateExecutiveSummary(
  data: {
    insights: InsightWithFrequency[]
    recommendations: RecommendationWithFrequency[]
    successRate: number
    totalRuns: number
    uxScore: number
    personas: string[]
  },
  model: any,
  usageTracker?: LlmUsageTracker
): Promise<string> {
  const { insights, successRate, totalRuns, uxScore } = data
  
  const issueInsights = insights.filter(i => i.severity !== 'positive')
  const positiveInsights = insights.filter(i => i.severity === 'positive')
  const criticalCount = issueInsights.filter(i => i.severity === 'critical').length
  const highCount = issueInsights.filter(i => i.severity === 'high').length

  // If no insights, return default summary
  if (insights.length === 0) {
    return 'All test runs completed successfully without any usability issues. The interface appears to be intuitive and user-friendly across all tested personas.'
  }

  const prompt = getExecutiveSummaryPrompt(data)

  try {
    const result = await model.generateContent(prompt)
    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'executive-summary', tokens.input, tokens.output)
    }
    const summary = result.response.text().trim()
    
    // Remove any quotes or markdown that might have been added
    return summary.replace(/^["']|["']$/g, '').replace(/```.*?\n?/g, '').trim()
  } catch (error) {
    console.error('[Summary Generation] Error:', error)
    // Fallback to template-based summary
    if (criticalCount > 0) {
      return `The usability experiment identified ${criticalCount} critical ${criticalCount === 1 ? 'issue' : 'issues'} preventing task completion, along with ${issueInsights.length - criticalCount} additional concerns. Immediate action is recommended.`
    } else if (highCount > 0) {
      return `The experiment found ${highCount} high-priority ${highCount === 1 ? 'issue' : 'issues'} causing significant friction, with a ${Math.round(successRate)}% success rate across ${totalRuns} runs.`
    } else if (issueInsights.length > 0) {
      return `The interface performs well overall with a ${Math.round(successRate)}% success rate, though ${issueInsights.length} minor ${issueInsights.length === 1 ? 'issue was' : 'issues were'} identified.`
    } else {
      return `Excellent usability performance with ${positiveInsights.length} positive elements and a ${Math.round(successRate)}% success rate.`
    }
  }
}

/**
 * Merge similar insights using AI
 */
async function mergeInsightsWithAI(
  insights: InsightWithFrequency[],
  model: any,
  usageTracker?: LlmUsageTracker
): Promise<InsightWithFrequency[]> {
  if (insights.length <= 1) return insights

  const prompt = getMergeInsightsPrompt(insights)

  try {
    console.log('[AI Merge Insights] Starting with', insights.length, 'insights')
    
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'merge-insights', tokens.input, tokens.output)
    }
    console.log('[AI Merge Insights] Raw response length:', response.length)
    
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    if (!parsed.merged_insights || !Array.isArray(parsed.merged_insights)) {
      console.error('[AI Merge Insights] Invalid response format:', parsed)
      return insights
    }

    console.log('[AI Merge Insights] Success! Before =', insights.length, 'After =', parsed.merged_insights.length)
    
    const merged = parsed.merged_insights.map((mi: any) => ({
      severity: mi.severity,
      text: mi.text,
      count: mi.count,
      personas: Array.isArray(mi.personas) ? mi.personas : [],
    }))

    // Validate we didn't lose insights
    if (merged.length === 0 && insights.length > 0) {
      console.warn('[AI Merge Insights] Merge resulted in 0 insights, returning original')
      return insights
    }

    return merged
  } catch (error) {
    console.error('[AI Merge Insights] Error:', error)
    console.error('[AI Merge Insights] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Return original if AI merge fails
    return insights
  }
}

/**
 * Merge similar recommendations using AI
 */
async function mergeRecommendationsWithAI(
  recommendations: RecommendationWithFrequency[],
  model: any,
  usageTracker?: LlmUsageTracker
): Promise<RecommendationWithFrequency[]> {
  if (recommendations.length <= 1) return recommendations

  const prompt = getMergeRecommendationsPrompt(recommendations)

  try {
    console.log('[AI Merge Recommendations] Starting with', recommendations.length, 'recommendations')
    
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'merge-recommendations', tokens.input, tokens.output)
    }
    console.log('[AI Merge Recommendations] Raw response length:', response.length)
    
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    if (!parsed.merged_recommendations || !Array.isArray(parsed.merged_recommendations)) {
      console.error('[AI Merge Recommendations] Invalid response format:', parsed)
      return recommendations
    }

    console.log('[AI Merge Recommendations] Success! Before =', recommendations.length, 'After =', parsed.merged_recommendations.length)
    
    const merged = parsed.merged_recommendations.map((mr: any) => ({
      title: mr.title,
      description: mr.description,
      count: mr.count,
      personas: Array.isArray(mr.personas) ? mr.personas : [],
    }))

    // Validate we didn't lose recommendations
    if (merged.length === 0 && recommendations.length > 0) {
      console.warn('[AI Merge Recommendations] Merge resulted in 0 recommendations, returning original')
      return recommendations
    }

    return merged
  } catch (error) {
    console.error('[AI Merge Recommendations] Error:', error)
    console.error('[AI Merge Recommendations] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Return original if AI merge fails
    return recommendations
  }
}

/**
 * Generate comprehensive aggregated analysis using LLM
 * Returns findings (issues), positive findings (strengths), and recommendations separately
 */
async function generateAggregatedAnalysis(
  insights: InsightWithFrequency[],
  recommendations: RecommendationWithFrequency[],
  successRate: number,
  totalRuns: number,
  model: any,
  usageTracker?: LlmUsageTracker
): Promise<{
  findings: Array<{
    title: string
    explanation: string
    suggested_fix: string | null
    confidence: ConfidenceLevel
    frequency: number
    severity: string
    screenshot_url: null
  }>
  positiveFindings: PositiveFinding[]
  recommendations: Array<{
    priority: number
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    frequency?: number
  }>
}> {
  const prompt = getAggregatedAnalysisPrompt({
    insights,
    recommendations,
    successRate,
    totalRuns,
  })

  try {
    console.log('[Aggregated Analysis] Generating comprehensive analysis with LLM...')
    
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    if (usageTracker) {
      const tokens = extractTokenCounts(result)
      usageTracker.record(GEMINI_TEXT_MODEL, 'aggregated-analysis', tokens.input, tokens.output)
    }
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedResponse)

    // Extract findings (issues only)
    const findings = (parsed.findings || []).map((f: any, idx: number) => ({
      title: f.title || 'Unknown Issue',
      explanation: f.explanation || f.description || '',
      suggested_fix: f.suggested_fix || null,
      confidence: (f.frequency > totalRuns / 2 ? 'high' : f.frequency > 1 ? 'medium' : 'low') as ConfidenceLevel,
      frequency: Math.min(f.frequency || 1, totalRuns),
      severity: f.severity || 'medium',
      screenshot_url: null,
    }))

    // Extract positive findings (strengths)
    const positiveFindings: PositiveFinding[] = (parsed.positiveFindings || []).map((pf: any) => ({
      title: pf.title || 'Positive Aspect',
      description: pf.description || '',
      frequency: Math.min(pf.frequency || 1, totalRuns),
      confidence: (pf.frequency > totalRuns / 2 ? 'high' : pf.frequency > 1 ? 'medium' : 'low') as ConfidenceLevel,
    }))

    // Extract recommendations
    const topRecommendations = (parsed.recommendations || []).map((r: any, idx: number) => ({
      priority: idx + 1,
      title: r.title || 'Recommendation',
      description: r.description || '',
      impact: 'medium' as const,
      frequency: 1,
    }))

    console.log(`[Aggregated Analysis] Generated ${findings.length} findings, ${positiveFindings.length} positive findings, ${topRecommendations.length} recommendations`)
    
    return { findings, positiveFindings, recommendations: topRecommendations }
  } catch (error) {
    console.error('[Aggregated Analysis] Error:', error)
    // Fallback: return empty arrays
    return { findings: [], positiveFindings: [], recommendations: [] }
  }
}

/**
 * Aggregate findings from multiple experiment runs
 */
export async function aggregateFindings(
  runs: ExperimentRun[],
  personas: Persona[]
): Promise<AggregatedFindings> {
  const model = getGenerativeModel({ model: GEMINI_TEXT_MODEL })
  const usageTracker = new LlmUsageTracker()

  // Calculate basic metrics
  const successfulRuns = runs.filter((r) => r.success)
  const success_rate = runs.length > 0 ? (successfulRuns.length / runs.length) * 100 : 0
  const avg_duration_ms =
    runs.length > 0
      ? runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / runs.length
      : 0

  // Extract insights and recommendations from all runs
  const insightMap = new Map<string, InsightWithFrequency>()
  const recommendationMap = new Map<string, RecommendationWithFrequency>()

  runs.forEach((run, runIdx) => {
    const personaName = personas.find((p) => p.id === run.persona_id)?.name || 'Unknown'
    const logsData = run.logs as any

    console.log(`[Aggregation] Processing run #${runIdx + 1}:`, {
      persona: personaName,
      runNumber: run.run_number,
      hasLogs: !!logsData,
      logKeys: logsData ? Object.keys(logsData) : [],
      hasInsights: !!logsData?.insights,
      insightsCount: logsData?.insights?.length || 0,
      hasRecommendations: !!logsData?.recommendations,
      recommendationsCount: logsData?.recommendations?.length || 0,
    })

    // Extract insights
    if (logsData?.insights && Array.isArray(logsData.insights)) {
      console.log(`[Aggregation] Run #${runIdx + 1} insights:`, logsData.insights.map((i: RunInsight) => ({
        severity: i.severity,
        text: i.text.substring(0, 50) + '...',
      })))
      
      logsData.insights.forEach((insight: RunInsight) => {
        // Use text as key for exact matching
        const key = insight.text.toLowerCase().trim()
        if (insightMap.has(key)) {
          const existing = insightMap.get(key)!
          existing.count++
          if (!existing.personas.includes(personaName)) {
            existing.personas.push(personaName)
          }
        } else {
          insightMap.set(key, {
            severity: insight.severity,
            text: insight.text,
            count: 1,
            personas: [personaName],
          })
        }
      })
    } else {
      console.warn(`[Aggregation] Run #${runIdx + 1} has no insights!`)
    }

    // Extract recommendations
    if (logsData?.recommendations && Array.isArray(logsData.recommendations)) {
      console.log(`[Aggregation] Run #${runIdx + 1} recommendations:`, logsData.recommendations.map((r: RunRecommendation) => r.title))
      
      logsData.recommendations.forEach((rec: RunRecommendation) => {
        const key = rec.title.toLowerCase().trim()
        if (recommendationMap.has(key)) {
          const existing = recommendationMap.get(key)!
          existing.count++
          if (!existing.personas.includes(personaName)) {
            existing.personas.push(personaName)
          }
        } else {
          recommendationMap.set(key, {
            title: rec.title,
            description: rec.description,
            count: 1,
            personas: [personaName],
          })
        }
      })
    } else {
      console.warn(`[Aggregation] Run #${runIdx + 1} has no recommendations!`)
    }
  })

  // Convert to arrays
  const allInsights = Array.from(insightMap.values())
  const allRecommendations = Array.from(recommendationMap.values())

  console.log('[Aggregation] ========================================')
  console.log('[Aggregation] STEP 1: Raw Collection')
  console.log('[Aggregation] Raw insights collected:', allInsights.length)
  console.log('[Aggregation] Raw recommendations collected:', allRecommendations.length)
  
  // Log ALL raw insights
  if (allInsights.length > 0) {
    console.log('[Aggregation] ALL raw insights:')
    allInsights.forEach((i, idx) => {
      console.log(`  ${idx + 1}. [${i.severity.toUpperCase()}] ${i.text.substring(0, 80)}... (${i.count}x)`)
    })
  }

  // Use AI to intelligently merge similar insights and recommendations
  console.log('[Aggregation] ----------------------------------------')
  console.log('[Aggregation] STEP 2: AI Merging')
  console.log('[Aggregation] Starting AI merge for insights...')
  const mergedInsights = allInsights.length > 0 
    ? await mergeInsightsWithAI(allInsights, model, usageTracker)
    : []
  
  console.log('[Aggregation] Starting AI merge for recommendations...')
  const mergedRecommendations = allRecommendations.length > 0
    ? await mergeRecommendationsWithAI(allRecommendations, model, usageTracker)
    : []

  console.log('[Aggregation] ----------------------------------------')
  console.log('[Aggregation] STEP 3: After AI Merging')
  console.log('[Aggregation] Merged insights count:', mergedInsights.length)
  console.log('[Aggregation] Merged recommendations count:', mergedRecommendations.length)
  
  // Log ALL merged insights
  if (mergedInsights.length > 0) {
    console.log('[Aggregation] ALL merged insights:')
    mergedInsights.forEach((i, idx) => {
      console.log(`  ${idx + 1}. [${i.severity.toUpperCase()}] ${i.text.substring(0, 80)}... (${i.count}x)`)
    })
  }
  
  // Log ALL merged recommendations
  if (mergedRecommendations.length > 0) {
    console.log('[Aggregation] ALL merged recommendations:')
    mergedRecommendations.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.title} (${r.count}x)`)
    })
  }

  // Sort insights by frequency then severity
  const severityOrder: Record<string, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    positive: 5,
  }
  
  mergedInsights.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999)
  })

  // Sort recommendations by frequency
  mergedRecommendations.sort((a, b) => b.count - a.count)

  // Calculate UX score based on insights
  // Start with base score heavily weighted by success rate (40-100)
  let uxScore = Math.round(40 + (success_rate * 0.6)) // Base 40-100 depending on success rate
  
  // Separate positive and negative insights
  const positiveInsights = mergedInsights.filter(i => i.severity === 'positive')
  const negativeInsights = mergedInsights.filter(i => i.severity !== 'positive')
  
  // Calculate positive contribution (capped at +15)
  const positiveBonus = Math.min(15, positiveInsights.reduce((sum, i) => sum + (2 * i.count), 0))
  uxScore += positiveBonus
  
  // Calculate total negative deduction (more balanced approach)
  // Use weighted severity scores but cap total deduction
  let totalDeduction = 0
  const severityWeights = { critical: 12, high: 8, medium: 4, low: 2 }
  
  negativeInsights.forEach((insight) => {
    const weight = severityWeights[insight.severity as keyof typeof severityWeights] || 4
    // Apply diminishing returns: first occurrence full weight, additional occurrences halved
    const effectiveWeight = weight + (Math.min(insight.count - 1, 2) * (weight / 2))
    totalDeduction += effectiveWeight
  })
  
  // Cap total deduction at 50 points maximum (ensures score never goes below ~25 with good success rate)
  const cappedDeduction = Math.min(totalDeduction, 50)
  uxScore -= cappedDeduction
  
  // Ensure score is within bounds (minimum 10 if there's any success)
  const minScore = success_rate > 0 ? 10 : 0
  uxScore = Math.max(minScore, Math.min(100, uxScore))
  
  console.log(`[Aggregation] UX Score calculation:`)
  console.log(`  - Base score (from ${success_rate}% success): ${Math.round(40 + (success_rate * 0.6))}`)
  console.log(`  - Positive bonus: +${positiveBonus} (from ${positiveInsights.length} positive insights)`)
  console.log(`  - Raw deduction: -${totalDeduction} (from ${negativeInsights.length} issues)`)
  console.log(`  - Capped deduction: -${cappedDeduction}`)
  console.log(`  - Final score: ${uxScore}`)

  // Separate positive and negative insights for better handling
  const issueInsights = mergedInsights.filter(i => i.severity !== 'positive')

  // If no insights at all, check if it's due to success or failure
  if (allInsights.length === 0) {
    // If success rate is very low, it means experiments failed but AI didn't generate insights
    if (success_rate < 50) {
      return {
        findings: [],
        positiveFindings: [],
        success_rate,
        avg_duration_ms,
        ux_score: Math.max(0, Math.round(success_rate * 0.8)),
        summary: `The experiment encountered significant issues with a ${Math.round(success_rate)}% success rate across ${runs.length} runs. ${runs.filter(r => !r.success).length} ${runs.filter(r => !r.success).length === 1 ? 'run' : 'runs'} failed to complete. Further investigation is recommended to identify the root causes.`,
        recommendations: [{
          priority: 1,
          title: 'Investigate Failed Runs',
          description: 'Review the failed experiment runs to identify common failure patterns and technical issues that prevented successful completion.',
          impact: 'high',
          frequency: 1,
        }],
      }
    }
    
    // High success rate with no insights = genuinely good UX
    return {
      findings: [],
      positiveFindings: [{
        title: 'Smooth User Experience',
        description: 'All test runs completed without any identified usability issues.',
        frequency: runs.length,
        confidence: 'high' as ConfidenceLevel,
      }],
      success_rate,
      avg_duration_ms,
      ux_score: 95,
      summary: 'All test runs completed successfully without any usability issues. The interface appears to be intuitive and user-friendly across all tested personas.',
      recommendations: [{
        priority: 1,
        title: 'Continue monitoring',
        description: 'While no issues were found, continue monitoring user behavior and gathering feedback for potential improvements.',
        impact: 'low',
        frequency: 1,
      }],
    }
  }

  // Use the new comprehensive LLM analysis to generate findings, positive findings, and recommendations
  console.log('[Aggregation] STEP 4: Generating comprehensive analysis with LLM...')
  const aggregatedAnalysis = await generateAggregatedAnalysis(
    mergedInsights,
    mergedRecommendations,
    success_rate,
    runs.length,
    model,
    usageTracker
  )

  // If LLM analysis returned results, use them; otherwise fall back to legacy approach
  let findings = aggregatedAnalysis.findings
  let positiveFindings = aggregatedAnalysis.positiveFindings
  let topRecommendations = aggregatedAnalysis.recommendations

  // Fallback: If LLM didn't generate findings, use legacy approach
  if (findings.length === 0 && issueInsights.length > 0) {
    console.log('[Aggregation] LLM returned no findings, using legacy approach...')
    findings = await generateFindingsWithTitles(issueInsights, runs.length, model, usageTracker)
  }

  // Fallback: If LLM didn't generate positive findings, create them from positive insights
  if (positiveFindings.length === 0 && positiveInsights.length > 0) {
    console.log('[Aggregation] LLM returned no positive findings, creating from insights...')
    positiveFindings = positiveInsights.slice(0, 3).map(pi => ({
      title: pi.text.split('.')[0].substring(0, 60).trim(),
      description: pi.text,
      frequency: pi.count,
      confidence: (pi.count > runs.length / 2 ? 'high' : pi.count > 1 ? 'medium' : 'low') as ConfidenceLevel,
    }))
  }

  // Fallback: If LLM didn't generate recommendations, use legacy approach
  if (topRecommendations.length === 0 && mergedRecommendations.length > 0) {
    console.log('[Aggregation] LLM returned no recommendations, using legacy approach...')
    topRecommendations = mergedRecommendations.slice(0, 5).map((rec, idx) => ({
      priority: idx + 1,
      title: rec.title,
      description: rec.description,
      impact: rec.count > runs.length / 2 ? 'high' as const : 
              rec.count > 1 ? 'medium' as const : 'low' as const,
      frequency: rec.count,
    }))
  }

  // Generate contextual summary using AI
  const summary = await generateExecutiveSummary({
    insights: mergedInsights,
    recommendations: mergedRecommendations,
    successRate: success_rate,
    totalRuns: runs.length,
    uxScore,
    personas: personas.map(p => p.name),
  }, model, usageTracker)

  const llmUsage = usageTracker.getSummary()
  console.log(`[Aggregation] LLM Usage: ${llmUsage.total_calls} calls, ${llmUsage.total_input_tokens} input tokens, ${llmUsage.total_output_tokens} output tokens, $${llmUsage.total_cost_usd}`)

  const result: AggregatedFindings = {
    findings,
    positiveFindings,
    success_rate,
    avg_duration_ms,
    ux_score: uxScore,
    summary,
    recommendations: topRecommendations,
    llm_usage: llmUsage,
  }

  console.log('[Aggregation] ========================================')
  console.log('[Aggregation] FINAL RESULT')
  console.log('[Aggregation] Findings (issues) to save:', findings.length)
  console.log('[Aggregation] Positive findings to save:', positiveFindings.length)
  console.log('[Aggregation] Recommendations to save:', topRecommendations.length)
  console.log('[Aggregation] UX Score:', uxScore)
  console.log('[Aggregation] Summary preview:', summary.substring(0, 100) + '...')
  console.log('[Aggregation] ========================================')
  
  if (findings.length > 0) {
    console.log('[Aggregation] ALL FINDINGS (ISSUES) BEING SAVED:')
    findings.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.severity.toUpperCase()}] ${f.title} (${f.frequency}x)`)
    })
  }
  
  if (positiveFindings.length > 0) {
    console.log('[Aggregation] POSITIVE FINDINGS BEING SAVED:')
    positiveFindings.forEach((pf, idx) => {
      console.log(`  ${idx + 1}. ${pf.title} (${pf.frequency}x)`)
    })
  }

  return result
}
