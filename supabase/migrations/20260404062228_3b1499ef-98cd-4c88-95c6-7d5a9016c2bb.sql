ALTER TABLE public.accounts
ADD COLUMN interest_rate numeric DEFAULT NULL,
ADD COLUMN term_remaining_months integer DEFAULT NULL;