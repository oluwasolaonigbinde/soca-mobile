# SOCA V1 — Agent Contract (Cross-tool)

This repo is built slice-by-slice using Cursor Agent (Compose/Agent), Codex CLI, Claude Code, or similar agentic tools.

## Source of truth
- Product scope: `specs/scope.md`
- Decisions (do not re-litigate): `specs/decisions.md`
- Acceptance definition: `specs/acceptance.md`
- Execution plan: `slices/*.md`

If any change conflicts with `specs/scope.md`, stop and propose an update to `specs/decisions.md` or the relevant slice.

## Operating rules (always)
1. Start with a short plan before editing multiple files.
2. Make the smallest safe change-set.
3. Keep TypeScript strictness and avoid `any` unless justified.
4. Do not add new dependencies unless explicitly required; prefer built-ins / existing deps.
5. Every slice must end with verification (`/verify`) + a short report.
6. Do not "invent" missing requirements; if a detail is unknown, leave a `TODO:` and proceed with a safe default consistent with `specs/decisions.md`.

## Workflow
- `/audit-soca`  
  Maps current repo state to scope + lists gaps + recommends next slice.
- `/slice-next`  
  Implements the next slice marked `Status: TODO`, updates the slice to `DONE`, and logs key decisions.
- `/verify`  
  Runs repo verification steps and outputs a concise report.
- `/handoff`  
  Produces setup + env + runbook notes.

## Quality bar
A change is "done" only if:
- It matches `specs/scope.md`
- It matches conventions in `.cursor/rules/*`
- Verification passes per `specs/acceptance.md`
- Manual smoke checks for affected flows are described (and ideally executed)

## Communication style
- Prefer checklists, file paths, and explicit acceptance criteria.
- Avoid long essays.
- When unsure: state assumptions + mark TODOs.
