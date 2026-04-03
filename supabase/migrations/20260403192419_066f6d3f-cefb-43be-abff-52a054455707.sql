-- Create role enum for household profiles
CREATE TYPE public.member_role AS ENUM ('adult', 'child');

-- Create household_profiles table
CREATE TABLE public.household_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  role member_role NOT NULL DEFAULT 'adult',
  ni_number TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.household_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy using existing security definer function
CREATE POLICY "Members can manage household profiles"
  ON public.household_profiles
  FOR ALL
  TO authenticated
  USING (is_household_member(auth.uid(), household_id))
  WITH CHECK (is_household_member(auth.uid(), household_id));

-- Updated_at trigger
CREATE TRIGGER update_household_profiles_updated_at
  BEFORE UPDATE ON public.household_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also add a member_profile_id column to tax_year_summaries so tax data can be per-member
ALTER TABLE public.tax_year_summaries
  ADD COLUMN member_profile_id UUID REFERENCES public.household_profiles(id) ON DELETE SET NULL;