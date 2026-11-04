# Verification

The repository uses executable guards in `scripts/`, not an unconfigured test
framework. Run from the repository root:

```bash
npm run build
npm run verify
npm test
```

- `verify`: built links, images, metadata/schema, copy, upload/cache policy,
  approved CV bytes, credential/content guards and pricing snapshot consistency.
- `test`: negative/positive fixtures for critical-render, content-policy and
  credential guards. Contact/resume heroes are covered alongside the homepage.
- `npm run test:funnel -- --artifacts "$AUDIT"`: real local Chromium interaction,
  cached real GA SDK, intercepted collect requests, opt-outs, invalid/valid email
  draft behavior, internal-navigation negatives, mobile DOM, keyboard, reduced
  motion, no-JavaScript heroes and responsive images. Serve candidate `dist/`
  on loopback port 4331 first. Python Playwright/Chromium and requests are test
  prerequisites, not site/runtime dependencies.

The audit artifact directory must contain a read-only downloaded `gtag.js`.
All non-local browser requests are intercepted, with collect fulfilled locally.
Never substitute production clicks or real enquiries for these tests.

See [the contact-funnel verification record](../docs/contact-funnel-audit-2026-11-03.md)
for reproducible commands, baseline port 4330, paired Lighthouse conditions,
raw artifact locations and remaining approval boundaries.
