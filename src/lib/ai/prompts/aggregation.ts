/**
 * Aggregation Prompts
 * 
 * Prompt templates for merging insights and generating summaries.
 */

import { InsightWithFrequency, RecommendationWithFrequency } from '../types'

/**
 * Generate prompt for creating finding titles from insights
 */
export function getGenerateFindingsPrompt(insights: InsightWithFrequency[]): string {
  return `You are formatting UX findings for a professional report. Each insight needs a clear, concise title and a detailed explanation.

## Input Insights
${insights.map((i, idx) => `${idx}. "${i.text}" [${i.severity.toUpperCase()}] (observed ${i.count}x)`).join('\n')}

## Your Task
For each insight above, create:
1. **Title**: Short, clear problem statement (5-8 words max, no period)
   - Should be scannable and actionable
   - Example: "Exact Username Search Creates Friction"
   
2. **Explanation**: 1-2 sentence detailed description
   - Explain WHY it's a problem
   - Include user impact
   - Be specific and actionable
   
3. **Suggested Fix**: Concrete, actionable solution (1 sentence)
   - What specifically should be changed
   - Example: "Implement fuzzy search that matches partial names and display suggested friends"

## Output Format
Return ONLY valid JSON (no markdown, no code blocks):
{
  "findings": [
    {
      "id": 0,
      "title": "Short Problem Statement",
      "explanation": "Detailed explanation of the issue and its impact on users.",
      "suggested_fix": "Specific actionable solution"
    }
  ]
}

CRITICAL: 
- Title must be DIFFERENT from explanation. Title = short headline, Explanation = detailed description.
- Process ALL ${insights.length} insights above - do NOT skip any!
- The findings array should have EXACTLY ${insights.length} items, one for each input insight.`
}

/**
 * Generate prompt for executive summary
 */
export function getExecutiveSummaryPrompt(data: {
  insights: InsightWithFrequency[]
  recommendations: RecommendationWithFrequency[]
  successRate: number
  totalRuns: number
  uxScore: number
  personas: string[]
}): string {
  const { insights, recommendations, successRate, totalRuns, uxScore, personas } = data
  
  const issueInsights = insights.filter(i => i.severity !== 'positive')
  const positiveInsights = insights.filter(i => i.severity === 'positive')
  const criticalCount = issueInsights.filter(i => i.severity === 'critical').length
  const highCount = issueInsights.filter(i => i.severity === 'high').length

  return `
## Task
Write a concise, professional executive summary (2-3 sentences) for a UX usability test report.

## Test Results
- Success Rate: ${Math.round(successRate)}%
- Total Runs: ${totalRuns}
- UX Score: ${uxScore}/100
- Personas Tested: ${personas.join(', ')}
- Critical Issues: ${criticalCount}
- High Priority Issues: ${highCount}
- Total Issues: ${issueInsights.length}
- Positive Elements: ${positiveInsights.length}

## Key Issues Identified
${issueInsights.slice(0, 3).map(i => `- [${i.severity.toUpperCase()}] ${i.text} (found by ${i.count} ${i.count === 1 ? 'persona' : 'personas'})`).join('\n')}

## Top Recommendations
${recommendations.slice(0, 2).map(r => `- ${r.title}: ${r.description}`).join('\n')}

## Instructions
Write an executive summary that:
1. Starts with the overall performance (success rate and UX score)
2. Highlights the most critical issue or pattern if any exist
3. Mentions positive aspects if they exist
4. Is actionable and business-focused
5. Is 2-3 sentences maximum
6. Uses professional, clear language

Respond with ONLY the summary text (no JSON, no markdown, no quotes):
`
}

/**
 * Generate prompt for merging similar insights
 */
