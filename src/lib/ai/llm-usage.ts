/**
 * LLM Usage Tracking
 *
 * Tracks API calls, token counts, model info, and estimated cost
 * across all Gemini calls within a run or aggregation phase.
 */

// Pricing per 1M tokens (gemini-3-flash-preview, March 2026)
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-2.0-flash':       { input: 0.10, output: 0.40 },
  'gemini-1.5-flash':       { input: 0.075, output: 0.30 },
  'gemini-pro':             { input: 1.25, output: 5.00 },
}

const DEFAULT_PRICING = { input: 0.50, output: 3.00 }

export interface LlmCallRecord {
  model: string
  feature: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  timestamp: string
}

export interface LlmUsageSummary {
  model: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  calls: LlmCallRecord[]
}

/**
 * Mutable tracker that accumulates LLM usage across multiple calls.
 * Create one per run or per aggregation phase.
 */
export class LlmUsageTracker {
  private calls: LlmCallRecord[] = []
  private model: string = ''

  record(model: string, feature: string, inputTokens: number, outputTokens: number): LlmCallRecord {
    this.model = model
    const pricing = PRICING[model] || DEFAULT_PRICING
    const cost = (inputTokens / 1_000_000) * pricing.input
                + (outputTokens / 1_000_000) * pricing.output

    const entry: LlmCallRecord = {
      model,
      feature,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: Math.round(cost * 1_000_000) / 1_000_000,
      timestamp: new Date().toISOString(),
    }
    this.calls.push(entry)
    return entry
  }

  getSummary(): LlmUsageSummary {
    return {
      model: this.model || 'unknown',
      total_calls: this.calls.length,
      total_input_tokens: this.calls.reduce((s, c) => s + c.input_tokens, 0),
      total_output_tokens: this.calls.reduce((s, c) => s + c.output_tokens, 0),
      total_cost_usd: Math.round(this.calls.reduce((s, c) => s + c.cost_usd, 0) * 1_000_000) / 1_000_000,
      calls: this.calls,
    }
  }

  merge(other: LlmUsageSummary): void {
    this.calls.push(...other.calls)
    if (other.model) this.model = other.model
  }
}

/**
 * Extract token counts from a Gemini GenerateContentResult.
 * The SDK exposes usageMetadata on the response object.
 */
export function extractTokenCounts(result: any): { input: number; output: number } {
  const meta = result?.response?.usageMetadata
  if (meta) {
    return {
      input: meta.promptTokenCount ?? 0,
      output: meta.candidatesTokenCount ?? 0,
    }
  }
  return { input: 0, output: 0 }
}

/**
 * Minimal usage info suitable for DB storage (no per-call breakdown).
 */
export interface LlmUsageCompact {
  model: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

/**
 * Combine multiple per-run summaries + an aggregation summary into an experiment-level total.
 * Accepts either full or compact summaries.
 */
export function combineUsageSummaries(
  runSummaries: LlmUsageCompact[],
  aggregationSummary?: LlmUsageCompact
): {
  total_llm_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  runs_cost_usd: number
  aggregation_cost_usd: number
} {
  const runsTotals = runSummaries.reduce(
    (acc, s) => ({
      calls: acc.calls + s.total_calls,
      input: acc.input + s.total_input_tokens,
      output: acc.output + s.total_output_tokens,
      cost: acc.cost + s.total_cost_usd,
    }),
    { calls: 0, input: 0, output: 0, cost: 0 }
  )

  const aggCost = aggregationSummary?.total_cost_usd ?? 0
  const aggCalls = aggregationSummary?.total_calls ?? 0
  const aggInput = aggregationSummary?.total_input_tokens ?? 0
  const aggOutput = aggregationSummary?.total_output_tokens ?? 0

  return {
    total_llm_calls: runsTotals.calls + aggCalls,
    total_input_tokens: runsTotals.input + aggInput,
    total_output_tokens: runsTotals.output + aggOutput,
    total_cost_usd: Math.round((runsTotals.cost + aggCost) * 1_000_000) / 1_000_000,
    runs_cost_usd: Math.round(runsTotals.cost * 1_000_000) / 1_000_000,
    aggregation_cost_usd: Math.round(aggCost * 1_000_000) / 1_000_000,
  }
}
