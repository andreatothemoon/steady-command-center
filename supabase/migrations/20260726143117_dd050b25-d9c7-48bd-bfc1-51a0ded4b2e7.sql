-- life_events
CREATE TABLE public.life_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  scenario_id UUID,
  profile_id UUID REFERENCES public.household_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  probability NUMERIC NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  decision_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_events TO authenticated;
GRANT ALL ON public.life_events TO service_role;

ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view life events"
  ON public.life_events FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Household members can insert life events"
  ON public.life_events FOR INSERT TO authenticated
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Household members can update life events"
  ON public.life_events FOR UPDATE TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Household members can delete life events"
  ON public.life_events FOR DELETE TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));

CREATE INDEX life_events_household_idx ON public.life_events(household_id);
CREATE INDEX life_events_scenario_idx ON public.life_events(scenario_id);

CREATE TRIGGER update_life_events_updated_at
  BEFORE UPDATE ON public.life_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- life_event_effects
CREATE TABLE public.life_event_effects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.life_events(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_event_effects TO authenticated;
GRANT ALL ON public.life_event_effects TO service_role;

ALTER TABLE public.life_event_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view life event effects"
  ON public.life_event_effects FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.life_events e
    WHERE e.id = life_event_effects.event_id
      AND public.is_household_member(auth.uid(), e.household_id)
  ));

CREATE POLICY "Household members can insert life event effects"
  ON public.life_event_effects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.life_events e
    WHERE e.id = life_event_effects.event_id
      AND public.is_household_member(auth.uid(), e.household_id)
  ));

CREATE POLICY "Household members can update life event effects"
  ON public.life_event_effects FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.life_events e
    WHERE e.id = life_event_effects.event_id
      AND public.is_household_member(auth.uid(), e.household_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.life_events e
    WHERE e.id = life_event_effects.event_id
      AND public.is_household_member(auth.uid(), e.household_id)
  ));

CREATE POLICY "Household members can delete life event effects"
  ON public.life_event_effects FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.life_events e
    WHERE e.id = life_event_effects.event_id
      AND public.is_household_member(auth.uid(), e.household_id)
  ));

CREATE INDEX life_event_effects_event_idx ON public.life_event_effects(event_id);

CREATE TRIGGER update_life_event_effects_updated_at
  BEFORE UPDATE ON public.life_event_effects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();