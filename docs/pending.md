# Pending Items

## ~~Apex domain redirect~~ ✓ Done
## ~~Favicon~~ ✓ Done — ARC logo at `public/favicon.jpg`
## ~~Custom 404 page~~ ✓ Done — `src/pages/404.astro`, Azure error document configured
## ~~Privacy policy~~ ✓ Done — `/privacy/` page, linked in footer
## ~~Testimonials section~~ ✓ Done — 3 placeholder cards on homepage, populate `quote`/`name`/`title` in `index.astro`

`antoniocumberbatch.com` → `https://www.antoniocumberbatch.com` redirect is live via Azure Front Door Rules Engine. Both DNS records (A record and `_dnsauth` TXT) are in Squarespace.

---

## Contact form email delivery

**Current state, verified 2026-11-03:** `/contact/` opens a pre-filled draft in
the visitor's own email app. It does not POST to `/api/contact`, and it does
not claim server delivery. Direct booking, WhatsApp and email remain available.
The personal Gmail on `/resume/` and ARC business address on `/contact/` are
intentional and must not be normalized.

A real sending path is a separate decision, not part of this frontend fix.
See [the scoped backend recommendation](contact-form-backend-proposal.md) for
Graph/ACS options, consent, validation, abuse controls and approval dependencies.
Never expose transactional email API keys in browser JavaScript. The historical
client-side API-key recommendation above this revision was unsafe and withdrawn.
No backend, resource, permission or send has been implemented.

---

## Google Web Stories

**Problem:** `/web-stories/` is a placeholder shell. No actual story content exists.

**How to create stories:**
1. Use the Google Web Stories plugin (available for WordPress) or the standalone Web Stories editor at https://creators.google/en-us/content-creation-tools/web-stories/
2. Export each story as a self-contained HTML file
3. Place HTML files in `public/stories/` (e.g. `public/stories/my-story/index.html`)
4. Update `/web-stories/` page to link to them
5. Submit the stories URL to Google Search Console for indexing

---

## OneSignal push notification verification

**Status:** SDK is loaded and `init()` is called, but not verified end-to-end.

**Steps to verify:**
1. Log in to https://app.onesignal.com
2. Confirm site `www.antoniocumberbatch.com` is added as a web push platform
3. Configure the opt-in prompt (slide-down or bell)
4. Test by sending a test notification from the dashboard to your own browser

---

## Sitemap — switch to auto-generation

**Problem:** `public/sitemap.xml` is maintained manually. Easy to forget to update when adding pages or blog posts.

**Fix:** Install `@astrojs/sitemap` integration. It reads all static routes at build time and generates the sitemap automatically.

```powershell
npm install @astrojs/sitemap
```

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.antoniocumberbatch.com',
  integrations: [sitemap()],
  ...
});
```

After adding: delete `public/sitemap.xml` (the integration outputs to `dist/sitemap-index.xml` and `dist/sitemap-0.xml`). The `<link rel="sitemap">` in `BaseLayout.astro` already points to `/sitemap-index.xml`.

---

## Performance (remaining PageSpeed items)

| Issue | Cause | Fix |
|-------|-------|-----|
| Unused JavaScript (~420 KB) | OneSignal SDK + n8n chat bundle on every page | Defer n8n init until after user interaction; not much else without removing features |
| Long main-thread tasks | Third-party script initialisation (OneSignal, n8n) | Load n8n chat lazily on first scroll or click |
| Minify JavaScript | Should be handled by Astro/Vite in production | Verify with `npx astro build` output sizes |

---

## Payoneer flow

**Current state:** The Payoneer tab shows an email input. When the user enters their email and clicks "Request Link", it opens a `mailto:` to `antonio.cumberbatch@arccloudconsulting.com` with the client's email and package details pre-filled.

**Limitation:** Relies on the visitor having a mail client. A proper fix would be to send the request via Brevo or another email API (same solution as the contact form).
