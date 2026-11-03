// Two audited decorative covers only. Preserve JPEG originals and social URLs.
// Re-run: node scripts/optimize-funnel-covers.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';

for (const slug of ['train-copilot-to-write-emails-that-sound-like-you', 'good-chefs-saute-evenly-copilot-prompt-framework']) {
  for (const suffix of ['', '-640']) {
    const input = `public/images/blog/${slug}${suffix}.jpg`;
    const output = input.replace(/\.jpg$/, '.webp');
    await sharp(input).webp({ quality: 82, effort: 6 }).toFile(output);
    const before = (await fs.stat(input)).size;
    const after = (await fs.stat(output)).size;
    if (after >= before) throw new Error(`No byte improvement for ${input}`);
    const meta = await sharp(output).metadata();
    console.log(JSON.stringify({ input, output, before, after, width: meta.width, height: meta.height }));
  }
}
