-- Add severity column to findings table
ALTER TABLE findings
ADD COLUMN IF NOT EXISTS severity TEXT;

-- Add comment
COMMENT ON COLUMN findings.severity IS 'Severity level of the finding: critical, high, medium, low, positive';
