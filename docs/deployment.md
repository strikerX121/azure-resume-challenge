# Deployment

The site is an **Astro static build** published to Azure Blob Storage and served
through the Cloudflare `portfolio-origin-proxy` Worker (Front Door was replaced).
Deployment is automatic: pushing to `main` runs
`.github/workflows/deploy.yml`, which builds, verifies, uploads and purges the
CDN.

> **Merging to `main` is publishing.** There is no staging gate between the
> default branch and production. Treat a merge as a release.

## Azure resources

These are repository-recorded identifiers, not a fresh Azure resource inventory.
The Front Door rows are legacy references, not the current serving/purge path.

| Resource | Name |
|----------|------|
| Subscription | Azure-Resume-Challenge (ID: `9682ff58-8f3e-47f1-8a01-29897cc7ce13`) |
| Resource group | `Azure-Resume-Challenge` |
| Storage account | `azureresumefrontend1` |
| Storage container | `$web` |
| Front Door profile | `azureresumearc` |
| Front Door endpoint | `azureresumearc` |
| Visit-counter function | `getresumecounterworking` (Azure Functions, Cosmos DB backed) |

The workflow reads its active Azure resource settings from repository secrets
(`ARC_RESUME_*`) rather than hardcoding them. Changing any Azure-side resource is a `cloud-ops` concern,
not a repo change.

## The normal path

```bash
npm ci
npm run build      # emits dist/
npm run verify     # build audit + copy check; the workflow gates on this
```

Then merge to `main`. The workflow does the rest.

## What the workflow does, and why the order matters

1. `npm ci`, `npm run build`, `npm run verify`.
2. `az login` with the service principal.
3. Upload in **ordered passes**: a baseline that covers everything, then
   deliberate overrides that widen the cache for specific classes.
4. Purge Cloudflare using the release-only helper, which fails closed and logs
   only HTTP status, JSON success and bounded numeric error codes. This does not
   repair an unauthorized token.
5. Read `Cache-Control` and the CV hash back from the edge, with bounded
   retries, and fail the run on a mismatch.

### Cache policy

Cloudflare must preserve these origin headers. The November 4, 2026 read-only
preflight confirmed that the live Worker only proxies the origin response and
does not set `Cache-Control`. The zone's Browser Cache TTL was `14400`, raising
`robots.txt` from the origin's `3600` to `14400`, and both mutable PDFs from `0`
to `14400` at the public edge. The correct dependency is an owner-approved
Cloudflare Browser Cache TTL change to **Respect Existing Headers**, followed by
served readback on apex and www. It is not a Worker rewrite, DNS change, new app
header, or permission to raise `CRAWLER_CACHE` to pass verification. Cache Rule
overrides were not readable in preflight; if an override remains after the zone
setting is corrected, the owner must inspect it. Do not assume a zone setting
change alone proves the served result.

This is separate from the proven purge authorization failure (HTTP 401,
Cloudflare code `10000`) using the GitHub-held credential. Neither a code change
nor a successful read-only API call clears that authorization gate. No repeat
diagnostic purge is authorized by this runbook. Keep release blocked until the
owner resolves effective authorization and the separately authorized validation
confirms the actual purge succeeds. Purging the edge does not clear browsers'
already-cached copies.

The owner reported correcting the existing token and browser TTL on November 4.
Independent pre-release GETs at 17:53 UTC confirmed robots `max-age=3600` and
both approved CV aliases `max-age=0, must-revalidate` on apex and www, with
unchanged approved hashes. Controlled validation run `41881818077` then proved
one actual single-file purge using the existing GitHub secrets: HTTP 200,
`success=true`, no error codes, and healthy before/after GETs. This clears the
historical authorization/header prerequisites for PR6, not a substitute for its
normal deployment purge and post-deploy readback. No credentials or settings
were changed by that validation.

The served-header check compares exact directive values and requires successful
HTTP responses. It checks the complete baseline policy on HTML and mutable PDFs,
not merely the presence of `must-revalidate`, and retains the CV byte check.
Run `python scripts/test-release-prechecks.py` for offline purge/header fixtures;
CI runs this before Azure login or upload.

