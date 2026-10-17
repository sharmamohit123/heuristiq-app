-- Update the file size limit for experiment-screenshots bucket to 5MB
UPDATE storage.buckets 
SET file_size_limit = 5242880  -- 5MB in bytes
WHERE id = 'experiment-screenshots';

-- If the bucket doesn't exist, create it with the correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'experiment-screenshots',
  'experiment-screenshots', 
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880;
