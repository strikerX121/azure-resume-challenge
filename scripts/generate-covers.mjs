// Generates every cover image on the site from the SVG motifs in
// scripts/covers/. See scripts/covers/art.mjs for the visual rules.
//
// Output, all committed and served from public/ so og:image keeps a stable,
// directly fetchable URL (scrapers do not run the Astro asset pipeline, and
// most social platforms will not render an SVG og:image):
//
//   public/images/blog/<slug>.jpg        1200 x 630  post hero + og:image
//   public/images/blog/<slug>-640.jpg     640 x 336  blog index cards (srcset)
//   public/images/covers/<page>.jpg      1200 x 630  page banner + og:image
//   public/images/covers/<page>-640.jpg   640 x 336  mobile banner (srcset)
//   public/images/covers/<page>-wide.jpg 1600 x 600  full-bleed case-study hero
//
// JPEG via mozjpeg with 4:4:4 chroma, because the art is flat colour with thin
// orange strokes and 4:2:0 subsampling smears exactly those edges.
//
// Deterministic: same input, same bytes. Re-run after editing a motif:
//   npm run generate:covers

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { frame, HUE, C } from './covers/art.mjs';
import * as M from './covers/motifs.mjs';

const BLOG = 'public/images/blog';
const COVERS = 'public/images/covers';
const funnelOnly = process.argv.includes('--funnel-only');
const checkOnly = process.argv.includes('--check');
const webpSlugs = new Set(['train-copilot-to-write-emails-that-sound-like-you', 'good-chefs-saute-evenly-copilot-prompt-framework']);

// Blog slug -> motif + topic hue. Every post gets a motif drawn from its own
// subject rather than its category, so two posts in one category still look
// different.
const blog = {
  '2019-visibility-strategy-2026-world': [M.radar, HUE.strategy],
  'always-sanity-check-copilot-powerpoint': [M.slidesCheck, HUE.ai],
  'automate-data-not-spreadsheets': [M.sheetToDb, HUE.ai],
  'azure-cost-management-api-for-developers': [M.cloudCost, HUE.cloud],
  'azure-front-door-dropped-our-server-load-from-95-to-35-percent': [M.edgeShield, HUE.cloud],
  'before-you-build-a-copilot-agent-for-your-company': [M.agentBlueprint, HUE.ai],
  'build-to-be-recommended-not-found': [M.answerBubble, HUE.strategy],
  'client-side-pagination-kills-app-performance': [M.pagination, HUE.engineering],
  'copilot-notebooks-give-it-one-place-to-look': [M.notebook, HUE.ai],
  'copilot-readiness-vs-adoption': [M.readinessAdoption, HUE.ai],
  'enterprise-ops-dashboard-replaced-six-tools': [M.sixToOne, HUE.cloud],
  'good-chefs-saute-evenly-copilot-prompt-framework': [M.chefPan, HUE.ai],
  'how-we-built-a-logistics-platform-on-azure': [M.logisticsRoute, HUE.cloud],
  'rbac-nextjs-cosmosdb-not-jwts': [M.rbac, HUE.engineering],
  'three-microsoft-365-problems-small-businesses-miss': [M.m365Gaps, HUE.m365],
  'train-copilot-to-write-emails-that-sound-like-you': [M.voiceEmail, HUE.ai],
  'vague-prompts-fail-quietly': [M.quietFail, HUE.ai],
  'what-actually-drives-copilot-adoption': [M.adoptionCrowd, HUE.ai],
};

// Page covers. `wide` pairs two motifs left and right of a quiet centre so a
// centred hero headline can sit on top of them.
const pages = {
  'esvd-dashboard': { motif: M.opsHub, hue: HUE.cloud, wide: [M.opsHub, M.sixToOne] },
  '3-stripes-tech': { motif: M.clinicalPulse, hue: HUE.health, wide: [M.clinicalPulse, M.edgeShield] },
  qualitech: { motif: M.sevenToOne, hue: HUE.ai, wide: [M.sevenToOne, M.workflowGraph] },
  sassi: { motif: M.logisticsRoute, hue: HUE.cloud },
  'wiman-dlp': { motif: M.identityDevices, hue: HUE.m365 },
  'jimny-shop': { motif: M.trailShop, hue: HUE.commerce },
  'arc-portfolio': { motif: M.portfolioCloud, hue: HUE.cloud },
  automations: { motif: M.workflowGraph, hue: HUE.ai },
};

