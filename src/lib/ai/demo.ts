/**
 * Demo Analysis Module
 * 
 * Provides demo/sample data for testing and demonstration purposes.
 */

import { ExperimentRun } from '@/types/database'
import { AggregatedFindings } from './types'

/**
 * Run a demo analysis with sample data
 */
export async function runDemoAnalysis(): Promise<{
  runs: Omit<ExperimentRun, 'id' | 'experiment_id' | 'created_at'>[]
  findings: AggregatedFindings
}> {
  // Simulate demo results
  const demoRuns = [
    {
      persona_id: 'demo-first-time',
      run_number: 1,
      success: true,
      struggle_point: null,
      reason: 'User successfully completed the signup flow',
      suggested_fix: null,
      duration_ms: 45000,
      logs: null,
      recording_url: null,
      recording_expires_at: null,
      interaction_screenshots: null,
      llm_usage: null,
    },
    {
      persona_id: 'demo-power-user',
      run_number: 1,
      success: true,
      struggle_point: null,
      reason: 'Expert user navigated efficiently through the flow',
      suggested_fix: null,
      duration_ms: 22000,
      logs: null,
      recording_url: null,
      recording_expires_at: null,
      interaction_screenshots: null,
      llm_usage: null,
    },
    {
      persona_id: 'demo-price-sensitive',
      run_number: 1,
      success: false,
      struggle_point: 'Pricing page',
      reason: 'User could not find clear pricing information before signing up',
      suggested_fix: 'Add pricing visibility on the signup page',
      duration_ms: 67000,
      logs: null,
      recording_url: null,
      recording_expires_at: null,
      interaction_screenshots: null,
      llm_usage: null,
    },
  ]

  return {
    runs: demoRuns,
    findings: {
      findings: [
        {
          title: 'Unclear Pricing Information',
          explanation: 'Price-sensitive users struggle to find pricing before commitment',
          suggested_fix: 'Display pricing tiers prominently on the signup page',
          confidence: 'high',
          frequency: 1,
          severity: 'high',
          screenshot_url: null,
        },
      ],
      positiveFindings: [
        {
          title: 'Intuitive Navigation Flow',
          description: 'Most users found the signup flow straightforward and easy to follow',
          frequency: 2,
          confidence: 'high',
        },
      ],
      success_rate: 66.67,
      avg_duration_ms: 44667,
      ux_score: 78,
      summary: 'The signup flow works well for most users, but price-sensitive personas struggle to find pricing information before commitment.',
      recommendations: [
        {
          priority: 1,
          title: 'Display Pricing Prominently',
          description: 'Add pricing tiers to the signup page to help price-sensitive users make informed decisions.',
          impact: 'high',
          frequency: 1,
        },
      ],
    },
  }
}
