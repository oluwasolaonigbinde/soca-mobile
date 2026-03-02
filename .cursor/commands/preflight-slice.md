# /preflight-slice

Plan-only reviewer. Do not change code. Do not create files.

## Inputs
Read:
- specs/scope.md
- specs/decisions.md
- specs/acceptance.md
- all slices/*.md

## Task
1) Identify the next slice marked `Status: TODO` (lowest number).
2) Read that slice and extract:
   - required behaviors
   - routes/screens
   - data changes
   - acceptance checks

3) Review for common failure modes:
   - Redirect loops (redirects during loading)
   - Missing profile row race (needs upsert fallback)
   - Auth assumptions (OAuth config dependency)
   - RLS/storage policy assumptions not documented
   - Dependency creep (new libs without justification)
   - Conflicts with decisions.md
   - Conflicts with already-implemented code structure

4) Output:
- Verdict: PASS / WARN / FAIL
- Fixes required (max 7 bullets)
- If WARN: what can be safely built and patched after
- If FAIL: what must be changed in the slice plan before implementation

## Rules
- Be concise.
- Do not speculate about unknown infra; call out TODOs explicitly.
