-- Drop the auth row we created via raw SQL; the edge function will re-provision
-- via the auth admin API so hashing / identity metadata are canonical.
DELETE FROM auth.identities WHERE identity_data->>'email' = 'regression@wealthos.test';
DELETE FROM public.household_members WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'regression@wealthos.test');
DELETE FROM public.user_approvals WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'regression@wealthos.test');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'regression@wealthos.test');
DELETE FROM auth.users WHERE email = 'regression@wealthos.test';