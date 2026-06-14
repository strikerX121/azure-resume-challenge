# Changelog — ARC Cloud Resume

## Session: April 19, 2026

### New Files Created

| File | Description |
|------|-------------|
| `css/custom.css` | Full custom stylesheet — ARC brand, dark/light theme, all new section styles |
| `js/custom.js` | Custom JS — dark mode toggle, typewriter effect, scroll-reveal animations, stats counter |
| `css/portfolio-detail.css` | Layout and styles for portfolio detail pages |
| `portfolio/wiman-dlp.html` | Wiman DLP project detail page |
| `portfolio/qualitech-ai.html` | Qualitech AI Automation detail page |
| `portfolio/qualitech-web.html` | Qualitech Web Presence detail page |
| `portfolio/jimney-shop.html` | Jimney Shop Cloud Infrastructure detail page |
| `portfolio/emr-web-app.html` | EMR Web Application detail page (coming soon) |
| `portfolio/logistics-platform.html` | Logistics Platform detail page (coming soon) |

---

### Modified Files

#### `index.html` — Full rewrite
- Updated page `<title>` to "Antonio Cumberbatch | Azure Cloud Resume"
- Added `data-theme="light"` to `<html>` for dark mode support
- Added `css/custom.css` and `js/custom.js` to head
- **Navigation**: Added Portfolio and Team nav items; added dark mode toggle button
- **Hero**: Added typewriter subtitle (`#typewriter-text` + cursor); counter now animates on load
- **About section**: Updated bio copy — added ARC Cloud Consulting mention; fixed link text
- **Stats bar** (new): 4 animated counters — 11+ Years Experience, 8 Certifications, 6+ Projects, 20+ Clients
- **Skills section** (new): 22 skill tags with hover highlight — Azure, M365, AI Automation, DLP, etc.
- **Certifications section**: Replaced plain text list with responsive badge grid (8 cards); added official Microsoft Learn badge images with `onerror` fallback; exam codes shown as labels
- **Work Experience**: Converted to animated timeline layout; fixed two content bugs:
  - Apeiron Sumus date corrected from placeholder "Date" → "March 2024 – Present"
  - Digicel Group entry had a raw code-block artifact mid-bullet — removed and replaced with clean content
- **Portfolio section** (new): 6 project cards — Wiman DLP, Qualitech AI, Qualitech Web, Jimney Shop, EMR (placeholder), Logistics (placeholder); all cards are `<a>` elements linking to detail pages
- **Team section** (new): 4 team member cards — Antonio Cumberbatch (Founder) + 3 placeholder roles with skill badges
- **Footer**: Updated copyright, cleaned social links

#### `main.js` — Updated
- Removed `let count = 30` default fallback
- Counter now calls `window.animateCounter()` (defined in `custom.js`) to animate from near-final value to actual count, instead of setting it instantly

#### `css/custom.css` — Two visual iterations this session

**Iteration 1 (initial):** ARC orange + navy theme, heavy gradients, dark stats bar, glowing cert cards, full-gradient portfolio thumbnails

**Iteration 2 (final — clean professional):** Redesigned toward clean SaaS dashboard aesthetic (Sneat-inspired):
- Font changed from Poppins → Inter
- All section backgrounds: white (`#FFFFFF`) and near-white (`#F7F8FC`) — no dark section fills except hero and nav
- Stats bar: light gray strip with thin borders, numbers in dark text, `+` suffix in orange
- Cert cards: white, `1px` border, very light shadow, subtle lift on hover — no glow
- Portfolio card thumbnails: light gray background, emoji icon, 3px category-color top accent strip
- Timeline: single `1px` vertical line, small hollow dots
- Shadows reduced to `0 1px 3px rgba(0,0,0,0.06)` base, `0 8px 24px rgba(0,0,0,0.10)` hover
- Orange used sparingly: active nav underline indicator, timeline dots, date badges, stat suffixes, hover states only

**Bug fixes applied to `css/custom.css`:**
- Fixed `header::before` override — template uses `::before` for vertical centering (inline-block trick); original code replaced it with `position:absolute`, breaking centering and pushing content behind fixed nav. Fixed by moving the decorative radial overlay to `::after`
- Reduced hero height from template's `800px` → `580px` to eliminate excessive gap between hero content and About section

---

### Feature Summary

| Feature | Implementation |
|---------|---------------|
| Dark / Light mode | CSS variables on `[data-theme]`, toggled via `localStorage`, button in nav |
| Typewriter headline | Vanilla JS cycling 5 titles, 90ms type / 50ms delete speed |
| Scroll-reveal animations | `IntersectionObserver` on `.reveal` / `.reveal-left` elements |
| Animated stats counters | `IntersectionObserver` + `requestAnimationFrame` easing, fires once on scroll into view |
| Animated page view counter | Counts up from near-final to actual API value on load |
| Cert badge images | Official Microsoft Learn SVGs by certification level (Expert, Specialty, Associate, Fundamentals) |
| Portfolio detail pages | 6 standalone HTML pages with shared nav, hero, sections, dark mode, back button |
| Active nav on scroll | `scroll` listener updates `.current` class based on section in viewport |

---

### Pending / To Update Later

- Team member cards: 3 placeholder cards awaiting real names, roles, and skill sets
- EMR project: placeholder page — full case study to be added when project completes
- Logistics project: placeholder page — full case study to be added when project completes
- Portfolio card images: currently emoji placeholders — replace with real project screenshots when available
