
REVOKE EXECUTE ON FUNCTION public.is_household_member(uuid, uuid)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_household_ids(uuid)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_approval_status(uuid)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_approval()        FROM PUBLIC;
