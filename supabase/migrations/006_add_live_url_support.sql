-- Migration: Add live URL testing support
-- This migration adds support for autonomous browser-based usability testing

-- Add 'live_url' to input_mode enum
-- Note: PostgreSQL doesn't allow adding values to enums in a transaction easily,
-- so we need to do it outside of a transaction or use a workaround
ALTER TYPE input_mode ADD VALUE IF NOT EXISTS 'live_url';

-- Add recording fields to experiment_runs table
ALTER TABLE experiment_runs 
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS interaction_screenshots JSONB DEFAULT '[]';

-- Add index for cleanup queries (finding expired recordings)
CREATE INDEX IF NOT EXISTS idx_experiment_runs_recording_expires_at 
ON experiment_runs(recording_expires_at) 
WHERE recording_expires_at IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN experiment_runs.recording_url IS 'URL to the WebM video recording of the browser session';
COMMENT ON COLUMN experiment_runs.recording_expires_at IS 'Timestamp when the recording will be auto-deleted (typically 24 hours after creation)';
COMMENT ON COLUMN experiment_runs.interaction_screenshots IS 'Array of screenshot objects captured during browser interactions: [{url, timestamp, action, step}]';

-- Create storage bucket for recordings (run this in Supabase Dashboard > Storage if not using SQL)
-- Note: This is informational - actual bucket creation may need to be done via Dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('experiment-recordings', 'experiment-recordings', true)
-- ON CONFLICT (id) DO NOTHING;
