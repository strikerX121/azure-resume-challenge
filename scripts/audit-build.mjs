// Build-output audit: internal links, image references and SEO artefacts.
//
// Checks the rendered dist/ tree rather than source, because that is what the
// CDN actually serves. Verifies:
//   - every internal href resolves to a real file in dist/
//   - every internal img/src and og:image resolves
//   - every <img> declares width/height and a loading attribute
//   - canonical on each page matches the sitemap entry for that URL
//   - robots.txt, sitemap, rss.xml and llms.txt exist and are non-empty
//
// Usage: node scripts/audit-build.mjs

import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.antoniocumberbatch.com';

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(DIST);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

// Build a set of every servable path, including directory-index forms.
const servable = new Set();
for (const f of allFiles) {
  const rel = '/' + path.relative(DIST, f).split(path.sep).join('/');
  servable.add(rel);
  if (rel.endsWith('/index.html')) {
    const dirPath = rel.slice(0, -'index.html'.length); // keeps trailing slash
    servable.add(dirPath);
    servable.add(dirPath.replace(/\/$/, '')); // extensionless form
  }
}

const problems = [];
const stats = {
  htmlPages: htmlFiles.length,
  internalLinks: 0,
  imageRefs: 0,
  imgTags: 0,
  missingDims: 0,
  missingLoading: 0,
};

function decodePath(p) {
  try { return decodeURIComponent(p); } catch { return p; }
}

function resolves(rawPath) {
  const clean = rawPath.split('#')[0].split('?')[0];
  if (!clean) return true;
  const candidates = new Set([clean, decodePath(clean), encodeURI(decodePath(clean))]);
  for (const c of candidates) {
    if (servable.has(c)) return true;
    if (servable.has(c.replace(/\/$/, ''))) return true;
    if (servable.has(c + '/')) return true;
    if (servable.has(c.replace(/\/$/, '') + '/index.html')) return true;
  }
  return false;
}

// --- sitemap -------------------------------------------------------------
const sitemapPath = path.join(DIST, 'sitemap-0.xml');
const sitemapUrls = new Set();
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(m[1]);
} else {
  problems.push('sitemap-0.xml missing from dist/');
}

// --- per-page checks -----------------------------------------------------
for (const file of htmlFiles) {
  const rel = '/' + path.relative(DIST, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const isRedirectStub = /<meta http-equiv="refresh"/i.test(html);

  for (const m of html.matchAll(/<a\b[^>]*?href="([^"]+)"/gi)) {
    const href = m[1];
    if (!href.startsWith('/')) continue;
    stats.internalLinks++;
    if (!resolves(href)) problems.push(`${rel}: broken internal link -> ${href}`);
  }

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    stats.imgTags++;
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    if (src && src.startsWith('/')) {
      stats.imageRefs++;
      if (!resolves(src)) problems.push(`${rel}: broken image -> ${src}`);
    }
    const hasW = /\bwidth="/i.test(tag);
    const hasH = /\bheight="/i.test(tag);
    if (!hasW || !hasH) { stats.missingDims++; problems.push(`${rel}: <img> without width/height -> ${(src || tag).slice(0, 90)}`); }
    if (!/\bloading="/i.test(tag)) { stats.missingLoading++; problems.push(`${rel}: <img> without loading attr -> ${(src || tag).slice(0, 90)}`); }
    if (!/\balt="/i.test(tag)) problems.push(`${rel}: <img> without alt -> ${(src || tag).slice(0, 90)}`);
  }

  const og = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  if (og) {
    const ogPath = og.startsWith(SITE) ? og.slice(SITE.length) : og;
    if (ogPath.startsWith('/') && !resolves(ogPath)) problems.push(`${rel}: og:image does not resolve -> ${og}`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!canonical) {
    problems.push(`${rel}: no canonical`);
  } else if (!isRedirectStub && sitemapUrls.size) {
    const pageUrl = SITE + (rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel);
    if (sitemapUrls.has(pageUrl) && canonical !== pageUrl) {
      problems.push(`${rel}: canonical ${canonical} does not match sitemap entry ${pageUrl}`);
    }
  }
}

// --- SEO artefacts -------------------------------------------------------
for (const artefact of ['robots.txt', 'sitemap-index.xml', 'sitemap-0.xml', 'rss.xml', 'llms.txt', '404.html']) {
  const p = path.join(DIST, artefact);
  if (!fs.existsSync(p)) problems.push(`missing artefact: ${artefact}`);
  else if (fs.statSync(p).size === 0) problems.push(`empty artefact: ${artefact}`);
}

// Every sitemap URL must correspond to a real page.
for (const url of sitemapUrls) {
  const p = url.startsWith(SITE) ? url.slice(SITE.length) : url;
  if (!resolves(p)) problems.push(`sitemap lists a URL with no page: ${url}`);
}

// --- JSON-LD parse check -------------------------------------------------
let ldBlocks = 0;
let ldInvalid = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    ldBlocks++;
    try { JSON.parse(m[1]); } catch (e) {
      ldInvalid++;
      problems.push(`${path.relative(DIST, file)}: invalid JSON-LD (${e.message.slice(0, 60)})`);
    }
  }
}

console.log(`pages:            ${stats.htmlPages}`);
console.log(`internal links:   ${stats.internalLinks}`);
console.log(`<img> tags:       ${stats.imgTags} (${stats.imageRefs} internal srcs)`);
console.log(`missing w/h:      ${stats.missingDims}`);
console.log(`missing loading:  ${stats.missingLoading}`);
console.log(`sitemap URLs:     ${sitemapUrls.size}`);
console.log(`JSON-LD blocks:   ${ldBlocks} (${ldInvalid} invalid)`);

if (problems.length) {
  console.error(`\nFAIL: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('\nPASS: no broken links, images, canonicals or SEO artefacts.');
