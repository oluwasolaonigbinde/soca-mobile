# /audit-soca

You are auditing this repo against SOCA V1 scope.

## Inputs
- Read: `specs/scope.md`, `specs/decisions.md`, `specs/acceptance.md`, all `slices/*.md`.

## Task
1) Map current repo structure:
- list routes/screens
- list core feature areas implemented
- list Supabase usage (client location, env vars, tables/buckets referenced)
- list missing scripts for verify (typecheck/lint/test)

2) Compare to SOCA scope:
- For each major scope section (Auth, Profiles, Video, Discovery, Challenges, Messaging, Events, Admin, AI),
  mark as: DONE / PARTIAL / MISSING.

3) Recommend the next slice:
- Choose the smallest next slice that reduces risk.
- Explain what to implement and what files will be touched.

## Output format
- Repo map (bullets)
- Scope coverage table (DONE/PARTIAL/MISSING)
- Recommended next slice: `slices/XX-*.md`
- Risks/TODOs (short)