export function getMergeInsightsPrompt(insights: InsightWithFrequency[]): string {
  return `You are a UX research analyst consolidating duplicate findings from a usability test. Your goal is to merge semantically similar insights while preserving distinct issues.

## Input Insights
${insights.map((i, idx) => `${idx}. "${i.text}" [${i.severity.toUpperCase()}] (observed ${i.count}x by: ${i.personas.join(', ')})`).join('\n')}

## Merging Rules
1. **SMART MERGING**: Merge only when insights are clearly about the SAME specific issue
   - Example: "exact username required", "cannot search by real name", "username must be exact" → MERGE (same issue)
   - Example: "small touch targets", "low contrast text" → KEEP SEPARATE (different issues)
   
2. **When to merge:**
   - Insights describing the EXACT SAME UI problem in different words
   - Multiple mentions of the same specific element/interaction
   - Same root cause and same fix needed
   
3. **When NOT to merge (Keep Separate):**
   - Different UI elements (e.g., buttons vs text fields)
   - Different user pain points (e.g., contrast vs spacing)
   - Different root causes
   - Requires different fixes

4. **Merged insight requirements:**
   - Clear, concise text (1-2 sentences max)
   - Highest severity from the group
   - Sum all counts
   - Combine all personas (unique)
   - Include the core issue + impact

5. **Target:** Preserve ALL distinct issues. Reduce duplication by 30-50%, NOT more.
   - If you have 12 insights about 8 different issues → aim for 8 merged insights
   - Only merge obvious duplicates, preserve distinct issues

## Real Example
Input:
0. "exact username search requirement is a major usability hurdle for beginners"
1. "Strict search requirements (exact username) are punishing"  
2. "Floating action buttons lack text labels" (DIFFERENT issue)
3. "FAB positioning obscures content" (DIFFERENT issue but related to FAB)

Merge strategy:
- Insights 0 & 1 → MERGE (same issue: exact username search)
- Insight 2 → KEEP SEPARATE (different issue: FAB labels)
- Insight 3 → KEEP SEPARATE (different issue: FAB positioning)

Output:
{
  "merged_insights": [
    {
      "text": "The requirement for exact username matches prevents users from searching by real names or partial matches, creating significant friction for beginners",
      "severity": "high",
      "count": 2,
      "personas": ["Persona A"],
      "merged_from": [0, 1]
    },
    {
      "text": "Floating action buttons lack text labels",
      "severity": "medium",
      "count": 1,
      "personas": ["Persona A"],
      "merged_from": [2]
    },
    {
      "text": "FAB positioning obscures content",
      "severity": "medium",
      "count": 1,
      "personas": ["Persona B"],
      "merged_from": [3]
    }
  ]
}

## Output Format
Return ONLY valid JSON (no markdown, no code blocks):
{
  "merged_insights": [
    {
      "text": "Single merged insight covering all related points",
      "severity": "critical|high|medium|low|positive",
      "count": sum of merged,
      "personas": ["Persona A", "Persona B"],
      "merged_from": [0, 1, 2]
    }
  ]
}

CRITICAL: Only merge OBVIOUS duplicates. Preserve distinct issues. Aim for 6-10 final insights from 12+ raw insights.`
}

/**
 * Generate prompt for merging similar recommendations
 */
export function getMergeRecommendationsPrompt(recommendations: RecommendationWithFrequency[]): string {
  return `You are a UX consultant consolidating recommendations from a usability test. Merge overlapping recommendations aggressively.

## Input Recommendations
${recommendations.map((r, idx) => `${idx}. "${r.title}" - ${r.description} (${r.count}x by: ${r.personas.join(', ')})`).join('\n\n')}

## Merging Rules
1. **SMART MERGING**: Merge only when recommendations address the EXACT SAME fix
   - Example: "Allow partial search", "Add name search", "Make search flexible" → MERGE (all about search improvement)
   - Example: "Increase touch targets", "Add labels to buttons" → KEEP SEPARATE (different fixes)

2. **When to merge:**
   - Recommendations fixing the same specific UI element
   - Multiple suggestions for the same feature improvement
   - Same technical solution required

3. **When NOT to merge (Keep Separate):**
   - Different UI elements (e.g., search vs buttons)
   - Different types of improvements (e.g., accessibility vs functionality)
   - Requires different technical solutions

4. **Merged recommendation requirements:**
   - Title: Clear, actionable, max 6 words
   - Description: Specific implementation guidance, 1-2 sentences
   - Sum all counts
   - Combine personas (unique)

5. **Target:** Preserve distinct recommendations. Reduce duplication by 30-40%, aim for 5-8 final recommendations.

## Real Example
Input:
0. "Allow partial username search"
1. "Add name-based friend search"
2. "Increase touch target sizes" (DIFFERENT)
3. "Add labels to action buttons" (DIFFERENT)

Output:
{
  "merged_recommendations": [
    {
      "title": "Improve Friend Search Flexibility",
      "description": "Allow partial name/username matches and implement fuzzy search.",
      "count": 2,
      "personas": ["Persona A"],
      "merged_from": [0, 1]
    },
    {
      "title": "Increase Touch Target Sizes",
      "description": "Enlarge interactive elements to at least 44×44 pixels.",
      "count": 1,
      "personas": ["Persona B"],
      "merged_from": [2]
    },
    {
      "title": "Add Labels to Action Buttons",
      "description": "Include text labels on icon-only buttons for clarity.",
      "count": 1,
      "personas": ["Persona C"],
      "merged_from": [3]
    }
  ]
}

## Output Format
Return ONLY valid JSON (no markdown, no code blocks):
{
  "merged_recommendations": [
    {
      "title": "Actionable Title",
      "description": "Specific implementation guidance",
      "count": count,
      "personas": ["Persona A"],
      "merged_from": [0, 1]
    }
  ]
}

CRITICAL: Only merge OBVIOUS duplicates. Preserve distinct recommendations. Aim for 5-8 final recommendations.`
}

