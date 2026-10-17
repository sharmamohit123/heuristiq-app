-- Function to create default project for new users
CREATE OR REPLACE FUNCTION create_default_project_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default project for the new user
  INSERT INTO projects (user_id, name, description)
  VALUES (
    NEW.id,
    'My First Project',
    'Your default project - feel free to rename or create new projects'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create default project when a new profile is created
DROP TRIGGER IF EXISTS create_default_project_trigger ON profiles;
CREATE TRIGGER create_default_project_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_project_for_user();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_experiments_project_id_status ON experiments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_findings_experiment_id ON findings(experiment_id);