| Pass | Selects | `Cache-Control` |
|---|---|---|
| 0 | **everything** in `dist/` | `public, max-age=0, must-revalidate` |
| 1 | `*.png *.jpg *.jpeg *.webp *.avif *.gif *.ico *.svg` | `public, max-age=604800, stale-while-revalidate=86400` |
| 2 | `*.txt *.xml *.json *.webmanifest` | `public, max-age=3600` |
| 3 | `_astro/*` (**last**) | `public, max-age=31536000, immutable` |

HTML and PDFs get no override pass: the pass-0 baseline is already the policy
they need. A copy fix must be visible immediately, and the CV filename is
stable while its bytes can change, so neither may be pinned.

**Why baseline-first instead of one pattern per class.** `--pattern` is Python
`fnmatch` against the *full joined path*, and fnmatch's `*` matches `/` too.
That broke the previous design in two ways:

- `**/*.html` expands to `dist/**/*.html`, which requires a literal `/` after
  `dist/`. It therefore never matched `dist/index.html` or `dist/404.html`.
  The only step that covered them ran with `--overwrite false`, which skips
  blobs that already exist, so **the homepage and 404 page could never be
  updated by a deploy.**
- Conversely, `*.svg`, `*.webp` and `*.js` *do* reach into `_astro/`, so a
  later pass stripped the immutable header an earlier pass had set.

Pass 0 removes the "did every class get matched?" question entirely, and the
override passes are ordered so the last writer for any overlapping file is the
correct one. That is why `_astro/` runs last.

`scripts/check-upload-policy.mjs` (part of `npm run verify`) enforces this. It
parses the real workflow, replicates fnmatch, and asserts the resulting policy
for every file in `dist/` plus a fixture covering the shapes that broke. Run
against the old workflow it reports root HTML as never-deployed and 11 `_astro`
files as losing immutability.

**Never mark a mutable filename immutable.** A stale mutable filename behind an
immutable header cannot be corrected without a purge, and visitors who already
cached it will not see the fix until it expires.

**No upload step may swallow errors.** Every step runs under `set -euo
pipefail` with no `|| true` / `|| echo`. An authorization, network or quota
failure must fail the deploy rather than be reported as "nothing left to
upload".

**`upload-batch` never deletes.** It only adds and replaces, so a page removed
or renamed in the repo stays reachable at its old URL until the blob is deleted
by hand. See Rollback.

## The downloadable CV

`public/Antonio-Cumberbatch-CV-2026.pdf` and `public/resume.pdf` are the **same
approved artifact** under two filenames. The second is a legacy alias kept so
older links keep working.

These bytes are supplied and approved. Do not regenerate, re-compress or rewrite
the PDF. Both files must hash to:

```
a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4   (220,468 bytes)
```

Verify before releasing:

```bash
sha256sum public/*.pdf dist/*.pdf
```

## Rollback

The site is a static build from a git commit, so rollback is a redeploy of an
earlier tree. There is no stored build artifact to restore, and no way to
"re-publish" a previous deploy without producing a commit that builds it.

Use a revert. It is the only path tested here, it keeps `main` fast-forwardable
for everyone else, and it leaves an honest history of what was shipped and
withdrawn.

```bash
# 1. Find the merge that shipped the bad change.
git log --oneline --merges main

# 2. Revert it. PRs land as merge commits, so -m 1 keeps main's first parent.
git revert -m 1 <merge-sha>

# 3. Open the revert as a PR and merge it the same way anything else ships.
#    Merging to main triggers deploy.yml, which rebuilds and republishes.
```

If the offending change was pushed as a plain (non-merge) commit, drop `-m 1`:

```bash
git revert <commit-sha>
```

**Do not force-push `main` to roll back.** Rewriting the published branch
desynchronises every other clone and open PR, and it destroys the record of
what was actually deployed. A revert costs one extra commit and is reversible;
a force-push is neither.

### What rollback does and does not restore

