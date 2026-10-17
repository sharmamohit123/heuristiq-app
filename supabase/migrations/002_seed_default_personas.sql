-- Seed default personas
-- Note: These will be created for each new user via a function

-- Create a function to seed default personas for new users
CREATE OR REPLACE FUNCTION public.seed_default_personas()
RETURNS TRIGGER AS $$
BEGIN
    -- First-time user persona
    INSERT INTO public.personas (user_id, name, description, device_type, experience_level, patience_level, is_default)
    VALUES (
        NEW.id,
        'First-time User',
        'A new user who has never used the product before. They need clear guidance and may be overwhelmed by complex interfaces.',
        'desktop',
        'beginner',
        'medium',
        TRUE
    );
    
    -- Power user persona
    INSERT INTO public.personas (user_id, name, description, device_type, experience_level, patience_level, is_default)
    VALUES (
        NEW.id,
        'Power User',
        'An experienced user who uses similar products frequently. They expect efficiency, keyboard shortcuts, and advanced features.',
        'desktop',
        'expert',
        'low',
        TRUE
    );
    
    -- Price-sensitive user persona
    INSERT INTO public.personas (user_id, name, description, device_type, experience_level, patience_level, is_default)
    VALUES (
        NEW.id,
        'Price-sensitive User',
        'A user who carefully evaluates costs and value. They spend time comparing options and reading pricing details thoroughly.',
        'mobile',
        'intermediate',
        'high',
        TRUE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to seed personas after profile creation
DROP TRIGGER IF EXISTS on_profile_created_seed_personas ON profiles;
CREATE TRIGGER on_profile_created_seed_personas
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.seed_default_personas();
