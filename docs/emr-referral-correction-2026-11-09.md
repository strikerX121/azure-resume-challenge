# Portfolio EMR referral correction

Status: local preparation only. No push, PR, merge or deployment authorized.
Base: dd2af950f9ffc17cac01d34f78fc7884c0535a3b (origin/main).

Antonio confirmed on November 9, 2026 that 3ST has a free tier and approved
neutral referral wording. No free-plan limits, paid prices, trial duration or
entitlements are established by that confirmation. The portfolio should refer
readers to the official product pricing page, not advertise an unsupported
commercial Offer.

Only the second services card changes. Its existing Service is replaced in the
same ItemList position, with description derived from the visible description
and engagement. The old nested Offer, priceSpecification, price, availability
and misleading personal-provider association are omitted for this referral.
Other service structures and page graphs are unchanged. The direct demo email,
existing contact handlers and opt-out/consent boundaries remain unchanged.
Card-only wrapping and a no-JavaScript fallback keep this referral accessible.
No new event, form, backend or tracker is introduced.

## Reproduce locally

Install with `npm ci --ignore-scripts`, then:

    npm run build
    npm test
    npm run verify
    python scripts/test-release-prechecks.py

Serve the static output, not the backend:

    python -m http.server 4331 --bind 127.0.0.1 --directory dist

With Python + Playwright Chromium available:

    npm run test:emr -- --artifacts <absolute-local-evidence-folder>
    npm run test:funnel -- --artifacts <absolute-local-funnel-evidence-folder>

The existing funnel suite requires its real cached gtag.js in that evidence
folder. It serves those bytes locally and intercepts collect requests; it does
not transmit to GA. The new EMR suite blocks all external requests and all
non-GET/HEAD requests before navigation. Both target loopback only. The new
suite also checks the actual base revision's unaffected page-owned graphs and
other three services, rather than hand-translating their expected structures.
These source parity checks are distinct from the real Chromium checks.

## Verified on November 9, 2026

Build, npm tests, verify and 10 offline release-helper tests passed. Built
services output contains seven valid JSON-LD blocks, one service ItemList,
four Service items and exactly one EMR referral at position 2. Its schema
combines the exact visible description and engagement and links the official
pricing URL. No Offer, priceSpecification, price99, unit-price or trial remains
in this referral. Other three service items and page-owned Organization,
BreadcrumbList, DefinedTermSet and FAQPage match the base revision. Person and
WebSite remain present. No other pricing source was edited.

Real Chromium: 14 EMR cases, JS enabled/disabled at 320/360/390/768/820/1024/1280px,
no card clipping or horizontal overflow and zero page errors. Existing funnel:
42 records, 24 layout cases, 66 contextual enquiry clicks, no-JS, opt-outs,
compose deduplication and keyboard checks passed with zero page errors.
The initial EMR test exposed mobile CTA clipping and existing no-JS invisibility;
both were corrected on this card only before the passing run.

Both CV aliases in public/ and dist/ remain exactly 220468 bytes, SHA256:
a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4

Actual iOS Safari/device tests, production delivery, live analytics ingestion,
search-engine indexing and rich-result eligibility were not tested or claimed.
Consent remains parked; no new consent UI or decline-flow test is implied.
Legacy backend .NET tests are outside this static referral change and not run.

Durable sanitized logs, browser results, screenshots and patch are under:
C:/Users/anton/AppData/Local/hermes/profiles/client-apps/artifacts/portfolio-emr-referral-2026-11-09/

## Release decision

Ready for local code review, HOLD production. The only current workflow deploys
on main pushes or workflow_dispatch, with no pull_request trigger. No remote
push or PR was performed. A later release needs separate explicit Antonio
approval, fresh main/workflow checks and the existing guarded release path.
After an authorized deployment, independently read apex/www services HTML and
JSON-LD and CV bytes. No recrawl submission is automatic.
