-- Demo experiment for every new account
--
-- Each new user gets a ready-to-launch draft: three default personas
-- (first-time desktop, power-user desktop, price-sensitive mobile) shopping on
-- SauceDemo, a public demo store built for automation testing.
--
-- Backfill existing users with:
--   SELECT public.create_demo_experiment(id) FROM public.profiles;

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN experiments.is_demo IS 'True for the onboarding demo draft seeded at signup';

CREATE OR REPLACE FUNCTION public.create_demo_experiment(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
  v_experiment_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.experiments WHERE user_id = p_user_id AND is_demo
  ) THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_project_id
  FROM public.projects
  WHERE user_id = p_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_project_id IS NULL THEN
    INSERT INTO public.projects (user_id, name, description)
    VALUES (p_user_id, 'My First Project', 'Your default project - feel free to rename or create new projects')
    RETURNING id INTO v_project_id;
  END IF;

  INSERT INTO public.experiments (
    user_id,
    project_id,
    name,
    type,
    input_mode,
    input_links,
    script,
    hypothesis,
    device_targets,
    status,
    is_demo
  )
  VALUES (
    p_user_id,
    v_project_id,
    'Demo: E-commerce checkout with 3 AI personas',
    'usability',
    'live_url',
    '{"single": "www.saucedemo.com"}'::jsonb,
    $script$1. Log in with username "standard_user" and password "secret_sauce"
2. Browse the product list and compare the price of the Sauce Labs Backpack with at least one other product
3. Add the Sauce Labs Backpack to the cart
4. Open the shopping cart and confirm the backpack and its price are listed
5. Proceed to checkout and enter First Name "Alex", Last Name "Tan", and Postal Code "018956"
6. Continue to the checkout overview and review the item total, tax, and final total
7. Finish the order and confirm the "Thank you for your order" message appears$script$,
    $hyp$Shoppers of every experience level can log in, add the Sauce Labs Backpack to the cart, and complete checkout in under 15 actions. We expect the price-sensitive mobile shopper to hesitate at the icon-only cart button and at checkout, where tax and the final total only appear after personal details are entered.$hyp$,
    ARRAY['desktop', 'mobile'],
    'draft',
    TRUE
  )
  RETURNING id INTO v_experiment_id;

  INSERT INTO public.experiment_personas (experiment_id, persona_id, runs_count)
  SELECT v_experiment_id, id, 1
  FROM public.personas
  WHERE user_id = p_user_id AND is_default;

  RETURN v_experiment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.seed_demo_experiment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_demo_experiment(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup because the demo could not be created.
  RAISE WARNING 'seed_demo_experiment failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Postgres fires same-event triggers in name order, so this runs after
-- create_default_project_trigger and on_profile_created_seed_personas.
DROP TRIGGER IF EXISTS seed_demo_experiment_trigger ON profiles;
CREATE TRIGGER seed_demo_experiment_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_demo_experiment();
