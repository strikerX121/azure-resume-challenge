# Local Development

## Prerequisites

- Node.js 18+
- Azure Functions Core Tools (for backend only)
- Azure CLI (for deployment)

## Frontend (Astro)

```powershell
# Install dependencies (first time only)
cd "$web"
npm install

# Start dev server
npx astro dev
# → http://localhost:4321
```

The dev server hot-reloads on file changes. Image optimisation runs at build time, not during dev, so images served locally are unoptimised originals — this is expected.

## Backend (Azure Functions — visit counter)

Create `api/local.settings.json` (gitignored):

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

```powershell
cd api
func start
# → http://localhost:7071/api/GetResumeCounter
```

To point the frontend at the local function, edit `main.js` and swap the URL constant to `localfunctionApi`.

## Blog posts

Add a new `.md` file to `src/content/blog/`:

```markdown
---
title: "Post Title"
description: "One-sentence summary for SEO and RSS."
pubDate: 2026-06-10
category: "Cloud & Azure"
tags: ["azure", "tag2"]
draft: false
---

Post content here...
```

Set `draft: true` to exclude from build. The slug is derived from the filename.

After adding a post, also add its URL to `public/sitemap.xml` manually.
