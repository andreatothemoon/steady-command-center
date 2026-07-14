-- Idempotent seed for the regression test user + household.
-- Safe to re-run; only touches rows scoped to the regression user's household.

DO $$
DECLARE
  v_user_id UUID;
  v_household_id UUID;
  v_adult_a UUID;
  v_adult_b UUID;
  v_pension_id UUID;
  v_acct RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Ensure user exists with known password
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'regression@wealthos.test';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'regression@wealthos.test',
      crypt('RegressionTest2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Regression Tester"}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'regression@wealthos.test', 'email_verified', true),
      'email', v_user_id::text,
      now(), now(), now()
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('RegressionTest2026!', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  -- 2. Approve + role
  INSERT INTO public.user_approvals (user_id, status)
  VALUES (v_user_id, 'approved')
  ON CONFLICT (user_id) DO UPDATE SET status = 'approved';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Household
  SELECT hm.household_id INTO v_household_id
    FROM public.household_members hm
    JOIN public.households h ON h.id = hm.household_id
   WHERE hm.user_id = v_user_id AND hm.role = 'owner' AND h.name = 'Regression Household'
   LIMIT 1;

  IF v_household_id IS NULL THEN
    INSERT INTO public.households (name) VALUES ('Regression Household') RETURNING id INTO v_household_id;
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_household_id, v_user_id, 'owner');
  END IF;

  -- 4. Wipe existing regression-household data
  DELETE FROM public.account_snapshots WHERE account_id IN (SELECT id FROM public.accounts WHERE household_id = v_household_id);
  DELETE FROM public.holdings WHERE account_id IN (SELECT id FROM public.accounts WHERE household_id = v_household_id);
  DELETE FROM public.cash_flows WHERE household_id = v_household_id;
  DELETE FROM public.db_accrual_slices WHERE pension_id IN (SELECT id FROM public.db_pensions WHERE household_id = v_household_id);
  DELETE FROM public.db_pensions WHERE household_id = v_household_id;
  DELETE FROM public.accounts WHERE household_id = v_household_id;
  DELETE FROM public.household_profiles WHERE household_id = v_household_id;

  -- 5. Profiles
  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Adult A', 'adult', true) RETURNING id INTO v_adult_a;
  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Adult B', 'adult', false) RETURNING id INTO v_adult_b;
  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Child', 'child', false);

  -- 6. Accounts
  INSERT INTO public.accounts (household_id, owner_name, name, account_type, wrapper_type, current_value, last_updated) VALUES
    (v_household_id, 'Test Adult A', 'Test Current', 'current_account', 'none', 4200, now()),
    (v_household_id, 'Test Adult A', 'Test ISA', 'stocks_and_shares_isa', 'isa', 28500, now()),
    (v_household_id, 'Test Adult B', 'Test SIPP', 'sipp', 'sipp', 61000, now()),
    (v_household_id, 'Test Adult A', 'Test Property', 'property', 'none', 425000, now()),
    (v_household_id, 'Test Adult A', 'Test Mortgage', 'mortgage', 'none', -210000, now());

  -- 7. Snapshots (2 months back for each account)
  FOR v_acct IN SELECT id FROM public.accounts WHERE household_id = v_household_id LOOP
    INSERT INTO public.account_snapshots (account_id, snapshot_date, balance) VALUES
      (v_acct.id, (v_today - INTERVAL '1 month')::date, 1500),
      (v_acct.id, (v_today - INTERVAL '2 months')::date, 1400);
  END LOOP;

  -- 8. Cash flows
  INSERT INTO public.cash_flows (household_id, flow_type, amount, flow_date, description, tag) VALUES
    (v_household_id, 'income', 65000, '2025-05-01', 'Test salary', 'salary'),
    (v_household_id, 'pension_contribution', 5200, '2025-05-01', 'Employer pension', 'employer'),
    (v_household_id, 'income', 48000, '2025-05-01', 'Test salary B', 'salary');

  -- 9. DB pension + slices
  INSERT INTO public.db_pensions (
    household_id, name, scheme_type, current_age, retirement_age,
    current_salary, salary_growth_rate, accrual_rate,
    revaluation_type, revaluation_rate, indexation_type
  ) VALUES (
    v_household_id, 'Test Career Average', 'CARE', 42, 67,
    65000, 0.03, 54, 'CPI', 0.02, 'CPI'
  ) RETURNING id INTO v_pension_id;

  INSERT INTO public.db_accrual_slices (pension_id, year, pensionable_salary, accrual_rate, pension_earned, revalued_value) VALUES
    (v_pension_id, 2023, 55000, 54, 55000.0/54, 55000.0/54),
    (v_pension_id, 2024, 60000, 54, 60000.0/54, 60000.0/54),
    (v_pension_id, 2025, 65000, 54, 65000.0/54, 65000.0/54);

  RAISE NOTICE 'Regression seed complete: user=% household=%', v_user_id, v_household_id;
END$$;

-- Helper the test runner can call to reset just the regression household back to
-- a clean seeded state between runs. Restricted to the regression user.
CREATE OR REPLACE FUNCTION public.reset_regression_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_household_id UUID;
  v_adult_a UUID;
  v_adult_b UUID;
  v_pension_id UUID;
  v_acct RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'regression@wealthos.test';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Regression user does not exist';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
    RAISE EXCEPTION 'Only the regression user can reset the regression household';
  END IF;

  SELECT hm.household_id INTO v_household_id
    FROM public.household_members hm
    JOIN public.households h ON h.id = hm.household_id
   WHERE hm.user_id = v_user_id AND hm.role = 'owner' AND h.name = 'Regression Household'
   LIMIT 1;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Regression household missing';
  END IF;

  DELETE FROM public.account_snapshots WHERE account_id IN (SELECT id FROM public.accounts WHERE household_id = v_household_id);
  DELETE FROM public.holdings WHERE account_id IN (SELECT id FROM public.accounts WHERE household_id = v_household_id);
  DELETE FROM public.cash_flows WHERE household_id = v_household_id;
  DELETE FROM public.db_accrual_slices WHERE pension_id IN (SELECT id FROM public.db_pensions WHERE household_id = v_household_id);
  DELETE FROM public.db_pensions WHERE household_id = v_household_id;
  DELETE FROM public.accounts WHERE household_id = v_household_id;
  DELETE FROM public.household_profiles WHERE household_id = v_household_id;

  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Adult A', 'adult', true) RETURNING id INTO v_adult_a;
  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Adult B', 'adult', false) RETURNING id INTO v_adult_b;
  INSERT INTO public.household_profiles (household_id, name, role, is_primary) VALUES
    (v_household_id, 'Test Child', 'child', false);

  INSERT INTO public.accounts (household_id, owner_name, name, account_type, wrapper_type, current_value, last_updated) VALUES
    (v_household_id, 'Test Adult A', 'Test Current', 'current_account', 'none', 4200, now()),
    (v_household_id, 'Test Adult A', 'Test ISA', 'stocks_and_shares_isa', 'isa', 28500, now()),
    (v_household_id, 'Test Adult B', 'Test SIPP', 'sipp', 'sipp', 61000, now()),
    (v_household_id, 'Test Adult A', 'Test Property', 'property', 'none', 425000, now()),
    (v_household_id, 'Test Adult A', 'Test Mortgage', 'mortgage', 'none', -210000, now());

  FOR v_acct IN SELECT id FROM public.accounts WHERE household_id = v_household_id LOOP
    INSERT INTO public.account_snapshots (account_id, snapshot_date, balance) VALUES
      (v_acct.id, (v_today - INTERVAL '1 month')::date, 1500),
      (v_acct.id, (v_today - INTERVAL '2 months')::date, 1400);
  END LOOP;

  INSERT INTO public.cash_flows (household_id, flow_type, amount, flow_date, description, tag) VALUES
    (v_household_id, 'income', 65000, '2025-05-01', 'Test salary', 'salary'),
    (v_household_id, 'pension_contribution', 5200, '2025-05-01', 'Employer pension', 'employer'),
    (v_household_id, 'income', 48000, '2025-05-01', 'Test salary B', 'salary');

  INSERT INTO public.db_pensions (
    household_id, name, scheme_type, current_age, retirement_age,
    current_salary, salary_growth_rate, accrual_rate,
    revaluation_type, revaluation_rate, indexation_type
  ) VALUES (
    v_household_id, 'Test Career Average', 'CARE', 42, 67,
    65000, 0.03, 54, 'CPI', 0.02, 'CPI'
  ) RETURNING id INTO v_pension_id;

  INSERT INTO public.db_accrual_slices (pension_id, year, pensionable_salary, accrual_rate, pension_earned, revalued_value) VALUES
    (v_pension_id, 2023, 55000, 54, 55000.0/54, 55000.0/54),
    (v_pension_id, 2024, 60000, 54, 60000.0/54, 60000.0/54),
    (v_pension_id, 2025, 65000, 54, 65000.0/54, 65000.0/54);
END$$;

REVOKE ALL ON FUNCTION public.reset_regression_household() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_regression_household() TO authenticated;