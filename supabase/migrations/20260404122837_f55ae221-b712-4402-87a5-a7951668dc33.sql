ALTER TABLE public.db_pensions
  ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;