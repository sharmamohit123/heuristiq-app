/**
 * AI Module Types
 * 
 * Shared type definitions for all AI-related functionality.
 */

import { Persona, ExperimentScreenshot, AINavigationDecision, ConfidenceLevel } from '@/types/database'

// ============================================
// Input Types
// ============================================

export interface AnalysisInput {
  script: string
  hypothesis?: string
  persona: Persona
  screenshots?: ExperimentScreenshot[]
}

export interface PageAnalysisInput {
  screenshot: Buffer
  domStructure: string
  currentUrl: string
  pageTitle: string
  persona: Persona
  script: string
  hypothesis?: string
  previousActions: AINavigationDecision[]
  stepNumber: number
  maxSteps: number
}

// ============================================
// Log & Insight Types
// ============================================

export interface ExperienceLog {
  screenshot_id: string
  step: number
  timestamp: string
  observation: string
  action: string
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'positive'
}

export interface RunInsight {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'positive'
  text: string
  screenshot_id?: string
}

export interface RunRecommendation {
  priority: number
  title: string
  description: string
}

export interface InsightWithFrequency {
  severity: string
  text: string
  count: number
  personas: string[]
}

export interface RecommendationWithFrequency {
  title: string
  description: string
  count: number
  personas: string[]
}

// ============================================
// Result Types
// ============================================

export interface PersonaAnalysisResult {
  success: boolean
  struggle_point: string | null
  reason: string | null
  suggested_fix: string | null
  duration_ms: number
  logs: string[]
  experience_logs: ExperienceLog[]
  insights: RunInsight[]
  recommendations: RunRecommendation[]
  screenshot_issues?: { screenshot_id: string; issue: string }[]
  llm_usage?: LlmUsageSummary
}

export interface Recommendation {
  priority: number
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  frequency?: number
}

export interface PositiveFinding {
  title: string
  description: string
  frequency: number
  confidence: ConfidenceLevel
}

export interface LlmUsageSummary {
  model: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

export interface AggregatedFindings {
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
  success_rate: number
  avg_duration_ms: number
  ux_score: number
  summary?: string
  recommendations?: Recommendation[]
  llm_usage?: LlmUsageSummary
}

// TODO: A/B testing types — not part of MVP, to be implemented in a future release
export interface ABTestComparison {
  winner: 'control' | 'variant' | 'tie'
  reasoning: string
  key_differences: string[]
}

export interface ABTestResult {
  control: PersonaAnalysisResult
  variant: PersonaAnalysisResult
  comparison: ABTestComparison
}
