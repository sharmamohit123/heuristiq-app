/**
 * AI Module
 * 
 * Central export file for all AI-related functionality.
 * This provides backward compatibility with the original gemini.ts imports.
 */

// ============================================
// Type Exports
// ============================================
export type {
  AnalysisInput,
  PageAnalysisInput,
  ExperienceLog,
  RunInsight,
  RunRecommendation,
  InsightWithFrequency,
  RecommendationWithFrequency,
  PersonaAnalysisResult,
  Recommendation,
  PositiveFinding,
  AggregatedFindings,
  ABTestComparison,
  ABTestResult,
} from './types'

// ============================================
// Browser Agent (Live URL Testing)
// ============================================
export { analyzePageAndDecideAction } from './browser-agent'

// ============================================
// Screenshot Analysis
// ============================================
export { 
  analyzeScreenshotsForPersona,
  analyzeScreenshotsBatch,
  createBatchTasks,
} from './screenshot-analysis'
export type { 
  BatchAnalysisTask, 
  BatchAnalysisResult, 
  BatchAnalysisProgress 
} from './screenshot-analysis'

// ============================================
// A/B Test Analysis
// TODO: A/B testing is not part of MVP — to be implemented in a future release
// ============================================

// ============================================
// Run Analysis (Post-automation LLM analysis)
// ============================================
export { analyzeRunObservations } from './run-analysis'
export type { RunAnalysisResult } from './run-analysis'

// ============================================
// Aggregation
// ============================================
export { aggregateFindings } from './aggregation'

// ============================================
// Demo
// ============================================
export { runDemoAnalysis } from './demo'

// ============================================
// Prompts (for customization/debugging)
// ============================================
export { getPersonaBehaviorPrompt } from './prompts/persona-behavior'
export { getBrowserAgentPrompt } from './prompts/browser-agent'
export {
  getScreenshotAnalysisPrompt,
} from './prompts/analysis'
export {
  getGenerateFindingsPrompt,
  getExecutiveSummaryPrompt,
  getMergeInsightsPrompt,
  getMergeRecommendationsPrompt,
  getAggregatedAnalysisPrompt,
} from './prompts/aggregation'
export { getRunAnalysisPrompt } from './prompts/run-analysis'

// ============================================
// LLM Usage Tracking
// ============================================
export { LlmUsageTracker, extractTokenCounts, combineUsageSummaries } from './llm-usage'
export type { LlmCallRecord, LlmUsageSummary, LlmUsageCompact } from './llm-usage'
