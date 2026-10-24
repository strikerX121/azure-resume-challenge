# Deployment

The site is an **Astro static build** published to Azure Blob Storage and served
through Azure Front Door. Deployment is automatic: pushing to `main` runs
`.github/workflows/deploy.yml`, which builds, verifies, uploads and purges the
CDN.

> **Merging to `main` is publishing.** There is no staging gate between the
> default branch and production. Treat a merge as a release.

## Azure resources

| Resource | Name |
|----------|------|
| Subscription | Azure-Resume-Challenge (ID: `9682ff58-8f3e-47f1-8a01-29897cc7ce13`) |
| Resource group | `Azure-Resume-Challenge` |
| Storage account | `azureresumefrontend1` |
| Storage container | `$web` |
| Front Door profile | `azureresumearc` |
| Front Door endpoint | `azureresumearc` |
| Visit-counter function | `getresumecounterworking` (Azure Functions, Cosmos DB backed) |

The workflow reads all of these from repository secrets (`ARC_RESUME_*`) rather
than hardcoding them. Changing any Azure-side resource is a `cloud-ops` concern,
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
4. Purge the Front Door endpoint.
5. Read `Cache-Control` and the CV hash back from the edge, with bounded
   retries, and fail the run on a mismatch.

### Cache policy

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
| `Cache-Control` headers, which are re-applied by every upload pass | Front Door's cached copies, until the purge step completes. |
| The approved CV bytes, which the workflow hash-checks after deploy | Anything changed outside this repo (DNS, Front Door rules, Functions app). |

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

### Images

Served raster assets are generated by `scripts/optimize-images.mjs`. Untouched
full-resolution masters live in `media-originals/`, which sits outside the Astro
build and never reaches `dist/`. Prefer importing from `src/assets/` so Astro
hashes and converts the file; only put something in `public/` when it needs a
stable, directly fetchable URL (the social card, favicons, `robots.txt`).

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