const seedOf = (name) => [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

async function write(svg, out, width) {
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  const buffer = await img.jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  return saveOrCheck(buffer, out);
}

async function saveOrCheck(buffer, out) {
  if (checkOnly) {
    if (!buffer.equals(await fs.readFile(out))) throw new Error(`Stale generated cover: ${out}. Run npm run generate:covers.`);
  } else {
    await fs.writeFile(out, buffer);
  }
  return buffer.length;
}

async function writeWebp(svg, out, width) {
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  // Lossy WebP is inherently 4:2:0, unlike our 4:4:4 JPEGs. Explicitly use
  // high-quality chroma subsampling for thin coloured edges. Lossless RGB
  // measured 63-133 KB here, larger than the JPEGs, so is not a byte win.
  const buffer = await img.webp({ quality: 82, effort: 6, smartSubsample: true }).toBuffer();
  return saveOrCheck(buffer, out);
}

function wide(hue, [left, right], seed) {
  const W = 1600, H = 600;
  // Each motif is authored around (600, 315); place it at 0.5 scale either
  // side of a quiet band in the middle wide enough for a centred headline.
  const K = 0.5;
  const place = (fn, cx) => `<g transform="translate(${cx - 600 * K} ${300 - 315 * K}) scale(${K})">${fn(hue)}</g>`;
  const bridge = `<line x1="400" y1="300" x2="1200" y2="300" stroke="${hue}" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="4 10"/>`;
  return frame(W, H, hue, place(left, 230) + bridge + place(right, 1370), {
    seed,
    glows: [
      { x: 230, y: 280, r: 320, c: hue, o: 0.2 },
      { x: 1370, y: 320, r: 320, c: C.accent, o: 0.1 },
    ],
  });
}

await fs.mkdir(BLOG, { recursive: true });
await fs.mkdir(COVERS, { recursive: true });

const rows = [];
for (const [slug, [motif, hue]] of Object.entries(blog)) {
  if (funnelOnly && !webpSlugs.has(slug)) continue;
  const svg = frame(1200, 630, hue, motif(hue), { seed: seedOf(slug) });
  rows.push([`${BLOG}/${slug}.jpg`, await write(svg, `${BLOG}/${slug}.jpg`)]);
  rows.push([`${BLOG}/${slug}-640.jpg`, await write(svg, `${BLOG}/${slug}-640.jpg`, 640)]);
  if (webpSlugs.has(slug)) {
    rows.push([`${BLOG}/${slug}.webp`, await writeWebp(svg, `${BLOG}/${slug}.webp`)]);
    rows.push([`${BLOG}/${slug}-640.webp`, await writeWebp(svg, `${BLOG}/${slug}-640.webp`, 640)]);
  }
}
for (const [name, p] of Object.entries(funnelOnly ? {} : pages)) {
  const svg = frame(1200, 630, p.hue, p.motif(p.hue), { seed: seedOf(name) });
  rows.push([`${COVERS}/${name}.jpg`, await write(svg, `${COVERS}/${name}.jpg`)]);
  rows.push([`${COVERS}/${name}-640.jpg`, await write(svg, `${COVERS}/${name}-640.jpg`, 640)]);
  if (p.wide) {
    const w = wide(p.hue, p.wide, seedOf(name));
    rows.push([`${COVERS}/${name}-wide.jpg`, await write(w, `${COVERS}/${name}-wide.jpg`)]);
  }
}

let total = 0;
for (const [file, size] of rows) {
  total += size;
  console.log(`  ${(size / 1024).toFixed(1).padStart(6)} KB  ${path.normalize(file)}`);
}
console.log(`\n${rows.length} files ${checkOnly ? 'verified byte-exact' : 'generated'}, ${(total / 1024).toFixed(0)} KB total.`);
