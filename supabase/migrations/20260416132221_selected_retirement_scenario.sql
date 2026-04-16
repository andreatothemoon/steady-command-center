ALTER TABLE public.households
  ADD COLUMN selected_retirement_scenario_id UUID REFERENCES public.retirement_scenarios(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.ensure_selected_retirement_scenario_belongs_to_household()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.selected_retirement_scenario_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.retirement_scenarios
    WHERE id = NEW.selected_retirement_scenario_id
      AND household_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Selected retirement scenario must belong to household';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_selected_retirement_scenario_belongs_to_household
  BEFORE INSERT OR UPDATE OF selected_retirement_scenario_id ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_selected_retirement_scenario_belongs_to_household();
