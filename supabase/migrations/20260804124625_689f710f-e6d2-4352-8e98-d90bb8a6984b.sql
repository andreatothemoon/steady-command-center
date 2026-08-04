REVOKE EXECUTE ON FUNCTION public.reset_regression_household() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_regression_household() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_ni_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_ni_number(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_household_invitation(text, uuid, text, text) FROM anon;