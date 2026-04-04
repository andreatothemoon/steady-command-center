-- Revoke SELECT on ni_number column from authenticated role
-- The get_ni_number() SECURITY DEFINER function still has access via the function owner
REVOKE SELECT (ni_number) ON public.household_profiles FROM authenticated;

-- Also revoke UPDATE on ni_number so only owners can modify it via a dedicated RPC if needed
REVOKE UPDATE (ni_number) ON public.household_profiles FROM authenticated;

-- Grant UPDATE on ni_number only through a new SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.set_ni_number(_profile_id uuid, _ni_number text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.household_profiles
  SET ni_number = _ni_number, updated_at = now()
  WHERE id = _profile_id
    AND public.is_household_owner(auth.uid(), household_id);
$$;