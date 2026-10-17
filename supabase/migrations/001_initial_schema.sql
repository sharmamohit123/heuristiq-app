-- Heuristiq Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE device_type AS ENUM ('mobile', 'desktop', 'tablet');
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE patience_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE experiment_type AS ENUM ('usability', 'ab_test');
CREATE TYPE experiment_status AS ENUM ('draft', 'queued', 'running', 'completed', 'failed');
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    device_type device_type NOT NULL DEFAULT 'desktop',
    experience_level experience_level NOT NULL DEFAULT 'intermediate',
    patience_level patience_level NOT NULL DEFAULT 'medium',
    is_default BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Experiments table
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type experiment_type NOT NULL DEFAULT 'usability',
    input_links JSONB NOT NULL DEFAULT '{}',
    script TEXT,
    hypothesis TEXT,
    device_targets TEXT[] DEFAULT ARRAY['desktop'],
    status experiment_status NOT NULL DEFAULT 'draft',
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Junction table for experiments and personas
CREATE TABLE IF NOT EXISTS experiment_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    runs_count INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(experiment_id, persona_id)
);

-- Experiment runs table
CREATE TABLE IF NOT EXISTS experiment_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    run_number INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT FALSE,
    struggle_point TEXT,
    reason TEXT,
    suggested_fix TEXT,
    duration_ms INTEGER,
    logs JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Findings table
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    suggested_fix TEXT,
    confidence confidence_level NOT NULL DEFAULT 'medium',
    frequency INTEGER DEFAULT 1,
    screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_runs_experiment_id ON experiment_runs(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_runs_persona_id ON experiment_runs(persona_id);
CREATE INDEX IF NOT EXISTS idx_findings_experiment_id ON findings(experiment_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for personas
CREATE POLICY "Users can view own personas" ON personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create personas" ON personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personas" ON personas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personas" ON personas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for experiments
CREATE POLICY "Users can view own experiments" ON experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create experiments" ON experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiments" ON experiments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiments" ON experiments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for experiment_personas
CREATE POLICY "Users can view own experiment personas" ON experiment_personas FOR SELECT 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = experiment_personas.experiment_id AND experiments.user_id = auth.uid()));
CREATE POLICY "Users can manage experiment personas" ON experiment_personas FOR ALL 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = experiment_personas.experiment_id AND experiments.user_id = auth.uid()));

-- RLS Policies for experiment_runs
CREATE POLICY "Users can view own experiment runs" ON experiment_runs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = experiment_runs.experiment_id AND experiments.user_id = auth.uid()));
CREATE POLICY "Users can manage experiment runs" ON experiment_runs FOR ALL 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = experiment_runs.experiment_id AND experiments.user_id = auth.uid()));

-- RLS Policies for findings
CREATE POLICY "Users can view own findings" ON findings FOR SELECT 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = findings.experiment_id AND experiments.user_id = auth.uid()));
CREATE POLICY "Users can manage findings" ON findings FOR ALL 
    USING (EXISTS (SELECT 1 FROM experiments WHERE experiments.id = findings.experiment_id AND experiments.user_id = auth.uid()));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
