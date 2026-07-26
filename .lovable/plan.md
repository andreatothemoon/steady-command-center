## Goal
Harden the magic link sign-in flow against abuse: short-lived tokens, throttled requests, and guaranteed single-use.

## Changes

### 1. Short token expiry (server)
Supabase magic link OTPs default to a 1-hour lifetime. Reduce to **10 minutes** so a leaked or intercepted link becomes useless quickly.
- Set the auth OTP expiry (`mailer_otp_exp`) to `600` seconds via `supabase--configure_auth`.

### 2. Project-wide email rate limit (server)
Cap the number of auth emails (magic link + reset + confirmation) the project can send per hour to prevent an attacker enumerating or spamming an inbox.
- Set `rate_limit_email_sent` to `30` per hour via `supabase--configure_auth` (raise later if legitimate volume grows).

### 3. Per-email client throttle (frontend)
Prevent a single browser from firing the magic link button repeatedly for the same address.
- In `src/pages/AuthPage.tsx`:
  - Track last-send timestamp per email in `sessionStorage` under `magic_link_last_sent:<email>`.
  - Enforce a **60-second cooldown**; show remaining seconds in the button label and disable it while cooling down.
  - Use a `useEffect` interval to tick the countdown live.

### 4. Guarantee single-use / prevent replay (frontend)
Supabase already invalidates OTPs on first successful verification, but the current callback leaves the token in `window.location.hash` — a browser back/refresh or history sync (e.g. cross-window bridge) can resend the same URL and produce confusing "invalid grant" toasts, or worse expose the fragment.
- In `src/pages/AuthCallbackPage.tsx`:
  - After a successful `setSession` / `exchangeCodeForSession`, immediately `window.history.replaceState({}, "", "/auth/callback")` to strip `code`/`access_token`/`refresh_token` from the URL.
  - Guard against double-invocation of `complete()` in React StrictMode with a module-level `hasProcessed` ref keyed on the raw hash/query, so a token cannot be exchanged twice within one page load.

## Out of scope
- Server-side per-IP rate limiting (no primitive available; the hourly email cap + client cooldown is the practical mitigation).
- Custom token storage or a bespoke OTP table — Supabase Auth already enforces single-use and hashed storage.

## Technical notes
- `supabase--configure_auth` requires the four booleans; we'll pass current values unchanged and add `rate_limit_email_sent`. OTP expiry is set through the same call if the tool accepts it; otherwise the plan falls back to documenting it and we'll surface a follow-up if the parameter is rejected.
- The client cooldown is defense-in-depth only — the server rate limit is the real ceiling.
