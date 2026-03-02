# Acceptance — SOCA V1

This is the definition of done for slices and releases.

---

## Repo-wide definition of done (DoD)
A change is acceptable when:
1. App boots without crashing.
2. Auth works (sign up, login, logout).
3. Role onboarding works (role selection + minimal profile setup).
4. Core MVP flows are smoke-testable (see below).
5. TypeScript is safe (no silent type regressions).
6. `/verify` passes with a concise report.

---

## Required smoke flows (manual)
### Player
- Sign up / login
- Choose role = Player
- Create basic profile (photo optional unless implemented)
- Upload a highlight video
- See video in feed / profile
- Submit video to a challenge (if slice implemented)

### Scout / Club / Org
- Sign up / login
- Choose role
- Complete basic profile
- Discover players via search/filter
- View player profile + highlights
- Send a message to a player
- Mark event as Interested (if slice implemented)

---

## Verification commands (agent should adapt to repo)
The agent must run what exists in `package.json`. Recommended scripts:
- `npm run typecheck` (or `npx tsc -p . --noEmit`)
- `npm run lint` (if configured)
- `npm test` (if configured)

If these scripts do not exist, the agent should:
- report what is missing
- propose minimal additions in a future slice (do not invent a large test suite)

---

## Slice completion checklist
Each slice is DONE only if:
- Slice acceptance checks are met
- `/verify` is run and reported
- Any new decision is recorded in `specs/decisions.md` (Decision log)
