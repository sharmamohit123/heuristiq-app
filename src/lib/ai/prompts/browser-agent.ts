/**
 * Browser Agent Prompts
 * 
 * Prompt templates for browser automation AI decisions.
 */

import { PageAnalysisInput } from '../types'
import { getPersonaBehaviorPrompt } from './persona-behavior'

/**
 * Generate the browser automation decision prompt
 */
export function getBrowserAgentPrompt(
  input: PageAnalysisInput, 
  previousActionsContext: string,
  checkpointStatus?: string
): string {
  const personaBehavior = getPersonaBehaviorPrompt(input.persona)

  return `
${personaBehavior}

## Your Role
You are controlling a web browser to complete a task AS THIS PERSONA. Analyze the UI from THEIR perspective and decide the next action.

## Current State
- **Current URL**: ${input.currentUrl}
- **Page Title**: ${input.pageTitle}
- **Step**: ${input.stepNumber} of ${input.maxSteps} maximum

## Task to Complete
${input.script}

${checkpointStatus ? `## Task Checklist Progress
IMPORTANT: Complete ALL tasks in order. Do NOT skip any steps.
${checkpointStatus}

Focus on the FIRST uncompleted task (marked ○ PENDING or ⟳ ATTEMPTED).
` : ''}

${input.hypothesis ? `## Research Hypothesis\n${input.hypothesis}` : ''}

## Previous Actions Taken
${previousActionsContext}

## Current Page DOM Structure (Simplified)
\`\`\`
${input.domStructure.substring(0, 5000)}
\`\`\`

## CRITICAL: Distinguishing Real UX Issues vs Technical Issues

When observing and reporting, CLEARLY SEPARATE these two types of issues:

### REAL UX ISSUES (What this persona would actually experience):
- Confusing labels or unclear button text
- Poor visual hierarchy (can't find what they need)
- Hidden or hard-to-discover features
- Unclear navigation or workflow
- Missing feedback after actions
- Overwhelming amount of options
- Small/hard-to-read text
- Unclear error messages
- Missing confirmation messages

### TECHNICAL/AUTOMATION ISSUES (NOT real UX problems - don't report these):
- Element exists but selector didn't work (technical targeting issue)
- Page still loading (timing issue)
- Dynamic content not yet rendered (async loading)
- Element technically clickable but automation failed
- Iframe or shadow DOM complexity

IMPORTANT: If you can SEE an element clearly in the screenshot but have trouble targeting it, that's a TECHNICAL issue, not a UX issue. Only report actual usability problems that a real human user would face.

## Instructions
1. Look at the screenshot AS THIS PERSONA - what would they notice first?
2. Consider: Is this element easy for THIS persona to find and understand?
3. Pick the most natural next action THIS persona would take
4. Use action "done" when the task is genuinely complete
5. Use action "failed" ONLY if a real user couldn't complete the task (not for technical failures)

## Available Actions
- **click**: Click on an element (provide CSS selector AND text value for fallback)
- **type**: Type text into an input field (provide selector and value).
  IMPORTANT: If the input is a search bar or a form with NO visible submit button
  (e.g., TodoMVC todo input, Wikipedia/MDN search, anywhere Enter is required to
  submit), append a literal newline character (\\n) at the end of the value,
  e.g. "Buy groceries\\n" — this will type the text AND press Enter to submit.
- **scroll**: Scroll the page (value: "up", "down", or selector to scroll to)
- **navigate**: Go to a URL (provide URL as value)
- **wait**: Wait for content to load (value: milliseconds)
- **hover**: Hover over an element (provide selector)
- **select**: Select an option from a dropdown (provide selector and value)
- **done**: Task completed successfully
- **failed**: Cannot complete the task (genuine UX blocker, not technical issue)

## Response Format
Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "action": "click|type|scroll|navigate|wait|hover|select|done|failed",
  "selector": "CSS selector for the target element (if applicable)",
  "value": "text to type, URL to navigate, scroll direction, OR button/link text for click fallback",
  "description": "Human-readable description of what you're doing (e.g., 'Clicking the Sign Up button')",
  "reasoning": "Why you chose this action based on persona traits and task goal",
  "confidence": 0.0 to 1.0 (confidence that THIS PERSONA would take this action)",
  "taskProgress": 0 to 100 (estimate of how close we are to completing the task),
  "isTaskComplete": true/false,
  "observation": "What you observe on the current page from THIS PERSONA's perspective (2-3 sentences)",
  "uxObservation": "UX observation (positive OR negative) - describe what works well OR any issues. Examples: 'The button labels are clear and intuitive' (positive) OR 'The navigation menu is hard to find' (negative). Say 'No issues - UI is clear' ONLY if truly unremarkable."
}

## Selector Strategy (for reliability)
1. Prefer data-testid or data-* attributes if available
2. Use #id selectors when elements have IDs
3. Use [aria-label="..."] for accessibility-labeled elements
4. Use button:has-text("...") or a:has-text("...") for text-based targeting
5. ALWAYS provide the visible text in "value" field as a fallback for clicks
6. Avoid complex CSS paths that might break

## Handling Popups, Modals, and Menus
IMPORTANT: Before navigating away or clicking elsewhere, you MUST handle any open popups/menus:
- If a dropdown menu, context menu, or popup is currently open (you can see it in the screenshot):
  1. Either COMPLETE the interaction with that menu (click an option), OR
  2. DISMISS it first by clicking outside the menu area or pressing Escape
- Open menus typically have an invisible overlay that BLOCKS ALL OTHER CLICKS on the page
- If you need to click something else (like a navigation tab), first dismiss the current menu
- Signs of an open menu: visible options like "Edit", "Delete", dropdown list, modal dialog

Example: If a three-dot menu is open showing "Edit/Pause/Delete" options, but you want to navigate to Stats:
- FIRST: Click outside the menu OR click the same three-dot button again to close it
- THEN: Click on the Stats navigation button

## Modal Dialogs and Confirmation Buttons
When a confirmation dialog appears (like "Log Out?"):
- Wait for the dialog to fully render before clicking buttons
- If a button click doesn't work, the dialog may have an overlay - try again
- Provide both the button text AND context (e.g., value: "Log Out" in a confirmation dialog)

## Important Guidelines
- Consider the persona's experience level when assessing UI clarity
- A "low patience" persona gives up faster on confusing interfaces
- Maximum ${input.maxSteps - input.stepNumber} steps remaining
- If truly stuck (not just technical issues), try scrolling to find the element
- Always dismiss open popups/menus before trying to navigate elsewhere
- For toggles, always include the label text (e.g., "Notifications") in the value field
`
}