/**
 * Generate prompt for comprehensive aggregated analysis
 * Generates findings (issues), positive findings (strengths), and recommendations separately
 */
export function getAggregatedAnalysisPrompt(data: {
  insights: InsightWithFrequency[]
  recommendations: RecommendationWithFrequency[]
  successRate: number
  totalRuns: number
}): string {
  const { insights, recommendations, successRate, totalRuns } = data
  
  // Separate positive and negative insights
  const issueInsights = insights.filter(i => i.severity !== 'positive')
  const positiveInsights = insights.filter(i => i.severity === 'positive')
  
  return `You are a senior UX research analyst creating a comprehensive usability report from aggregated test results.

## Test Overview
- **Success Rate**: ${Math.round(successRate)}%
- **Total Test Runs**: ${totalRuns}
- **Issue Insights Collected**: ${issueInsights.length}
- **Positive Insights Collected**: ${positiveInsights.length}

## Issue Insights (Problems Found)
${issueInsights.length > 0 
  ? issueInsights.map((i, idx) => `${idx}. [${i.severity.toUpperCase()}] "${i.text}" (observed ${i.count}x by: ${i.personas.join(', ')})`).join('\n')
  : 'No issues identified.'}

## Positive Insights (What Works Well)
${positiveInsights.length > 0
  ? positiveInsights.map((i, idx) => `${idx}. "${i.text}" (observed ${i.count}x by: ${i.personas.join(', ')})`).join('\n')
  : 'No specific positive insights recorded.'}

## Run-Level Recommendations
${recommendations.length > 0
  ? recommendations.map((r, idx) => `${idx}. "${r.title}" - ${r.description} (${r.count}x)`).join('\n')
  : 'No specific recommendations provided.'}

## Your Task
Generate a comprehensive analysis with THREE separate sections:

### 1. TOP FINDINGS (Issues Only) - Max 10
For each distinct UX issue, create:
- **title**: Short problem statement (5-8 words, scannable)
- **explanation**: 1-2 sentence description of the problem and its user impact
- **suggested_fix**: Concrete, actionable solution (1 sentence)
- **severity**: critical | high | medium | low (based on user impact)
- **frequency**: How many runs encountered this (use the count from input)

Sort by: severity (critical → high → medium → low), then frequency

### 2. POSITIVE FINDINGS (Strengths Only) - Max 3
For the most notable UX strengths, create:
- **title**: Short positive statement (5-8 words)
- **description**: Why this works well for users (1 sentence)
- **frequency**: How many runs observed this

Do NOT include "suggested_fix" for positive findings.
Focus on genuinely good UX patterns, not just "task completed" messages.

### 3. TOP RECOMMENDATIONS (Strategic) - Max 5
Create high-level, strategic recommendations that may address multiple findings:
- **title**: Actionable title (max 6 words)
- **description**: Concise implementation guidance (1-2 sentences)

These should be business-focused and address the most impactful issues.

## Output Format
Return ONLY valid JSON (no markdown, no code blocks):
{
  "findings": [
    {
      "title": "Short Problem Statement",
      "explanation": "Detailed explanation of the issue and user impact.",
      "suggested_fix": "Specific actionable solution.",
      "severity": "high",
      "frequency": 2
    }
  ],
  "positiveFindings": [
    {
      "title": "Clear UX Strength",
      "description": "Why this works well for users.",
      "frequency": 2
    }
  ],
  "recommendations": [
    {
      "title": "Strategic Action Item",
      "description": "Concise guidance addressing one or more issues."
    }
  ]
}

IMPORTANT RULES:
1. findings[] should ONLY contain issues (negative findings)
2. positiveFindings[] should ONLY contain strengths (positive aspects)
3. Do NOT mark positive aspects as issues with "medium" severity
4. Filter out vague or generic insights
5. Filter out automation/technical issues (element not found, selector failed)
6. Merge similar issues but preserve distinct problems
7. If success rate is high and few issues exist, focus on the positive findings`
}
