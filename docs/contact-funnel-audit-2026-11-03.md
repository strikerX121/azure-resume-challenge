# Contact funnel audit verification, 2026-11-03

## Scope and release boundary

Implemented on `fix/contact-funnel-audit-2026-11-03`, from
`4312a4b26673dab4773e1ab7d702297a1784335c`, in the isolated audit worktree.
No push, PR, merge, deploy, live configuration change or backend send is part
of this work. `.github/workflows/deploy.yml` runs on a push to `main` or manual
dispatch, so neither is a preview operation. The original checkout was not
used for writes or shared dependencies. Legacy no-npm text in the instruction
files conflicts with their current Astro build description; the existing
Astro build/verify scripts are the exercised implementation path.

## Tracking finding and bounded repair

Historical zero counts alone are not a demonstrated defect: there may have
been no qualifying interactions. Four read-only live HTML fetches confirmed
that tracking hooks and the existing GA tag ARE included. The inline hook is
byte-identical to the initial local build. However, Astro emits the config
function in a JavaScript module, so it is not `window.gtag`, which the existing
intent hooks require. In a local build with the actual cached GA library,
`typeof window.gtag` was `undefined` and a real email click queued no intent.
That independently demonstrated the defect; absence of historical events did
not. The repair explicitly exposes the existing queue function, with no new
SDK, destination, measurement ID or analytics configuration.

Two masked false-signal defects were separately reproduced by exposing the
queue only in the baseline test harness: internal contact navigation and an
invalid form-button click each queued a contact intent. Internal navigation
is no longer contact intent. Valid draft submission tracks once after native
validation; invalid clicks do not. The fallback email now retains its useful
context while deriving `method: email`, rather than an annotation suppressing
that method. Existing separately named project-enquiry events are unchanged.

Candidate tests execute the built scripts and actual cached `gtag.js` and
intercept the real GA collect URLs/POST batches locally. They assert exactly
four contact events (email, WhatsApp, booking, valid compose) and one separate
CV event, including context/method/file fields, without duplicate contact
signals. They also check GPC, DNT and legacy Microsoft DNT suppression for
custom contact/compose/CV events, SDK-unavailable queuing, keyboard actions,
internal-navigation negatives, no-JavaScript heroes and reduced motion.
Existing GA pageview/privacy configuration was not changed; this is not a
claim that all GA pageviews are suppressed by DNT. No synthetic events reached
production GA and no lead was sent. Local transport is not GA4 report ingestion
or key-event configuration proof.

## Funnel and preservation checks

- Standard author card between article and proof links points to resume and
  contact, without contact-conversion annotations. Photo and name bylines link
  to resume. Both audited Copilot posts now have proof entries pointing to the
  existing Apeiron Sumus resume evidence (95 FY26 engagements, 2,574+ trained).
  No new metrics, case-study claims or identities were invented.
- Resume has opening and closing contact links. Personal Gmail is unchanged;
  contact retains the ARC business address.
- Contact has booking, WhatsApp and email directly after its subheading, with
  50-52px-high mobile targets. Mobile booking bullets are hidden. Hero content
  and sidebar use the existing CSS-only `reveal-immediate` pattern, not the
  JavaScript observer. This pattern still has its existing 0.55s CSS entrance.
- Approved PDFs remain 220,468 bytes each, SHA-256
  `a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4`,
  under both public and built filenames.
- Build verification: 40 HTML files (Astro reports 39 built pages plus its
  redirect stub), 1,406 internal links, 126 image tags, 38 sitemap URLs,
  120 valid JSON-LD blocks. No missing image dimensions/loading, broken links,
  public em dashes, excluded copy, Function credentials or cache-policy gaps.
- `npm test` passes all three existing guard self-test suites, with new contact
  and resume hero regression fixtures. Browser suite: 30 recorded checks,
  including 16 page/viewport DOM cases, zero page errors, no overflow or broken
  local images. Chromium device emulation is not an actual iOS Safari test.

### First-screen contact actions, local browser coordinates

| Viewport | Baseline Book a Time y / bottom | Candidate booking y / bottom | Candidate WhatsApp and email y / bottom |
|---|---:|---:|---:|
| 360x640 | 864.8 / 916.8 | 323.1 / 375.1 | 385.1 / 435.1 |
| 390x664 | 781.7 / 833.7 | 284.8 / 336.8 | 346.8 / 396.8 |
| 390x844 | 781.7 / 833.7 | 284.8 / 336.8 | 346.8 / 396.8 |

Screenshots were reviewed. The full-page capture scrolls to reveal below-fold
content first; an earlier capture's empty form region was unrevealed content,
not absent markup. The existing secondary contact-card email is truncated on
narrow screens; the direct email button and fully selectable wrapping address
in the fallback remain available. No claim of eliminating every historical
visual imperfection is made.

## Cover change and local performance evidence

The two audited covers have WebP picture sources, preserving JPEG fallback,
OG/social URLs, dimensions, eager priority and decorative empty-alt semantics.
Only those four generated files were added. The originals are unchanged.

| Cover | JPEG bytes | WebP bytes | Reduction |
|---|---:|---:|---:|
| Train, 1200px | 26,387 | 12,008 | 54.5% |
| Train, 640px | 10,446 | 4,690 | 55.1% |
| Chefs, 1200px | 23,458 | 11,154 | 52.5% |
| Chefs, 640px | 9,309 | 4,310 | 53.7% |

