# Slice 10 — Polish + Hardening
Status: DONE

## Goal
Stabilize the MVP:
- Loading/empty states
- Error handling
- Basic performance improvements (lists, caching)
- Tighten types, reduce duplication
- Ensure acceptance checklist is consistently met

## Acceptance checks
Manual:
- No dead screens
- Core flows feel stable
Agent verify:
- `/verify` consistently passes

## Out of scope
- New major features

## Completion notes
- Fixed error handling: `recordVideoView`, `recordProfileView`, and `markConversationRead` now use proper `.catch()` instead of swallowing errors or logging to console
- Removed 14 debug `console.log` / `console.error` statements from `auth/callback.tsx`, `avatars.ts`, all home screens, message thread, and auth store
- Extracted shared `showMessage(title, message)` utility to `src/lib/showMessage.ts`, replacing 5 duplicated inline copies across `report/new.tsx`, `admin/verification.tsx`, `admin/feature.tsx`, `admin/reports.tsx`, `admin/challenges.tsx`
- Consolidated 4 near-identical home screens (`(player)`, `(scout)`, `(club)`, `(org)`) into a shared `src/components/home/HomeScreen.tsx` component with role-specific props
- Consolidated `me/followers.tsx` and `me/following.tsx` into a shared `src/components/UserListScreen.tsx`
- All home screens now use `showMessage` for consistent cross-platform error alerts
- Zero `any` types, zero TODOs in source code
- `/verify` passes: typecheck OK, lint clean, 14/14 tests pass
