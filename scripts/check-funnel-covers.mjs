// Keep the two audited picture sources, JPEG fallbacks and social cards aligned.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const rows = [];
for (const slug of ['train-copilot-to-write-emails-that-sound-like-you', 'good-chefs-saute-evenly-copilot-prompt-framework']) {
  const html = await fs.readFile(`dist/blog/${slug}/index.html`, 'utf8');
  const picture = html.match(/<picture\b[^>]*>[\s\S]*?<\/picture>/)?.[0];
  assert.ok(picture, `${slug}: picture missing`);
  assert.ok(picture.includes(`srcset="/images/blog/${slug}-640.webp 640w, /images/blog/${slug}.webp 1200w"`));
  assert.match(picture, /type="image\/webp"/);
  assert.match(picture, /sizes="100vw"/);
  assert.ok(picture.includes(`src="/images/blog/${slug}.jpg"`));
  assert.ok(picture.includes(`srcset="/images/blog/${slug}-640.jpg 640w, /images/blog/${slug}.jpg 1200w"`));
  for (const attribute of ['alt=""', 'width="1200"', 'height="630"', 'loading="eager"', 'fetchpriority="high"']) assert.ok(picture.includes(attribute));
  assert.match(html, new RegExp(`<meta property="og:image" content="[^"]*/images/blog/${slug}\\.jpg"`));
  const preloads = html.match(/<link[^>]*rel="preload"[^>]*>/g) || [];
  assert.ok(preloads.every(tag => !tag.includes(slug)), `${slug}: conflicting cover preload`);
  for (const [suffix, width, height] of [['', 1200, 630], ['-640', 640, 336]]) {
    const jpg = `public/images/blog/${slug}${suffix}.jpg`;
    const webp = jpg.replace(/\.jpg$/, '.webp');
    const jpgBytes = await fs.readFile(jpg), webpBytes = await fs.readFile(webp);
    assert.ok(webpBytes.length < jpgBytes.length, 'WebP must remain smaller');
    for (const [file, bytes] of [[jpg, jpgBytes], [webp, webpBytes]]) {
      const meta = await sharp(bytes).metadata();
      assert.equal(meta.width, width);
      assert.equal(meta.height, height);
      assert.ok(bytes.equals(await fs.readFile(file.replace('public/', 'dist/'))), `${file}: build copy mismatch`);
    }
    rows.push({ slug, width, height, jpegBytes: jpgBytes.length, webpBytes: webpBytes.length, reductionPercent: Number(((1 - webpBytes.length / jpgBytes.length) * 100).toFixed(1)) });
  }
}
console.log(JSON.stringify({ result: 'PASS', picturePages: 2, variants: rows }, null, 2));
