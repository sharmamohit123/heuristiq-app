import { Experiment, ExperimentRun, Persona, Finding, ExperimentScreenshot } from '@/types/database'
import { format } from 'date-fns'

interface ExportData {
  experiment: Experiment & { project?: { name: string } }
  findings: Finding[]
  runs: (ExperimentRun & { persona?: Persona })[]
  personas: Persona[]
  screenshots?: ExperimentScreenshot[]
}

interface Recommendation {
  priority: number
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  frequency?: number
}

export function generateMarkdownReport(data: ExportData): string {
  const { experiment, findings, runs, personas, screenshots } = data
  const results = experiment.results as any
  
  const successRate = results?.success_rate || 0
  const avgDuration = results?.avg_duration_ms ? Math.round(results.avg_duration_ms / 1000) : 0
  const uxScore = results?.ux_score || 0
  const totalRuns = runs.length
  const successfulRuns = runs.filter(r => r.success).length
  const failedRuns = runs.filter(r => !r.success).length

  let markdown = `# ${experiment.name}

**Experiment Type:** ${experiment.type === 'usability' ? 'Usability Experiment' : 'A/B Experiment'}  
**Project:** ${experiment.project?.name || 'N/A'}  
**Completed:** ${experiment.completed_at ? format(new Date(experiment.completed_at), 'PPP') : 'N/A'}  
**Experiment ID:** \`${experiment.id}\`

---

## Executive Summary

${results?.summary || 'No summary available.'}

### Key Metrics

| Metric | Value |
|--------|-------|
| **UX Score** | ${uxScore}/100 |
| **Success Rate** | ${Math.round(successRate)}% (${successfulRuns}/${totalRuns} runs) |
| **Avg. Duration** | ${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s |
| **Issues Found** | ${findings.length} |
| **Test Runs** | ${totalRuns} across ${personas.length} personas |

---

## Top Findings

${findings.length > 0 ? findings.map((finding, idx) => `
### ${idx + 1}. ${finding.title}

**Severity:** ${finding.severity ? finding.severity.toUpperCase() : 'N/A'}  
**Confidence:** ${finding.confidence.toUpperCase()}  
**Frequency:** ${finding.frequency}x observed

${finding.explanation}

${finding.suggested_fix ? `**💡 Suggested Fix:**  \n${finding.suggested_fix}` : ''}

---
`).join('\n') : '_No critical issues were identified during testing._\n\n'}

## Top Recommendations

${results?.recommendations && results.recommendations.length > 0 
  ? results.recommendations.map((rec: Recommendation, idx: number) => `
### ${rec.priority}. ${rec.title}

**Impact:** ${rec.impact.toUpperCase()}${rec.frequency ? `  \n**Frequency:** ${rec.frequency}x suggested` : ''}

${rec.description}

---
`).join('\n')
  : '_Continue monitoring user behavior for potential improvements._\n\n'}

## Detailed Run Analysis

${runs.map((run, idx) => {
  const persona = personas.find(p => p.id === run.persona_id)
  const logsData = run.logs as any
  const insights = logsData?.insights || []
  const recommendations = logsData?.recommendations || []
  const experienceLogs = logsData?.experience_logs || []
  
  return `
### Run #${idx + 1}: ${persona?.name || 'Unknown Persona'}

**Status:** ${run.success ? '✅ Success' : '❌ Failed'}  
**Duration:** ${run.duration_ms ? Math.round(run.duration_ms / 1000) + 's' : 'N/A'}  
**Persona Profile:** ${persona?.experience_level} experience, ${persona?.device_type} device, ${persona?.patience_level} patience

${run.struggle_point ? `**Struggle Point:** ${run.struggle_point}  \n` : ''}${run.reason ? `**Details:** ${run.reason}  \n` : ''}

#### Key Insights from This Run

${insights.length > 0 ? insights.map((insight: any, i: number) => `${i + 1}. **[${insight.severity?.toUpperCase() || 'N/A'}]** ${insight.text}`).join('\n') : '_No specific insights for this run._'}

#### Recommendations from This Run

${recommendations.length > 0 ? recommendations.map((rec: any, i: number) => `${i + 1}. **${rec.title}:** ${rec.description}`).join('\n') : '_No specific recommendations._'}

${experienceLogs.length > 0 ? `
#### Experience Timeline

${experienceLogs.map((log: any) => `- **[${log.severity?.toUpperCase() || 'INFO'}]** (${log.timestamp}) ${log.action}: ${log.observation}`).join('\n')}
` : ''}

---
`}).join('\n')}

## Test Configuration

**Input Mode:** ${experiment.input_mode === 'screenshots' ? 'Screenshots' : 'URL'}  
${experiment.input_mode === 'screenshots' 
  ? `**Screenshots:** ${screenshots?.length || 0} screens analyzed\n` 
  : `**Target URL:** ${(experiment.input_links as any)?.single || (experiment.input_links as any)?.control || 'N/A'}\n`}
${experiment.hypothesis ? `**Research Hypothesis:** ${experiment.hypothesis}\n` : ''}
${experiment.script ? `**Test Script:**\n\`\`\`\n${experiment.script}\n\`\`\`\n` : ''}
**Device Targets:** ${experiment.device_targets?.join(', ') || 'N/A'}  
**Started:** ${experiment.started_at ? format(new Date(experiment.started_at), 'PPp') : 'N/A'}  
**Completed:** ${experiment.completed_at ? format(new Date(experiment.completed_at), 'PPp') : 'N/A'}

---

## Tested Personas

${personas.map(persona => `
- **${persona.name}**  
  _${persona.description || 'No description'}_  
  Experience: ${persona.experience_level} | Device: ${persona.device_type} | Patience: ${persona.patience_level}
`).join('\n')}

---

*Report generated on ${format(new Date(), 'PPpp')}*  
*Powered by Heuristiq - AI-Driven UX Testing*
`

  return markdown
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printToPDF() {
  // Use browser's print functionality for PDF export
  // This will open the print dialog where user can save as PDF
  window.print()
}