| Restored by a revert+redeploy | Not restored |
|---|---|
| HTML, CSS, JS, images and PDFs that still exist in the reverted tree | Files the bad deploy **added**. `upload-batch` never deletes, so a page added by the bad commit stays live at its URL until the blob is removed by hand. |
| `Cache-Control` headers, which are re-applied by every upload pass | Cloudflare's cached copies, until the purge step completes, and browser copies until their TTL expires. |
| The approved CV bytes, which the workflow hash-checks after deploy | Anything changed outside this repo (DNS, Cloudflare settings/Worker, Functions app). |

That first "not restored" row is the one that catches people. A rollback makes
the old pages correct again; it does **not** make a newly introduced page
disappear. If the bad deploy added a URL that must not stay public, delete the
blob explicitly:

```bash
az storage blob delete --account-name <storage-account> \
  --container-name '$web' --name '<path/to/orphan.html>'
```

### After any rollback

- Confirm the deploy run's purge step and the `Verify served cache headers and
  CV bytes` step both passed. That step is the proof the rollback actually
  reached the edge; a green build alone is not.
- HTML revalidates on every request, so pages recover as soon as the purge
  lands. A stale image can persist for up to a week, because images are cached
  for seven days.
- Re-check both CV URLs return the approved hash. The workflow does this
  automatically and fails the run on a mismatch.
- If only one asset is wrong, purging the endpoint is faster than a redeploy.

## Local development

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build && npm run preview
```

### Repeatable checks

| Command | What it does |
|---|---|
| `npm run verify` | Everything below, in one go. What CI gates on. |
| `npm run audit:build` | Broken internal links, broken/unsized images, canonical vs sitemap, JSON-LD validity, SEO artefacts. |
| `npm run check:copy` | Fails if any em dash reaches public copy, including `&mdash;`, `&#8212;`, `\u2014` and percent-encoded forms. |
| `npm run check:upload` | Replays the deploy workflow's upload selection against `dist/` and a fixture. Fails if any file would be missed, mis-cached, or left stale. Also hash-checks the approved CV. No Azure write, no network. |
| `npm run optimize:images` | Re-runs the image pipeline. Reads parked masters, so it is safe to run twice. |
| `npm run generate:covers` | Regenerates every blog and page cover from `scripts/covers/`. Deterministic, so an unchanged motif produces identical bytes. |

### Images

Served raster assets are generated by `scripts/optimize-images.mjs`. Untouched
full-resolution masters live in `media-originals/`, which sits outside the Astro
build and never reaches `dist/`. Prefer importing from `src/assets/` so Astro
hashes and converts the file; only put something in `public/` when it needs a
stable, directly fetchable URL (the social card, favicons, `robots.txt`).

Cover art (blog posts, case-study heroes, the automations banner) is drawn as
SVG in `scripts/covers/` and rasterised by `scripts/generate-covers.mjs` into
`public/images/blog/` and `public/images/covers/`. These live in `public/` on
purpose: each cover doubles as the page's `og:image`, which needs a stable URL
and a raster format (most social scrapers ignore SVG). Each cover ships at
1200x630 plus a 640px sibling for `srcset`; the three full-bleed case-study
heroes also get a 1600x600 `-wide` variant. The art is abstract by rule: no
mock product UI, nothing that could pass for a client screenshot, and no
generated people. Real photos (team portraits, the T&TMA booth gallery) are
never substituted with generated images.

## The serverless backend

`api/` holds the Azure Functions visit counter (C# .NET, in-process v2 bindings),
deployed separately:

```bash
cd api && func azure functionapp publish <function-app-name>
```

Local run needs Azure Functions Core Tools and a gitignored
`api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",
    "AzureResumeConnectionString": "<your-cosmos-db-connection-string>"
  }
}
```

`api/contact/index.js` is an **undeployed stub**. No workflow publishes it and
`GET /api/contact` returns 404 in production, which is why the contact page
composes a mail draft in the visitor's own client instead of claiming to send
server-side. Wiring up a real endpoint needs a mail provider and a secret, and
that is a separate approval.
