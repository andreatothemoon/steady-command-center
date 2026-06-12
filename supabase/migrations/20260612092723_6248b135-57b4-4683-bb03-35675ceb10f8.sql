
GRANT EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_household_ids(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_approval_status(uuid)       TO authenticated;
