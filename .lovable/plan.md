# Backend Security Hardening

Single Supabase migration that closes the 33 linter warnings and the email-enumeration surface. No frontend changes needed — all current client calls keep working.

## Goals

1. Remove the one overly-permissive RLS policy (linter WARN 1).
2. Stop exposing internal `SECURITY DEFINER` helper functions through the public API.
3. Restrict `get_user_email` so only admins can resolve emails.

## What changes

### 1. Audit & fix the permissive RLS policy
Find the policy flagged by linter rule `0024_permissive_rls_policy` (an INSERT/UPDATE/DELETE policy using `USING (true)` or `WITH CHECK (true)`) and rewrite it to scope by `auth.uid()` / `is_household_member(...)`. Likely candidate: a policy on `household_invitations`, `user_approvals`, or `user_roles`. I'll confirm by reading `pg_policies` before writing the migration body.

### 2. Revoke EXECUTE on internal helper functions
These are called only from other DB functions / triggers, never from the client. Revoke from `anon` and `authenticated`:

- `is_household_member`
- `is_household_owner`
- `get_user_household_ids`
- `has_role`
- `get_approval_status`
- `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq` (edge-function only — keep `service_role`)
- `update_updated_at_column` (trigger only)
- `handle_new_user`, `handle_new_user_approval` (triggers only)

Functions that **stay callable** by `authenticated` (used by the client):
- `accept_household_invitation`
- `get_invitation_by_token` (must remain callable by `anon` — used on the public invite page before sign-in)
- `get_ni_number`, `set_ni_number`

### 3. Lock down `get_user_email`
Currently any authenticated user can resolve any other user's email by id.
Change to: only callable by an admin (`has_role(auth.uid(), 'admin')`), and the function itself enforces the check before returning.

```text
admin? → return auth.users.email
else   → return null
```

`usePendingApprovals` (the only client caller) is admin-only, so behaviour is preserved.

## Out of scope (separate plan)

- Type regeneration + removing `(supabase as any)` casts
- Form validation with zod
- Dead code cleanup
- `useNetWorthHistory` query-key fix

## Verification

After the migration:
1. Re-run `supabase--linter` — expect 0 SECURITY warnings (or only known-safe ones).
2. Smoke test: sign-in, view dashboard, accept an invitation, admin views the approvals queue.

## Approval

Approve and I'll generate the migration SQL in a single `supabase--migration` call. I'll inspect `pg_policies` first to identify the exact permissive policy so the fix is precise rather than guessed.
