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

-- Repair the affected user
DO $$
DECLARE
  affected_user UUID := '6ca89bf7-8369-42cb-b8ed-51bcecade75a';
  target_household UUID := '876fb896-06c0-4a9a-bb79-980e7024b828';
  orphan_household UUID := '6ce841f3-e19f-46f1-ba97-3554da76cfc9';
  inviter UUID;
BEGIN
  SELECT invited_by INTO inviter FROM public.household_invitations
   WHERE household_id = target_household
   ORDER BY created_at DESC LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = target_household AND user_id = affected_user) THEN
    INSERT INTO public.household_members (household_id, user_id, role, invited_by)
    VALUES (target_household, affected_user, 'member', inviter);
  END IF;

  INSERT INTO public.household_profiles (household_id, name, role, is_primary)
  VALUES (target_household, 'Invited Member', 'adult', false);

  UPDATE public.household_invitations
     SET status = 'accepted', accepted_at = now(), accepted_by = affected_user
   WHERE household_id = target_household AND status = 'pending';

  UPDATE public.user_approvals SET status = 'approved' WHERE user_id = affected_user;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE household_id = orphan_household)
     AND NOT EXISTS (SELECT 1 FROM public.db_pensions WHERE household_id = orphan_household)
     AND NOT EXISTS (SELECT 1 FROM public.cash_flows WHERE household_id = orphan_household)
     AND NOT EXISTS (SELECT 1 FROM public.documents WHERE household_id = orphan_household) THEN
    DELETE FROM public.household_profiles WHERE household_id = orphan_household;
    DELETE FROM public.household_members WHERE household_id = orphan_household;
    DELETE FROM public.households WHERE id = orphan_household;
  END IF;
END $$;