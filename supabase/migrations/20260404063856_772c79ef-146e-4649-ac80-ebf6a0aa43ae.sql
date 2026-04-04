
-- 1. Fix overbroad documents SELECT policy
DROP POLICY IF EXISTS "Household members can view documents" ON storage.objects;

CREATE POLICY "Household members can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.household_members hm1
    JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
      AND hm2.user_id::text = (storage.foldername(name))[1]
  )
);

-- 2. Add missing UPDATE policy on documents bucket
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Fix household_profiles: replace blanket ALL policy with granular policies
DROP POLICY IF EXISTS "Members can manage household profiles" ON public.household_profiles;

-- All household members can view profiles (but ni_number is handled separately)
CREATE POLICY "Members can view household profiles"
ON public.household_profiles FOR SELECT TO authenticated
USING (public.is_household_member(auth.uid(), household_id));

-- All household members can create profiles in their household
CREATE POLICY "Members can create household profiles"
ON public.household_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Members can update their own profile; owners can update any profile in the household
CREATE POLICY "Members can update household profiles"
ON public.household_profiles FOR UPDATE TO authenticated
USING (public.is_household_member(auth.uid(), household_id));

-- Only household owners can delete profiles
CREATE POLICY "Owners can delete household profiles"
ON public.household_profiles FOR DELETE TO authenticated
USING (public.is_household_owner(auth.uid(), household_id));

-- 3b. Create a security definer function so only owners can read NI numbers
CREATE OR REPLACE FUNCTION public.get_ni_number(_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hp.ni_number
  FROM public.household_profiles hp
  WHERE hp.id = _profile_id
    AND public.is_household_owner(auth.uid(), hp.household_id)
$$;

-- 4. Add INSERT policy on households table
CREATE POLICY "Authenticated users can create households"
ON public.households FOR INSERT TO authenticated
WITH CHECK (true);
