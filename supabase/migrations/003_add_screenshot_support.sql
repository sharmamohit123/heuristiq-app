-- Migration: Add screenshot support to experiments
-- Run this migration in your Supabase SQL Editor after 001 and 002

-- Create enum for input mode
CREATE TYPE input_mode AS ENUM ('url', 'screenshots');

-- Add new columns to experiments table
ALTER TABLE experiments 
ADD COLUMN IF NOT EXISTS input_mode input_mode NOT NULL DEFAULT 'url',
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Comment on columns
COMMENT ON COLUMN experiments.input_mode IS 'Whether the experiment uses URL or screenshots as input';
COMMENT ON COLUMN experiments.screenshots IS 'Array of screenshot objects: [{storage_path, url, context, order}]';
COMMENT ON COLUMN experiments.thumbnail_url IS 'URL of the first screenshot, used as experiment thumbnail';

-- Create storage bucket for experiment screenshots (run this in Supabase Dashboard > Storage)
-- Or use the following SQL if storage extension is enabled:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('experiment-screenshots', 'experiment-screenshots', true);

-- Storage policy for experiment screenshots (if using SQL)
-- CREATE POLICY "Users can upload screenshots" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'experiment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "Users can view own screenshots" ON storage.objects FOR SELECT USING (
--   bucket_id = 'experiment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "Users can delete own screenshots" ON storage.objects FOR DELETE USING (
--   bucket_id = 'experiment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "Public can view screenshots" ON storage.objects FOR SELECT USING (
--   bucket_id = 'experiment-screenshots'
-- );
