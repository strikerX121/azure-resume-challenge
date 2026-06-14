# ARC Cloud Consulting — Site Documentation

**Live site:** https://www.antoniocumberbatch.com  
**Owner:** Antonio Cumberbatch  
**Company:** ARC Cloud Consulting

---

## Quick Reference

| Topic | Doc |
|-------|-----|
| Project overview & tech stack | [architecture.md](architecture.md) |
| Local development | [development.md](development.md) |
| Build & deploy to Azure | [deployment.md](deployment.md) |
| Features & how they work | [features.md](features.md) |
| Third-party services | [integrations.md](integrations.md) |
| Outstanding items | [pending.md](pending.md) |

---

## Repo structure (what matters)

```
$web/
├── src/
│   ├── assets/images/     ← local images Astro optimises (WebP at build time)
│   ├── content/blog/      ← Markdown blog posts
│   ├── layouts/           ← BaseLayout.astro, BlogPost.astro
│   ├── pages/             ← one file = one route
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── services.astro
│   │   ├── shop.astro
│   │   ├── contact.astro
│   │   ├── resume.astro
│   │   ├── blog/
│   │   ├── work/
│   │   └── rss.xml.js
│   ├── components/        ← Nav.astro, Footer.astro
│   └── styles/global.css
├── public/                ← copied to dist/ as-is (no optimisation)
│   ├── images/            ← legacy/OG images (me.png also in src/assets for optimisation)
│   ├── resume.pdf
│   ├── sitemap.xml
│   └── robots.txt
├── api/                   ← Azure Functions (C# .NET) — visit counter
├── docs/                  ← this folder — never deployed
├── dist/                  ← build output — what gets uploaded to Azure
├── astro.config.mjs
└── CLAUDE.md              ← guidance for Claude Code AI assistant
```
