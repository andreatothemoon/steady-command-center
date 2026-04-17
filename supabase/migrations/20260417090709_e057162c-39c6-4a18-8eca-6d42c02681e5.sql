
-- 1. Enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- 2. Invitations table
CREATE TABLE public.household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  invited_by UUID NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_household_invitations_token ON public.household_invitations(token);
CREATE INDEX idx_household_invitations_household ON public.household_invitations(household_id);

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can manage invitations for their household
CREATE POLICY "Owners can view invitations"
  ON public.household_invitations FOR SELECT
  TO authenticated
  USING (public.is_household_owner(auth.uid(), household_id));

CREATE POLICY "Owners can create invitations"
  ON public.household_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_household_owner(auth.uid(), household_id) AND invited_by = auth.uid());

CREATE POLICY "Owners can update invitations"
  ON public.household_invitations FOR UPDATE
  TO authenticated
  USING (public.is_household_owner(auth.uid(), household_id));

-- Anyone (including anon) can look up an invitation by token to preview it.
-- Token is unguessable (random) so this is safe.
CREATE POLICY "Anyone can read invitation by token"
  ON public.household_invitations FOR SELECT
  TO anon, authenticated
  USING (true);

-- updated_at trigger
CREATE TRIGGER update_household_invitations_updated_at
BEFORE UPDATE ON public.household_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Function: accept invitation (used by trigger and by client RPC)
CREATE OR REPLACE FUNCTION public.accept_household_invitation(_token TEXT, _user_id UUID, _user_name TEXT, _user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  resolved_name TEXT;
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

  -- Skip if user is already a member of this household
  IF EXISTS (SELECT 1 FROM public.household_members WHERE household_id = inv.household_id AND user_id = _user_id) THEN
    UPDATE public.household_invitations
       SET status = 'accepted', accepted_at = now(), accepted_by = _user_id
     WHERE id = inv.id;
    RETURN inv.household_id;
  END IF;

  -- Add as a member
  INSERT INTO public.household_members (household_id, user_id, role, invited_by)
  VALUES (inv.household_id, _user_id, 'member', inv.invited_by);

  -- Auto-create a household profile (adult) for the new member
  resolved_name := COALESCE(NULLIF(trim(_user_name), ''), split_part(_user_email, '@', 1), 'Member');
  INSERT INTO public.household_profiles (household_id, name, role, is_primary)
  VALUES (inv.household_id, resolved_name, 'adult', false);

  -- Mark invitation accepted
  UPDATE public.household_invitations
     SET status = 'accepted', accepted_at = now(), accepted_by = _user_id
   WHERE id = inv.id;

  RETURN inv.household_id;
END;
$$;

-- 4. Update handle_new_user to honor invite token in user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
  invite_token TEXT;
  user_name TEXT;
BEGIN
  invite_token := NEW.raw_user_meta_data ->> 'invitation_token';
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  IF invite_token IS NOT NULL AND length(invite_token) > 0 THEN
    BEGIN
      PERFORM public.accept_household_invitation(invite_token, NEW.id, user_name, NEW.email);
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      -- If invitation fails (expired/invalid), fall through to default flow
      NULL;
    END;
  END IF;

  -- Default: create new household
  INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO new_household_id;
  INSERT INTO public.household_members (household_id, user_id, role) VALUES (new_household_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$;

-- 5. Update handle_new_user_approval: auto-approve users who joined via valid invite
CREATE OR REPLACE FUNCTION public.handle_new_user_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  invite_token TEXT;
  invite_valid BOOLEAN := FALSE;
BEGIN
  invite_token := NEW.raw_user_meta_data ->> 'invitation_token';

  IF invite_token IS NOT NULL AND length(invite_token) > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.household_invitations
      WHERE token = invite_token AND status = 'accepted' AND accepted_by = NEW.id
    ) INTO invite_valid;
  END IF;

  SELECT COUNT(*) INTO user_count FROM auth.users;

  IF user_count <= 1 THEN
    INSERT INTO public.user_approvals (user_id, status) VALUES (NEW.id, 'approved');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF invite_valid THEN
    -- Auto-approve invited users
    INSERT INTO public.user_approvals (user_id, status) VALUES (NEW.id, 'approved');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  ELSE
    INSERT INTO public.user_approvals (user_id, status) VALUES (NEW.id, 'pending');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
