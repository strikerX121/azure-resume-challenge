// Builds the self-hosted employer logos shown on /resume.
//
// Why this exists: /resume used to hotlink https://logo.clearbit.com/{domain}.
// Clearbit's free Logo API was shut down after the HubSpot acquisition and the
// hostname no longer resolves, so every employer logo silently disappeared
// (the <img> onerror handler hid them). The logos are now committed to the repo
// and served from our own origin, so there is no third-party runtime dependency.
//
// Masters live in media-originals/employer-logos/ (never part of the build) and
// were taken from each company's own website:
//   arccloudconsulting-site-icon.jpg  arccloudconsulting.com site icon (WordPress cropped logo)
//   3stripestech-icon.png             www.3stripestech.com/icon.png
//   apeiron-wordmark.png              www.apeironsumus.com header wordmark; the "on"
//                                     ligature is cropped out, which is the same mark
//                                     the site uses as its own favicon
//   digicel-header-logo.svg           www.digicelgroup.com header SVG; the viewBox is
//                                     narrowed to the smiley-D symbol
//   pbs-wordmark.webp                 www.pbs.group header logo; the blue "pbs" tile is
//                                     cropped out (the site icon shrinks it inside a
//                                     circle, which is illegible at 30px)
//
// The /resume logo box renders each image at 30x30 CSS px, so every output is a
// 96x96 transparent PNG (3x density), trimmed to the artwork and letterboxed.
//
// Re-runnable: always reads from the masters. Usage: node scripts/build-employer-logos.mjs

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = 'media-originals/employer-logos';
const OUT = 'public/images/logos/employers';
const SIZE = 96;
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const logos = [
  { out: 'arc-cloud-consulting.png', input: async () => sharp(path.join(SRC, 'arccloudconsulting-site-icon.jpg')) },
  { out: '3-stripes-technologies.png', input: async () => sharp(path.join(SRC, '3stripestech-icon.png')) },
  {
    out: 'apeiron-sumus.png',
    // Ligature bounds measured from the alpha channel of the 2538x672 master.
    input: async () => sharp(path.join(SRC, 'apeiron-wordmark.png')).extract({ left: 1685, top: 57, width: 719, height: 378 }),
  },
  {
    out: 'digicel.png',
    input: async () => {
      const svg = (await fs.readFile(path.join(SRC, 'digicel-header-logo.svg'), 'utf8'))
        .replace('width="139" height="32" viewBox="0 0 139 32"', 'width="27" height="32" viewBox="0 0 27 32"');
      return sharp(Buffer.from(svg), { density: 1200 });
    },
  },
  {
    out: 'pbs-technologies.png',
    // Tile bounds measured from the alpha channel of the 627x173 master.
    input: async () => sharp(path.join(SRC, 'pbs-wordmark.webp')).extract({ left: 0, top: 15, width: 130, height: 143 }),
  },
];

await fs.mkdir(OUT, { recursive: true });
for (const logo of logos) {
  const trimmed = await (await logo.input()).png().toBuffer();
  const buf = await sharp(trimmed)
    .trim({ threshold: 10 })
    .resize(SIZE, SIZE, { fit: 'contain', background: CLEAR })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  const file = path.join(OUT, logo.out);
  await fs.writeFile(file, buf);
  console.log(`  ${logo.out}: ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log('\nDone.');
