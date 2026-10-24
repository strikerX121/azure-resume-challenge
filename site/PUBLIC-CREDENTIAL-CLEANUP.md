# Public Credential Cleanup

## Removed Feature

The Azure Function access key embedded in the site's homepage and `main.js` was removed.

The function is declared `AuthorizationLevel.Function` in `api/GetResumeCounter.cs`, so the browser call required a privileged credential in public page source. The counter and its label were removed rather than shipping that key.

## Verification

The site now passes the new `check-no-public-credentials.mjs` gate. It no longer emits any Function access credential in public output.

## Credential Location

The key was in two places:
1. `src/pages/index.astro` (line ~404) - the `fetch()` call
2. `main.js` (line 2) - the `getVisitCount()` call

Both were removed and replaced with explanatory comments. The key itself was never printed, copied, or exposed anywhere else in the codebase.

## Remaining Rotation Warning

The credential is not revoked by this change. The old value remains valid in the Azure function until a separately-approved server-side rotation occurs.

Old snapshot URLs and git history still contain the key, but they are not actively used.

## New Gate

Added `scripts/check-no-public-credentials.mjs` which scans:
- `dist/` - built output
- `src/` - source files
- `public/` - static assets
- `main.js` - root client script
- `index.html` - root page
- `js/` - client-side JS
- `docs/` - documentation

The gate is now part of the `npm run verify` workflow and will prevent any future leakage of credentials in public builds.