Real browser `currentSrc` checks confirm WebP at ordinary density and the
1200px source at 390px/3x. The byte reduction and retained appearance justify
the change, not a claimed across-the-board LCP improvement.

Lighthouse 12.8.2, Chromium 156.0.8078.4, default mobile/simulated throttling,
three alternating paired LOCAL runs per page (24 total). Both builds use the
same Python static server, separate ports 4330/4331, fresh Lighthouse profiles.
All HTTPS is blocked in both variants, with external hostname resolution also
blocked. Raw network audits show zero successful HTTPS requests. These are
first-party render/asset controls, NOT comparable to the audit's live figures:
GA weight/CPU, CDN, real-user behavior and production analytics are excluded.
Some other local verification/browser work overlapped the first paired runs;
shared-host load and three samples limit any inference about small changes.

| Page | Median performance before / after | Median LCP before / after | Median transferred bytes before / after |
|---|---:|---:|---:|
| Contact | 98 / 98 | 1.890 / 2.040 s | 132,804 / 134,171 |
| Resume | 98 / 98 | 2.115 / 2.115 s | 159,529 / 160,184 |
| Train Copilot | 98 / 98 | 2.190 / 2.265 s | 160,490 / 149,360 |
| Good Chefs | 97 / 98 | 2.340 / 2.265 s | 158,211 / 149,154 |

All 24 runs: accessibility, best-practices and SEO 100, TBT 0 in this isolated
first-party control. Contact LCP was 150ms later and Train 75ms later despite
smaller covers; report these honestly, not as a speed win. Contact baseline LCP
range was 1.890-1.965s; candidate 2.040s. Other LCP values were stable across
three runs. Conversion/engagement improvement remains unmeasured.

## Durable evidence, outside git

`C:/Users/anton/AppData/Local/hermes/profiles/client-apps/artifacts/landing-audits-2026-11-03/portfolio/`

- `baseline-dist/`: frozen initial build, before source changes.
- `live-*.html`, `live-inclusion-analysis.json`: read-only live inclusion and
  exact hook comparison to the baseline. The initial urllib fetch hit HTTP403;
  requests succeeded. No browser JavaScript was executed on the live site.
- `gtag.js`: actual downloaded tag, hash recorded by the browser suite.
- `baseline-checks.json`, `phase1-tracking-checks.json`,
  `candidate-checks.json`, `baseline-*.png`, `candidate-*.png`.
- `final-build.log`, `final-verify.log`, `final-tests.log`,
  `final-browser-tests.log`, `final-baseline-browser-tests.log`.
- `lh-*.json`, `lh-*.log`, `lighthouse-runs.json`, `lighthouse-summary.json`.
- `cover-bytes.jsonl`, `cv-hashes.json` and backend primary-reference text.

An intermediate test incorrectly assumed `naturalWidth` was source pixels for
a width-descriptor srcset; browsers density-correct it. The corrected test
checks the actual selected 1200px URL. The failed attempt is retained as
`final-browser-tests-attempt1.log`, not relabeled as a passing run.

## Reproduce without production analytics

Node 22, npm, Python with Playwright and requests, and installed Chromium are
required. Used here: Playwright 1.64.0 and requests 2.34.2. No dependency was
added to the site just for browser tests. Use `python -m pip`, not an unrelated
`pip` executable, if creating a separately approved test environment.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run verify
npm test
# Separate terminal, bind loopback only:
python -m http.server 4331 --bind 127.0.0.1 --directory dist
# Another terminal serves the frozen artifact baseline:
python -m http.server 4330 --bind 127.0.0.1 --directory "$AUDIT/baseline-dist"
# AUDIT is an absolute durable directory containing cached gtag.js.
npm run test:funnel -- --artifacts "$AUDIT"
python scripts/test-contact-funnel.py --baseline --base http://127.0.0.1:4330 --artifacts "$AUDIT"
python scripts/verify-live-intent-inclusion.py --reuse --artifacts "$AUDIT"
node scripts/optimize-funnel-covers.mjs
python scripts/lighthouse-contact-funnel.py --cli "$LIGHTHOUSE_CLI" --chrome "$CHROME_PATH" --artifacts "$AUDIT"
```

The browser suite fulfills the real cached GA SDK locally, fulfills collect
requests with HTTP204 and blocks all other external requests. It does not use
a fake analytics implementation. Do not run synthetic clicks on production.
To repeat live inclusion later, omit `--reuse`; that performs read-only public
HTML requests, not script execution. Fresh cached GA can likewise be downloaded
by read-only HTTP GET from the existing script URL, never by visiting/clicking
the live contact page.

## Approval items left

Parent review and branch push/PR remain separate. Merge publishes and is not
authorized. GA4 key-event status, reporting ingestion and meaningful counts
still need authorized measurement-owner review; no Admin settings changed.
The real contact backend is proposal-only in `contact-form-backend-proposal.md`,
with named sending path choices and consent/security/rate-limit dependencies.
Do not deploy, add permissions/resources, send a message, or change live config
on the strength of this frontend verification.
