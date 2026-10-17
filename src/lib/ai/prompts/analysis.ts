/**
 * Analysis Prompts
 * 
 * Prompt templates for screenshot-based analysis.
 */

import { AnalysisInput } from '../types'
import { getPersonaBehaviorPrompt } from './persona-behavior'

/**
 * Generate prompt for screenshot-based analysis
 */
export function getScreenshotAnalysisPrompt(input: AnalysisInput): string {
  const personaBehavior = getPersonaBehaviorPrompt(input.persona)

  const screenshotDescriptions = input.screenshots
    ?.map((s, i) => `Screenshot ${i + 1}: ${s.context || 'No context provided'}`)
    .join('\n') || 'No screenshots provided'

  return `
${personaBehavior}

## Task
Analyze the following UI screenshots from this persona's perspective. These screenshots represent screens from a web/mobile application in sequential order.

## Screenshots Provided
${screenshotDescriptions}

## Research Goal / Task
${input.script}

${input.hypothesis ? `## Hypothesis to Test\n${input.hypothesis}` : ''}

## Instructions
Carefully examine each screenshot and analyze the user experience as this specific persona would perceive it. Consider:

1. **Visual Hierarchy**: Is the most important information prominent? Can this persona easily identify what to do?
2. **Clarity**: Are labels, buttons, and instructions clear for this experience level?
3. **Accessibility**: Are touch targets appropriate? Is text readable? Is contrast sufficient?
4. **Cognitive Load**: Is there too much information? Would this persona feel overwhelmed?
5. **Navigation**: Is it clear how to proceed? Are there confusing elements?
6. **Trust Signals**: Would this persona trust this interface?
7. **Error Prevention**: Are there potential error states this persona might encounter?
8. **Device Appropriateness**: Does the design work well for their device type?

## Severity Levels
- **critical**: Complete blockers preventing task completion
- **high**: Major issues causing significant friction or confusion
- **medium**: Moderate issues causing minor delays or frustration
- **low**: Minor issues with minimal impact
- **positive**: Elements that work exceptionally well

Respond in the following JSON format ONLY (no markdown):
{
  "success": true or false (would this persona successfully complete the task?),
  "struggle_point": "The most critical issue found, or null if successful",
  "reason": "Detailed explanation of the overall experience",
  "suggested_fix": "The most impactful fix recommendation, or null",
  "experience_logs": [
    {
      "screenshot_id": "Screenshot 1, 2, etc.",
      "step": 1,
      "timestamp": "00:05.2s",
      "observation": "Detailed observation of what the persona noticed or experienced",
      "action": "What action the persona took or tried to take",
      "severity": "critical|high|medium|low|positive"
    }
  ],
  "insights": [
    {
      "severity": "critical|high|medium|low|positive",
      "text": "Concise insight about a specific UX issue or positive element",
      "screenshot_id": "Screenshot 1" (optional, if tied to specific screen)
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "Short recommendation title",
      "description": "Detailed actionable recommendation"
    }
  ],
  "screenshot_issues": [
    {"screenshot_id": "Screenshot 1", "issue": "Specific issue on this screen"}
  ]
}

IMPORTANT: 
- Provide multiple experience_logs entries (2-4 per screenshot)
- Generate 3-5 insights sorted by severity
- Provide 3 prioritized recommendations
- Be specific and actionable in all observations
`
}
