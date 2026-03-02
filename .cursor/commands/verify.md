# /verify

Run verification for this repo and output a concise report.

## What to run
1) Use existing `package.json` scripts if present:
- `npm run typecheck` (or `npx tsc -p . --noEmit`)
- `npm run lint` (if configured)
- `npm test` (if configured)

2) If scripts are missing:
- Report what is missing
- Do NOT add a large test suite here
- Suggest minimal additions as TODOs

## Output format
- Commands run
- Pass/fail
- If fail: top errors + likely fix path
