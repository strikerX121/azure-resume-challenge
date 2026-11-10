# Portfolio batch A: prepared local only

Scope: portfolio frontend only. No push, PR, merge, workflow dispatch or deployment is authorised by this work. Batch B (3ST presentation) and SASSI marketing PR1 are separate lanes.

## Source and attribution

- Fresh remote main at preparation: `dd2af950f9ffc17cac01d34f78fc7884c0535a3b`.
- This isolated branch derives directly from the unreleased referral candidate `46986ef82db0f3d93d1be041a6144e76e11bf825`. Its original worktree and four-file correction are preserved, not recreated.
- Governing sources: current November 10 section of the Portfolio Contact Funnel Audit and current `Clients/SASSI.md`. These override the earlier audit reports' ARC corporate-build attribution.
- SASSI is Antonio-led, team-delivered client work, not a historically ARC-built or automatically 3ST-owned product. Antonio: PM/scoping, hands-on cloud architecture/engineering, coordination and customer success. Naeem: application development; Rakib: existing portal design credit. Automation stays a team credit without assigning an unconfirmed individual.
- SASSI usage totals and hands-off support outcomes are omitted. October release/update statements are source-qualified, not blanket client acceptance. No private commercial, IP or customer details are added.
- EMR remains a co-founded 3ST product. Roles distinguish cloud/delivery leadership, design and application implementation. Practice use is product-team-reported; stale unqualified totals/performance/risk-elimination claims are removed from this case. Current product plans belong to 3ST, not this portfolio.
- Visible EMR FAQ and FAQPage share one source. Product evaluation uses 3ST `/pricing`, rollout help uses 3ST `/contact`; architecture/team work uses portfolio `/contact`.
- These two case-study CreativeWork graphs explicitly credit Antonio as the case-study creator instead of inheriting ARC's default. This identifies article authorship, not sole application implementation or software IP ownership. Other cases retain the existing schema default.

## Frontend changes

Home retains the outcome-led headline, full introduction, credentials, portrait and individual/team positioning. Mobile moves existing actions immediately after the headline and the portrait below the introduction; desktop keeps its original arrangement. Existing 320px grid/CTA clipping is contained. Compact collaboration guidance uses existing home/services/contact surfaces only. Contact guidance follows the form to retain its previously tested early placement.

A page-opted no-JS fallback exposes static content on the five touched routes; shared consent, enquiry logic, tracking and styling files remain byte-equivalent to the candidate. Contact fields, mail-app draft handler and booking URLs are unchanged. No new form, endpoint, event or product plan assertion. No image, testimonial, CV or dependency bytes changed.

## Reproduce

With existing Node/npm and Python+Playwright Chromium:

    npm ci --ignore-scripts
    npm run build
    npm test
    npm run verify
    python scripts/test-release-prechecks.py
    npm run test:portfolio
    npm run preview -- --host 127.0.0.1 --port 4331

In another terminal, from this checkout:

    npm run test:portfolio:browser -- --artifacts <local-evidence>/browser
    npm run test:emr -- --artifacts <local-evidence>/emr-referral
    npm run test:funnel -- --artifacts <local-evidence>/funnel
    git diff --check

The existing funnel harness requires its real cached `gtag.js` at the artifact destination, not a stub. Collect traffic is intercepted locally; external hosts, local writes/API routes, service workers and sockets are blocked before navigation. Tests do not establish delivered mail, booking, backend acceptance, real analytics ingestion or current client usage. There is no separate lint script; `verify` supplies the supported emitted-content/render/copy/credential/analytics/upload gates. No packages are added to create a new lint path.

Evidence root: `C:/Users/anton/AppData/Local/hermes/artifacts/trident-existing-work-audit/portfolio-implementation/`. See `REVIEW.txt`, `results.json`, `baseline.json`, `browser/screenshot-route-proof.json`, logs and retained red runs. CV aliases must retain SHA256 `a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4` (220468 bytes).

## Rollback and release boundary

This is an unpublished isolated branch. To prepare a local rollback, use a new branch/worktree and revert this batch's commit; its parent retains the referral correction. Do not reset another worktree or force-remove locked trees. Nothing live needs rollback because nothing was released.

The actual workflow deploys on push to main or manual dispatch and has no PR preview gate. Neither trigger was invoked. Any later production release needs separate approval for the expanded diff, fresh remote reconciliation and the existing guarded release/readback procedure. Revert-and-redeploy is a future separately approved production path, not permission here. Upload-batch does not delete orphaned objects; CDN purge cannot remove already cached browser responses.

Limitations: Chromium lab QA only, no real phone/iOS Safari; no live backend, authenticated app, payment, support or client acceptance test; no clinical/security/performance outcome claimed. Existing software imagery is retained unchanged, masked in new browser evidence, and is not newly certified as anonymised. Current SASSI full acceptance, active usage, support performance and any individual automation credit remain unverified and are not promoted into public claims.
