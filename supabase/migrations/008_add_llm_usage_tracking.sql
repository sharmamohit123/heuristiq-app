-- Add LLM usage tracking columns to experiment_runs and experiments
-- Stores per-run and per-experiment API call counts, token usage, and cost

ALTER TABLE experiment_runs
  ADD COLUMN IF NOT EXISTS llm_usage JSONB DEFAULT NULL;

COMMENT ON COLUMN experiment_runs.llm_usage IS 'Per-run LLM API usage: {model, total_calls, total_input_tokens, total_output_tokens, total_cost_usd, calls[]}';

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS llm_usage JSONB DEFAULT NULL;

COMMENT ON COLUMN experiments.llm_usage IS 'Experiment-level LLM usage: {total_llm_calls, total_input_tokens, total_output_tokens, total_cost_usd, runs_cost_usd, aggregation_cost_usd}';
