-- Add a self-referencing link so mortgages can reference a property account
ALTER TABLE public.accounts
ADD COLUMN linked_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL DEFAULT NULL;