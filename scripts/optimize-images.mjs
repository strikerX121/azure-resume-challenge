// Image optimisation pass for the portfolio's served raster assets.
//
// Why this exists: several photographs were committed at original camera
// resolution (one 7040x9496 headshot rendered at 80x80 px) and shipped straight
// to the CDN. This script rebuilds each served asset at a size that matches its
// real render box, and copies every untouched original into `media-originals/`
// so a higher-resolution master is still available for later reuse. Nothing in
// `media-originals/` is part of the Astro build, so it never reaches `dist/`.
//
// Re-runnable: it reads from `media-originals/` when a master is already parked
// there, so running it twice does not re-compress an already-optimised file.
//
// Usage: node scripts/optimize-images.mjs

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ORIGINALS = 'media-originals';
const NAVY = { r: 15, g: 22, b: 36 };

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// Park the untouched original once, then always read from the parked copy so
// repeat runs stay lossless rather than re-encoding our own output.
async function master(servedPath, parkedName) {
  const parked = path.join(ORIGINALS, parkedName);
  if (!(await exists(parked))) {
    await fs.mkdir(ORIGINALS, { recursive: true });
    await fs.copyFile(servedPath, parked);
    console.log(`  parked original -> ${parked}`);
  }
  return parked;
}

async function report(label, file) {
  const { size } = await fs.stat(file);
  const meta = await sharp(file).metadata();
  console.log(`  ${label}: ${meta.width}x${meta.height} ${(size / 1024).toFixed(1)} KB -> ${file}`);
}

const jobs = [];

// 1. Rakib Hasan headshot. Rendered at 80x80 (and 48x48) only, so 240px covers
//    a 3x display. The served copy under public/ is replaced by an src/assets
//    source so Astro hashes and converts it like every other managed image.
jobs.push(async () => {
  const src = await master('public/images/Rakib Hasan.jpeg', 'Rakib Hasan.jpeg');
  const out = 'src/assets/images/rakib-hasan.jpg';
  await sharp(src)
    .resize(240, 240, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  await report('rakib headshot', out);
});

// 2. Antonio portrait. Hero renders it at 280x280 (560 at 2x) and it is the
//    source for the social card, so 900px square is ample.
jobs.push(async () => {
  const src = await master('src/assets/images/me.png', 'me.png');
  const out = 'src/assets/images/me.png';
  const buf = await sharp(src)
    .resize(900, 900, { fit: 'cover', position: 'top' })
    .png({ quality: 85, compressionLevel: 9, palette: true })
    .toBuffer();
  await fs.writeFile(out, buf);
  await report('portrait', out);
});

// 3. Social card. og:image needs a stable, directly fetchable URL because
//    scrapers do not run the Astro asset pipeline, so this one stays in
//    public/. 1200x630 is the standard card box; the square portrait is
//    composited onto a navy field rather than crop-zoomed into a letterbox.
jobs.push(async () => {
  const src = await master('src/assets/images/me.png', 'me.png');
  const portrait = await sharp(src)
    .resize(630, 630, { fit: 'cover', position: 'top' })
    .toBuffer();
  const out = 'public/images/og-antonio.jpg';
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: NAVY },
  })
    .composite([{ input: portrait, left: 285, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
  await report('social card', out);
});

// 4. Nicole Cumberbatch portrait. Rendered at 96x96, so 288px covers 3x.
jobs.push(async () => {
  const src = await master('src/assets/images/nicole-cumberbatch-sassi.jpg', 'nicole-cumberbatch-sassi.jpg');
  const out = 'src/assets/images/nicole-cumberbatch-sassi.jpg';
  const buf = await sharp(src)
    .resize(288, 288, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await fs.writeFile(out, buf);
  await report('nicole portrait', out);
});

// 5. SASSI team photo. Rendered at 900x500, so 1800x1000 covers 2x.
jobs.push(async () => {
  const src = await master('src/assets/images/sassi-team-photo.jpg', 'sassi-team-photo.jpg');
  const out = 'src/assets/images/sassi-team-photo.jpg';
  const buf = await sharp(src)
    .resize(1800, 1000, { fit: 'cover' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  await fs.writeFile(out, buf);
  await report('sassi team photo', out);
});

// 6. ARC logo, both the managed src/assets copy and the public/ copy that work
//    cards reference by URL. Rendered no larger than 64px tall.
jobs.push(async () => {
  const src = await master('src/assets/images/arc-logo.jpg', 'arc-logo.jpg');
  for (const out of ['src/assets/images/arc-logo.jpg', 'public/images/ARC Logo.jpg']) {
    const buf = await sharp(src)
      .resize({ width: 512 })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    await fs.writeFile(out, buf);
    await report('arc logo', out);
  }
});

// 7. Favicon. The old favicon.jpg was the full 2560x983 logo, which is both the
//    wrong aspect ratio for an icon and far too large to ship on every page.
//    Emit real square PNG icons instead, letterboxed onto the site navy so the
//    wordmark is not cropped.
jobs.push(async () => {
  const src = await master('public/favicon.jpg', 'favicon-source.jpg');
  for (const [out, size] of [['public/favicon.png', 48], ['public/apple-touch-icon.png', 180]]) {
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: NAVY })
      .png({ compressionLevel: 9 })
      .toFile(out);
    await report(`icon ${size}px`, out);
  }
});

// 8. SASSI logo SVG. It is a vector wrapper around one base64 raster at full
//    resolution, which is why a "logo" weighs 154 KB. Re-embed the same artwork
//    downscaled to 256px so the path and every reference stay unchanged.
jobs.push(async () => {
  const servedPath = 'public/images/logos/sassi-logo.svg';
  const src = await master(servedPath, 'sassi-logo.svg');
  const svg = await fs.readFile(src, 'utf8');
  const m = svg.match(/data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)/);
  if (!m) { console.log('  sassi logo: no embedded raster found, left untouched'); return; }
  const shrunk = await sharp(Buffer.from(m[2], 'base64'))
    .resize({ width: 256, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const rebuilt = svg.replace(m[0], `data:image/png;base64,${shrunk.toString('base64')}`);
  await fs.writeFile(servedPath, rebuilt);
  const { size } = await fs.stat(servedPath);
  console.log(`  sassi logo: ${(size / 1024).toFixed(1)} KB -> ${servedPath}`);
});

// 9. Drop the duplicated public/ copies of images that are already managed
//    through src/assets. They were shipped to the CDN while no page referenced
//    them, so they cost deploy time and storage for nothing. Masters are parked
//    in media-originals/ first.
jobs.push(async () => {
  for (const [served, parked] of [
    ['public/images/me.png', 'me-public.png'],
    ['public/images/nicole-cumberbatch-sassi.jpg', 'nicole-cumberbatch-sassi-public.jpg'],
    ['public/images/sassi-team-photo.jpg', 'sassi-team-photo-public.jpg'],
    ['public/images/Rakib Hasan.jpeg', 'Rakib Hasan.jpeg'],
    ['public/favicon.jpg', 'favicon-source.jpg'],
  ]) {
    if (!(await exists(served))) continue;
    await master(served, parked);
    await fs.rm(served);
    console.log(`  removed from deployed output -> ${served}`);
  }
});

for (const job of jobs) await job();
console.log('\nDone.');
