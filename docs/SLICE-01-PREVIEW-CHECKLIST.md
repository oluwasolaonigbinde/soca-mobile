# Slice 01 — Auth + Onboarding — Preview Checklist

Use this checklist while visually confirming Slice 01.

---

## Prerequisites

- [ ] `.env.local` exists with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Supabase project has `profiles` table and RLS configured (see `docs/schema-profiles.sql`)

---

## Run the app

```bash
npm start
```

Then press `w` for web, `a` for Android emulator, or `i` for iOS simulator.

---

## Smoke flow (5 steps)

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open app | Welcome screen: "SOCA" title, "Log In" and "Sign Up" buttons |
| 2 | Tap "Sign Up" → fill form (name, email, password) → Sign Up | Account created; either redirect to role selection or "Check your email" message |
| 3 | If redirected: choose role (e.g. Player) → Continue | Profile setup screen |
| 4 | Fill display name + location → Continue | Role home (e.g. "Player Home") |
| 5 | Restart app (close + reopen) | Still on role home; profile persists |

---

## Key screens & what to expect

| Route | What you should see |
|-------|---------------------|
| `/` (root) | Redirects based on auth/profile state |
| `/welcome` | SOCA title, "Log In", "Sign Up" |
| `/auth/login` | Email + password fields, "Log In", "Sign in with Google", link to Sign Up |
| `/auth/signup` | Full name, email, password fields, "Sign Up", link to Log In |
| `/onboarding/role` | 4 role cards (Player, Scout, Club, Organization), "Continue" |
| `/onboarding/profile-setup` | Display name, Location, Bio (optional), "Continue" |
| `/(player)/home` | "Player Home", welcome text, Upload Avatar, Sign Out |
| `/(scout)/home` | Scout home |
| `/(club)/home` | Club home |
| `/(org)/home` | Organization home |

---

## Optional: Google sign-in

- [ ] Tap "Sign in with Google" on login screen
- [ ] Complete OAuth flow (requires dev build + dashboard config; see `docs/GOOGLE_OAUTH_SETUP.md`)
- [ ] If config incomplete: expect error message; email/password flow still works

---

## Done

- [ ] Email/password sign-up works
- [ ] Role selection is saved
- [ ] Profile setup saves and persists after restart
- [ ] User lands on correct role home
