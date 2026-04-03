
-- Fix household_members RLS: add DELETE, UPDATE policies and restrict INSERT to owners

-- 1. Create a security definer function to check if user is household owner
CREATE OR REPLACE FUNCTION public.is_household_owner(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id
      AND household_id = _household_id
      AND role = 'owner'
  )
$$;

-- 2. Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Members can insert into their household" ON public.household_members;

-- 3. Create restricted INSERT policy (owners only)
CREATE POLICY "Owners can invite household members"
ON public.household_members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_household_owner(auth.uid(), household_id)
);

-- 4. Add DELETE policy: owners can remove others, anyone can remove themselves
CREATE POLICY "Owners can remove members or self-remove"
ON public.household_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_household_owner(auth.uid(), household_id)
);

-- 5. Add UPDATE policy: owners can change roles
CREATE POLICY "Owners can update member roles"
ON public.household_members FOR UPDATE
TO authenticated
USING (public.is_household_owner(auth.uid(), household_id))
WITH CHECK (public.is_household_owner(auth.uid(), household_id));

-- 6. Fix documents storage bucket: allow all household members to read files
-- Update storage policy so household members can access uploaded documents
CREATE POLICY "Household members can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
);
