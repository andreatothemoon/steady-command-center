-- 1. Fix RPC identity spoofing: enforce auth.uid() = _user_id when called from web context
CREATE OR REPLACE FUNCTION public.accept_household_invitation(_token text, _user_id uuid, _user_name text, _user_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inv RECORD;
  resolved_name TEXT;
  orphan_household_id UUID;
  member_count INTEGER;
BEGIN
  -- Identity guard: when called from an authenticated web session, enforce that
  -- callers can only accept invitations for themselves. Trigger invocations
  -- (handle_new_user) run without auth.uid() and are unaffected.
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'user_id mismatch: callers can only accept invitations for themselves';
  END IF;

  SELECT * INTO inv FROM public.household_invitations WHERE token = _token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer valid (status: %)', inv.status;
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE public.household_invitations SET status = 'expired' WHERE id = inv.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF EXISTS (SELECT 1 FROM public.household_members WHERE household_id = inv.household_id AND user_id = _user_id) THEN
    UPDATE public.household_invitations
       SET status = 'accepted', accepted_at = now(), accepted_by = _user_id
     WHERE id = inv.id;
    RETURN inv.household_id;
  END IF;

  SELECT hm.household_id INTO orphan_household_id
  FROM public.household_members hm
  WHERE hm.user_id = _user_id
    AND hm.role = 'owner'
    AND hm.household_id <> inv.household_id
  LIMIT 1;

  IF orphan_household_id IS NOT NULL THEN
    SELECT COUNT(*) INTO member_count FROM public.household_members WHERE household_id = orphan_household_id;
    IF member_count = 1
       AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE household_id = orphan_household_id)
       AND NOT EXISTS (SELECT 1 FROM public.db_pensions WHERE household_id = orphan_household_id)
       AND NOT EXISTS (SELECT 1 FROM public.cash_flows WHERE household_id = orphan_household_id)
       AND NOT EXISTS (SELECT 1 FROM public.documents WHERE household_id = orphan_household_id) THEN
      DELETE FROM public.household_profiles WHERE household_id = orphan_household_id;
      DELETE FROM public.household_members WHERE household_id = orphan_household_id;
      DELETE FROM public.households WHERE id = orphan_household_id;
    END IF;
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role, invited_by)
  VALUES (inv.household_id, _user_id, 'member', inv.invited_by);

  resolved_name := COALESCE(NULLIF(trim(_user_name), ''), split_part(_user_email, '@', 1), 'Member');
  INSERT INTO public.household_profiles (household_id, name, role, is_primary)
  VALUES (inv.household_id, resolved_name, 'adult', false);

  UPDATE public.household_invitations
     SET status = 'accepted', accepted_at = now(), accepted_by = _user_id
   WHERE id = inv.id;

  UPDATE public.user_approvals SET status = 'approved' WHERE user_id = _user_id AND status <> 'approved';

  RETURN inv.household_id;
END;
$function$;

-- 2. Remove the publicly-readable invitations policy
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.household_invitations;

-- 3. Create a security definer function for token-based invitation lookup
-- Returns only the single invitation matching the provided token, exposing
-- minimum fields needed by the accept-invite UI.
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
 RETURNS TABLE (
   id uuid,
   household_id uuid,
   status invitation_status,
   expires_at timestamptz,
   email text,
   household_name text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.household_id, i.status, i.expires_at, i.email, h.name AS household_name
  FROM public.household_invitations i
  LEFT JOIN public.households h ON h.id = i.household_id
  WHERE i.token = _token
  LIMIT 1;
$function$;

-- Allow anon + authenticated to call the lookup function (needed before signup/login)
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;