/**
 * gemini.ts — Legacy compatibility shim
 *
 * All AI functionality has been refactored into the modular `ai/` directory.
 * This file re-exports from there so any stale runtime references still resolve.
 *
 * New code should import directly from '@/lib/ai'.
 */

export {
  analyzeScreenshotsForPersona,
  analyzeScreenshotsBatch,
  createBatchTasks,
  analyzePageAndDecideAction,
  analyzeRunObservations,
  aggregateFindings,
  runDemoAnalysis,
} from './ai'

export type {
  AnalysisInput,
  PageAnalysisInput,
  PersonaAnalysisResult,
  AggregatedFindings,
  ABTestComparison,
  ABTestResult,
  BatchAnalysisTask,
  BatchAnalysisResult,
  BatchAnalysisProgress,
  RunAnalysisResult,
} from './ai'
