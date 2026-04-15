-- Harden privileged helpers and bootstrap logic.

CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  SELECT email INTO result
  FROM auth.users
  WHERE id = _user_id;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_email(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_email(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_existing_admin BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('user-approval-bootstrap-admin'));

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  )
  INTO has_existing_admin;

  IF NOT has_existing_admin THEN
    INSERT INTO public.user_approvals (user_id, status) VALUES (NEW.id, 'approved');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_approvals (user_id, status) VALUES (NEW.id, 'pending');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
