
-- 1. Drop the overly broad storage SELECT policy
DROP POLICY IF EXISTS "Household members can view documents" ON storage.objects;

-- 2. Replace with a properly scoped household-member policy
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

-- 3. Add DELETE policy on households for owners only
CREATE POLICY "Owners can delete their household"
ON public.households FOR DELETE TO authenticated
USING (public.is_household_owner(auth.uid(), id));
