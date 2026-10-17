/**
 * Run Analysis Prompts
 * 
 * Prompt templates for analyzing UX observations after a run completes.
 */

import { Persona } from '@/types/database'

export interface RunAnalysisInput {
  observations: string[]
  persona: Persona
  taskScript: string
  taskOutcome: {
    success: boolean
    stepCount: number
    maxSteps: number
    strugglePoint?: string
  }
}

/**
 * Generate the prompt for analyzing run observations and generating curated insights
 */
export function getRunAnalysisPrompt(input: RunAnalysisInput): string {
  const { observations, persona, taskScript, taskOutcome } = input
  
  const observationsList = observations
    .map((obs, idx) => `${idx + 1}. "${obs}"`)
    .join('\n')

  return `You are a UX research analyst reviewing observations from a usability test session.

## Persona Context
- **Name**: ${persona.name}
- **Experience Level**: ${persona.experience_level}
- **Device**: ${persona.device_type}
- **Patience Level**: ${persona.patience_level}
- **Description**: ${persona.description || 'Standard test user'}

## Task Given
${taskScript}

## Task Outcome
- **Success**: ${taskOutcome.success ? 'Yes' : 'No'}
- **Steps Taken**: ${taskOutcome.stepCount} of ${taskOutcome.maxSteps} max
${taskOutcome.strugglePoint ? `- **Struggle Point**: ${taskOutcome.strugglePoint}` : ''}

## Raw UX Observations (from each step)
${observationsList}

## Your Task
Analyze these observations and generate:

### 1. KEY INSIGHTS (3-8 important findings)
Select only the most important UX insights. Each insight should:
- Be a genuine UX issue or strength that affects user experience
- Have appropriate severity based on user impact
- Include brief screen/context info when relevant

**Severity Guidelines:**
- **critical**: Prevents task completion, major blocker
- **high**: Significant friction, causes frustration or confusion
- **medium**: Notable issue but doesn't block progress
- **low**: Minor inconvenience, cosmetic issue
- **positive**: Something that works well and enhances UX

**FILTER OUT:**
- Vague/generic observations (e.g., "The UI looks fine")
- Automation/technical issues (e.g., "element not found", "selector failed")
- Redundant observations that say the same thing
- Observations that just describe actions without UX insight

### 2. TOP RECOMMENDATIONS (2-4 actionable suggestions)
Based on the insights, provide specific recommendations to improve the experience.
Each recommendation should be actionable and address one or more identified issues.

## Output Format
Return ONLY valid JSON (no markdown, no code blocks):
{
  "insights": [
    {
      "severity": "critical|high|medium|low|positive",
      "text": "Clear description of the UX insight",
      "screenContext": "e.g., Login screen, Profile page, Dashboard"
    }
  ],
  "recommendations": [
    {
      "title": "Short actionable title (max 6 words)",
      "description": "Specific recommendation with implementation guidance"
    }
  ]
}

IMPORTANT:
- Return 3-8 insights maximum (only the important ones)
- Return 2-4 recommendations maximum
- Do NOT include all observations - curate only meaningful ones
- Positive insights are welcome when something genuinely works well
- Consider the persona's experience level when assessing severity`
}
