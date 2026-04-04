ALTER TABLE public.account_snapshots
  ADD CONSTRAINT account_snapshots_account_date_unique UNIQUE (account_id, snapshot_date);