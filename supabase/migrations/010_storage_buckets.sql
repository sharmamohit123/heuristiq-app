-- Storage buckets and policies
--
-- experiment-screenshots: user uploads from the wizard (browser client, path
--   <user_id>/...) and per-step screenshots from the server (service role,
--   path <experiment_id>/<persona_id>/<run>/step-N.png).
-- experiment-recordings: session videos from the server (service role, path
--   <experiment_id>/<persona_id>/<run>/recording.webm).
--
-- The service role bypasses RLS, so policies only cover the signed-in user's
-- own uploads and the cleanup done when they abort an experiment.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('experiment-screenshots', 'experiment-screenshots', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('experiment-recordings', 'experiment-recordings', true, 52428800,
   ARRAY['video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own screenshots" ON storage.objects;
CREATE POLICY "Users upload own screenshots" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'experiment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upserts need SELECT and UPDATE in addition to INSERT.
DROP POLICY IF EXISTS "Users read own experiment files" ON storage.objects;
CREATE POLICY "Users read own experiment files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('experiment-screenshots', 'experiment-recordings')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.experiments e
        WHERE e.id::text = (storage.foldername(name))[1] AND e.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users update own screenshots" ON storage.objects;
CREATE POLICY "Users update own screenshots" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'experiment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own experiment files" ON storage.objects;
CREATE POLICY "Users delete own experiment files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('experiment-screenshots', 'experiment-recordings')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.experiments e
        WHERE e.id::text = (storage.foldername(name))[1] AND e.user_id = auth.uid()
      )
    )
  );
