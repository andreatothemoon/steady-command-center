
-- Enums
CREATE TYPE public.account_type AS ENUM (
  'current_account', 'savings', 'cash_isa', 'stocks_and_shares_isa',
  'gia', 'sipp', 'workplace_pension', 'db_pension', 'mortgage',
  'crypto', 'employer_share_scheme', 'property'
);

CREATE TYPE public.wrapper_type AS ENUM ('none', 'isa', 'sipp', 'workplace_pension', 'db_pension');
CREATE TYPE public.source_type AS ENUM ('manual', 'imported', 'api');
CREATE TYPE public.confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.document_type AS ENUM ('pension_statement', 'broker_statement', 'payslip', 'mortgage', 'other');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.import_status AS ENUM ('pending', 'mapping', 'previewing', 'completed', 'failed');
CREATE TYPE public.household_role AS ENUM ('owner', 'member');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Households
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Household',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON public.households FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Household members
CREATE TABLE public.household_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.household_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Security definer helper: check household membership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id AND household_id = _household_id
  )
$$;

-- Get user's household IDs
CREATE OR REPLACE FUNCTION public.get_user_household_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = _user_id
$$;

-- Institutions
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Accounts
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT 'You',
  account_type public.account_type NOT NULL,
  wrapper_type public.wrapper_type NOT NULL DEFAULT 'none',
  current_value NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_type public.source_type NOT NULL DEFAULT 'manual',
  confidence public.confidence_level NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Account snapshots
CREATE TABLE public.account_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  balance NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.account_snapshots ENABLE ROW LEVEL SECURITY;

-- Cash flows
CREATE TABLE public.cash_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  flow_date DATE NOT NULL,
  flow_type TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_cash_flows_updated_at BEFORE UPDATE ON public.cash_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Holdings
CREATE TABLE public.holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  symbol TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC,
  current_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON public.holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Holding snapshots
CREATE TABLE public.holding_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  holding_id UUID NOT NULL REFERENCES public.holdings(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.holding_snapshots ENABLE ROW LEVEL SECURITY;

-- Documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  document_type public.document_type NOT NULL DEFAULT 'other',
  status public.document_status NOT NULL DEFAULT 'pending',
  extracted_data JSONB,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Import jobs
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  status public.import_status NOT NULL DEFAULT 'pending',
  column_mapping JSONB,
  row_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON public.import_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tax year summaries
CREATE TABLE public.tax_year_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,
  gross_income NUMERIC DEFAULT 0,
  pension_contributions NUMERIC DEFAULT 0,
  isa_contributions NUMERIC DEFAULT 0,
  adjusted_net_income NUMERIC DEFAULT 0,
  capital_gains NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, tax_year)
);
ALTER TABLE public.tax_year_summaries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tax_year_summaries_updated_at BEFORE UPDATE ON public.tax_year_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Retirement scenarios
CREATE TABLE public.retirement_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Scenario',
  current_age INTEGER NOT NULL DEFAULT 35,
  retirement_age INTEGER NOT NULL DEFAULT 57,
  current_pot NUMERIC NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC NOT NULL DEFAULT 0,
  employer_contribution NUMERIC NOT NULL DEFAULT 0,
  expected_return NUMERIC NOT NULL DEFAULT 5.0,
  inflation_rate NUMERIC NOT NULL DEFAULT 2.5,
  target_income NUMERIC NOT NULL DEFAULT 30000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.retirement_scenarios ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_retirement_scenarios_updated_at BEFORE UPDATE ON public.retirement_scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Retirement results
CREATE TABLE public.retirement_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.retirement_scenarios(id) ON DELETE CASCADE,
  projection_year INTEGER NOT NULL,
  nominal_value NUMERIC NOT NULL,
  real_value NUMERIC NOT NULL,
  estimated_income NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.retirement_results ENABLE ROW LEVEL SECURITY;

-- Document storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- =====================
-- RLS POLICIES
-- =====================

-- Households: members can read, only owners can update/delete
CREATE POLICY "Members can view their households" ON public.households
  FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), id));

CREATE POLICY "Members can update their households" ON public.households
  FOR UPDATE TO authenticated
  USING (public.is_household_member(auth.uid(), id));

-- Household members
CREATE POLICY "Members can view household members" ON public.household_members
  FOR SELECT TO authenticated
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can insert into their household" ON public.household_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Household-scoped tables: all CRUD for members
-- Institutions
CREATE POLICY "Members can manage institutions" ON public.institutions
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Accounts
CREATE POLICY "Members can manage accounts" ON public.accounts
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Account snapshots (join through accounts)
CREATE POLICY "Members can manage account snapshots" ON public.account_snapshots
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = account_snapshots.account_id
    AND a.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = account_snapshots.account_id
    AND a.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ));

-- Cash flows
CREATE POLICY "Members can manage cash flows" ON public.cash_flows
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Holdings
CREATE POLICY "Members can manage holdings" ON public.holdings
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Holding snapshots (join through holdings)
CREATE POLICY "Members can manage holding snapshots" ON public.holding_snapshots
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.holdings h
    WHERE h.id = holding_snapshots.holding_id
    AND h.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.holdings h
    WHERE h.id = holding_snapshots.holding_id
    AND h.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ));

-- Documents
CREATE POLICY "Members can manage documents" ON public.documents
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Import jobs
CREATE POLICY "Members can manage import jobs" ON public.import_jobs
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Tax year summaries
CREATE POLICY "Members can manage tax summaries" ON public.tax_year_summaries
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Retirement scenarios
CREATE POLICY "Members can manage retirement scenarios" ON public.retirement_scenarios
  FOR ALL TO authenticated
  USING (public.is_household_member(auth.uid(), household_id))
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- Retirement results (join through scenarios)
CREATE POLICY "Members can manage retirement results" ON public.retirement_results
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.retirement_scenarios rs
    WHERE rs.id = retirement_results.scenario_id
    AND rs.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.retirement_scenarios rs
    WHERE rs.id = retirement_results.scenario_id
    AND rs.household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  ));

-- Storage policies for documents bucket
CREATE POLICY "Members can view their documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members can delete their documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create household on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO new_household_id;
  INSERT INTO public.household_members (household_id, user_id, role) VALUES (new_household_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow authenticated users to create households (for initial insert via trigger)
CREATE POLICY "Allow household creation" ON public.households
  FOR INSERT TO authenticated
  WITH CHECK (true);
