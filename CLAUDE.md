# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A two-tier cloud resume: a static frontend served from **Azure Blob Storage** (`$web` container) and a serverless backend in `api/` (Azure Functions, C# .NET, in-process v2 binding model). There is no build step, no package manager, and no bundler — files are deployed as-is.

## Deployment

**Frontend** — upload the contents of `$web/` directly to the Azure Blob Storage `$web` container:
```bash
az storage blob upload-batch --account-name <storage-account> -s . -d '$web'
```

**Backend** — deploy `api/` as an Azure Functions app:
```bash
func azure functionapp publish <function-app-name>
```

**Local backend dev** — requires Azure Functions Core Tools and a `api/local.settings.json` (gitignored) containing:
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
Run locally: `cd api && func start`

The frontend's `main.js` also has a `localfunctionApi` constant pointing to `http://localhost:7071/api/GetResumeCounter` for local testing — swap which URL `getVisitCount()` uses.

## Architecture

### Frontend (`$web/`)

**CSS loading order matters** — always load in this sequence:
1. `css/default.css` — Ceevee template reset, font imports, grid
2. `css/layout.css` — template section layouts and base heights
3. `css/media-queries.css` — template responsive rules
4. `css/magnific-popup.css` — modal plugin styles
5. `css/custom.css` — ARC brand overrides (must be last to win specificity)

**JS loading order matters** — `js/custom.js` is loaded in `<head>` (runs before DOM); jQuery and all other scripts load at the bottom of `<body>`:
- `js/custom.js` — vanilla JS only (dark mode, typewriter, IntersectionObserver, counter animation). Exposes `window.toggleTheme` and `window.animateCounter` on the global scope.
- `main.js` — fetches the visit counter from the Azure Function; calls `window.animateCounter()` once the API responds.
- `js/init.js` — jQuery-dependent: FitText on `.responsive-headline`, smooth scrolling, Waypoints-based nav highlighting, and a resize handler.

**Known conflict**: `js/init.js` sets `$('header').css({'height': $(window).height()})` on load and on resize. This overrides `height: 580px` set in `custom.css`, making the hero full-viewport-height in practice. The CSS value acts only as a fallback before jQuery loads.

**Known overlap**: both `js/init.js` (Waypoints, targets `section` only) and `js/custom.js` (IntersectionObserver, targets `header`, `section`, `div#portfolio`, `div#team`) manage the `.current` class on nav items. If both fire, the last one wins — functionally fine but worth knowing if debugging nav highlighting.

### Portfolio detail pages (`portfolio/`)

Pages in this subdirectory use `../` relative paths for all assets. They load only `css/default.css`, `css/custom.css`, and `css/portfolio-detail.css` — no jQuery, no `init.js`. Dark mode and the back button are the only interactive elements.

### Backend (`api/`)

Two files:
- `Counter.cs` — POCO model with `id` (string) and `count` (int), JSON-serialised.
- `GetResumeCounter.cs` — HTTP GET function. Uses Cosmos DB input binding to read document `id="1"` and an output binding to write back the incremented count. Returns the pre-increment value (reads `Counter`, increments `updatedCounter`, serialises and returns the original `Counter`).

The Cosmos DB database is `AzureResume`, container is `Counter`, single document with `id = "1"` and `partitionKey = "1"`.

## Dark mode

Implemented entirely via a `data-theme` attribute on `<html>`. `custom.js` reads from `localStorage` key `arc-theme` on every page load (including portfolio detail pages) and sets the attribute before the DOM renders to avoid flash. All colour values in `custom.css` are CSS custom properties under `:root` (light) and `[data-theme="dark"]` (dark).

## Key design constraints

- **No frameworks, no npm** — everything must work as a static file upload.
- **CSS specificity**: `custom.css` overrides template styles using `!important` only where the template's own specificity is too high to beat cleanly. Prefer higher-specificity selectors over `!important` for new overrides.
- **`::before` on `header`** is reserved by the Ceevee template for its vertical-centering trick (inline-block + `vertical-align: middle`). Use `::after` for any decorative overlays on the header.
- **Font Awesome 4.x** is loaded locally via `css/font-awesome/css/font-awesome.min.css` (imported through `css/default.css`). Use `fa fa-*` class syntax, not FA 5/6 syntax.
- **Fontello icon font** (loaded via `css/fontello/css/fontello.css`) provides `icon-down-circle` and `icon-up-open` used in the hero scroll arrow and back-to-top button.
