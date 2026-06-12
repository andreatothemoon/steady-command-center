
-- 1) Drop overly permissive INSERT policy on households.
--    Households are created only via the handle_new_user trigger (SECURITY DEFINER, bypasses RLS).
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

-- 2) Revoke EXECUTE on internal SECURITY DEFINER helpers from anon and authenticated.
--    These are used by other DB functions / triggers / edge functions only.
REVOKE EXECUTE ON FUNCTION public.is_household_member(uuid, uuid)   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid)    FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_household_ids(uuid)      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_approval_status(uuid)         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_approval()        FROM anon, authenticated;

-- Email queue helpers — edge-function only.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;

-- Keep these callable by the client (used by app code):
--   accept_household_invitation, get_invitation_by_token, get_ni_number, set_ni_number
-- (no changes needed — they retain default EXECUTE)

-- 3) Lock down get_user_email so only admins can resolve any user's email.
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT email FROM auth.users WHERE id = _user_id);
END;
$$;

-- Only admins (signed in) need this function. Revoke from anon entirely.
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM anon;
