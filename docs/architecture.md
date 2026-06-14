# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro v4 (`output: 'static'`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Hosting | Azure Blob Storage (`$web` container) |
| CDN | Azure Front Door (`azureresumearc` profile, endpoint `azureresumearc`) |
| Backend | Azure Functions — C# .NET in-process v2 (visit counter only) |
| Database | Azure Cosmos DB — `AzureResume` database, `Counter` container |
| Domain | `www.antoniocumberbatch.com` and `antoniocumberbatch.com` — both routed through Azure Front Door |

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0F1624` | Page background |
| `--color-surface` | `#1C2840` | Cards, nav, footer |
| `--color-navy` | `#1A2B5E` | Nav bar, footer |
| `--color-accent` | `#FF6B2B` | Buttons, links, highlights |
| `--color-accent-hover` | `#e55a1f` | Hover state for accent |
| `--color-border` | `rgba(255,255,255,0.08)` | Dividers, card borders |
| `--color-text` | `#F0F4FF` | Primary text |
| `--color-text-muted` | `rgba(240,244,255,0.55)` | Secondary/helper text |
| `--font-display` | Inter | Headings, logo |
| `--font-mono` | JetBrains Mono | Code, tags |

Fonts loaded async from Google Fonts (non-render-blocking).

## How Astro builds the site

- Pages in `src/pages/` become static HTML files in `dist/`
- Images imported in `src/assets/` are converted to WebP and resized at build time
- Images in `public/` are copied to `dist/` as-is (no optimisation)
- Blog posts in `src/content/blog/` are Markdown files consumed by `getCollection('blog')`
- CSS and JS are bundled, hashed, and output to `dist/_astro/` (content-addressed, cache-safe)
- `src/pages/rss.xml.js` generates the RSS feed at build time

## Azure infrastructure

```
Browser
  ├── antoniocumberbatch.com → Azure Front Door → 301 redirect → https://www.antoniocumberbatch.com
  └── www.antoniocumberbatch.com → Azure Front Door (CDN + WAF) → Azure Blob Storage $web (static site)
                                                                 └── /api/* → Azure Functions (visit counter)
```

Azure Front Door provides:
- Global CDN caching
- HTTPS termination
- WAF (Web Application Firewall)
- Custom domain routing
- Apex → www redirect via Rules Engine rule set `ApexRedirect`

### Custom domains in Front Door

| Domain | Status | Role |
|--------|--------|------|
| `www.antoniocumberbatch.com` | Approved | Primary — serves the site |
| `antoniocumberbatch.com` | Approved | Apex — 301 redirects to www |

### DNS records (managed in Squarespace / Google Cloud DNS)

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `www` | CNAME | `azureresumearc.azureedge.net` | Routes www to Front Door |
| `@` | A | `150.171.109.114` | Routes apex to Front Door |
| `_dnsauth` | TXT | `_evkn7gnpai66z3ntdd96p6a7y2bzl55` | Front Door domain validation (apex) |

### Front Door rule set: ApexRedirect

Rule `RedirectApexToWww` (order 1):
- **Condition:** Request header `Host` equals `antoniocumberbatch.com`
- **Action:** URL Redirect — 301 Moved, protocol HTTPS, hostname `www.antoniocumberbatch.com`
- Attached to route `azureresumearc`

## Cache strategy (set at upload time)

| Path | Cache-Control | Reason |
|------|--------------|--------|
| `_astro/*` | `public, max-age=31536000, immutable` | Content-hashed — safe to cache forever |
| `images/*` | `public, max-age=604800` | Public images — 7-day cache |
| Everything else (HTML, XML, PDF) | `no-cache, must-revalidate` | Always serve fresh |
