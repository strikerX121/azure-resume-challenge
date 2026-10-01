import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

// Build a slug -> pubDate map from blog frontmatter so generated sitemap entries
// carry a real <lastmod> per post rather than one blanket build timestamp.
// Only `pubDate` is read, so this needs no YAML parser and no extra dependency.
const BLOG_DIR = path.resolve('./src/content/blog');

function readBlogLastmod() {
  const map = new Map();
  let files = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return map;
  }
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const match = raw.match(/^pubDate:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (match) map.set(file.replace(/\.md$/, ''), match[1]);
  }
  return map;
}

const blogLastmod = readBlogLastmod();

// Non-blog pages have no authored date in source, so they fall back to the build
// timestamp — still a truthful "last generated" signal, and lastmod is the field
// Google actually uses (changefreq/priority are deliberately dropped).
const buildLastmod = new Date().toISOString();

export default defineConfig({
  site: 'https://www.antoniocumberbatch.com',
  redirects: {
    '/blog/four-ingredients-of-a-good-copilot-prompt': '/blog/good-chefs-saute-evenly-copilot-prompt-framework',
  },
  integrations: [
    sitemap({
      // The redirect target is the canonical URL; keep the legacy redirect stub out.
      filter: (page) => !page.includes('/blog/four-ingredients-of-a-good-copilot-prompt'),
      serialize(item) {
        const blogMatch = item.url.match(/\/blog\/([^/]+)\/?$/);
        const slug = blogMatch?.[1];
        const authored = slug ? blogLastmod.get(slug) : undefined;
        return {
          url: item.url,
          lastmod: authored ? new Date(authored + 'T00:00:00.000Z').toISOString() : buildLastmod,
        };
      },
    }),
  ],
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'learn.microsoft.com' },
      { protocol: 'https', hostname: 'follow.it' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
