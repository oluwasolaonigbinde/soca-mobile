# /slice-next

Implement exactly one slice.

## Steps
1) Identify the next slice file with `Status: TODO` (lowest number).
2) Read:
- `specs/scope.md`
- `specs/decisions.md`
- the chosen slice file
3) Produce a short plan.
4) Implement the slice:
- Keep changes minimal and scoped.
- Update the slice file `Status:` to `DONE` and note any deviations or TODOs.
- If a new decision is made, append it to `specs/decisions.md` → Decision log.

5) Run `/verify` and include the verify report in the final message.

## Output format
- Slice implemented: `slices/XX-...`
- Files changed (list)
- Verify report
- Any TODOs/risks
