## Plan: Resolve jspdf / jspdf-autotable peer conflict

### Change
- In `package.json`, bump `jspdf-autotable` from `^5.0.2` to `^5.0.7`.
- Keep `jspdf` at `^4.0.0`.

Version `5.0.7` widens the peer range to include `jspdf ^4`, eliminating the install-time/runtime mismatch that can cause `autoTable(doc, ...)` calls in `src/lib/pdf-generator.ts` and `src/lib/pdf-templates/grant-template.ts` to fail.

### Verification after apply
- Confirm install resolves without peer warnings.
- Smoke-test PDF generation paths:
  - Side Income Report PDF (EarnIt)
  - Grant template PDF (FundIt)
  - Schedule, event, capability statement templates

### Notes
- This does not address the `/earnit` white screen on its own (PDF code only runs on user click). The error boundary work from the previous step remains in place to surface any remaining render-time issues.
