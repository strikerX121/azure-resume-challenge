// Upload-policy coverage test. No Azure write, no network.
//
// Why this exists: the deploy workflow's upload selection was wrong in a way
// that source review kept missing. `az storage blob upload-batch --pattern` is
// Python fnmatch applied to the FULL joined path (`<source>/<pattern>`), and
// fnmatch's `*` matches `/` as well as any other character. Two consequences:
//
//   - `**/*.html` becomes `dist/**/*.html`, which needs a literal `/` after
//     `dist/`, so it never matched `dist/index.html` or `dist/404.html`.
//   - `*.svg` / `*.webp` / `*.js` DO reach inside `_astro/`, so a later pass
//     silently overwrote the immutable header an earlier pass had set.
//
// So this test does not check that the YAML "looks right". It replicates the
// matcher, parses the real passes out of .github/workflows/deploy.yml, and
// computes the Cache-Control every file would actually end up with. If someone
// edits the workflow, this test follows them rather than going stale.
//
// Usage: node scripts/check-upload-policy.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WORKFLOW = '.github/workflows/deploy.yml';
const DIST = 'dist';

// The approved CV artifact. These bytes are supplied and signed off; the build
// must never regenerate or re-compress them.
const APPROVED_CV_SHA256 =
  'a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4';
const CV_FILES = ['Antonio-Cumberbatch-CV-2026.pdf', 'resume.pdf'];

const problems = [];
const notes = [];

/* ---------------------------------------------------------------- matcher */

// Port of Python's fnmatch.translate (the POSIX / fnmatchcase branch, which is
// what runs on the ubuntu-latest runner). Critically, `*` -> `.*`, which
// crosses directory separators.
function fnmatchToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      out += '.*';
    } else if (c === '?') {
      out += '.';
    } else if (c === '[') {
      let j = i + 1;
      if (j < pattern.length && (pattern[j] === '!' || pattern[j] === '^')) j++;
      if (j < pattern.length && pattern[j] === ']') j++;
      while (j < pattern.length && pattern[j] !== ']') j++;
      if (j >= pattern.length) {
        out += '\\[';
      } else {
        let stuff = pattern.slice(i + 1, j).replace(/\\/g, '\\\\');
        if (stuff.startsWith('!')) stuff = '^' + stuff.slice(1);
        out += '[' + stuff + ']';
        i = j;
      }
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^(?:' + out + ')$', 's');
}

// az joins source dir and pattern, then matches the full path.
function matches(relPath, pattern, sourceDir = DIST) {
  const full = `${sourceDir}/${relPath}`;
  const joined = `${sourceDir}/${pattern}`;
  return fnmatchToRegExp(joined).test(full);
}

/* --------------------------------------------------------- workflow parse */

function parseWorkflow(text) {
  // env: resolve the cache-policy variables.
  const env = {};
  for (const m of text.matchAll(/^\s{6}([A-Z_]+):\s*'([^']*)'\s*$/gm)) {
    env[m[1]] = m[2];
  }

  // Split into steps on "- name:" at step indentation.
  const parts = text.split(/\n(?=      - name:)/);
  const passes = [];
  for (const rawBlock of parts) {
    // Comments explain the patterns, so they must not be mistaken for them.
    const block = rawBlock
      .split('\n')
      .filter((l) => !/^\s*#/.test(l))
      .join('\n');
    if (!/az storage blob upload-batch/.test(block)) continue;

    const name = (block.match(/- name:\s*'?([^'\n]+?)'?\s*$/m) || [, '(unnamed)'])[1];

    const ccRaw = (block.match(/--content-cache-control\s+"([^"]+)"/) || [])[1];
    if (!ccRaw) {
      problems.push(`workflow step "${name}" uploads with no --content-cache-control`);
      continue;
    }
    const cache = ccRaw.startsWith('$') ? env[ccRaw.slice(1)] : ccRaw;
    if (!cache) {
      problems.push(`workflow step "${name}" references unknown cache var ${ccRaw}`);
      continue;
    }

    const overwrite = /--overwrite\s+false/.test(block) ? false : true;

    // Patterns: either a `for pattern in "a" "b"; do` loop, or a single
    // --pattern, or neither (meaning every file under the source dir).
    let patterns = null;
    const loop = block.match(/for\s+pattern\s+in\s+([^\n;]+);/);
    if (loop) {
      patterns = [...loop[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    } else {
      const single = block.match(/--pattern\s+"([^"]+)"/);
      if (single) patterns = [single[1]];
    }

    passes.push({ name, patterns, cache, overwrite });
  }
  return passes;
}

/* ------------------------------------------------------------- evaluation */

// Returns the Cache-Control a file ends up with, honouring pass order and
// --overwrite semantics. `existsRemotely` models a real redeploy, where the
// blob is already present from a previous run.
function effectivePolicy(relPath, passes, existsRemotely = true) {
  let current = null;
  const applied = [];
  for (const p of passes) {
    const hit = p.patterns === null || p.patterns.some((pat) => matches(relPath, pat));
    if (!hit) continue;
    // --overwrite false cannot change an existing blob, so on a redeploy it is
    // a no-op: the stale content and its old header both survive.
    if (!p.overwrite && existsRemotely) {
      applied.push(`${p.name} (SKIPPED: overwrite false, blob exists)`);
      continue;
    }
    current = p.cache;
    applied.push(p.name);
  }
  return { cache: current, applied };
}

function classify(rel) {
  if (rel.startsWith('_astro/')) return 'hashed';
  const ext = path.extname(rel).toLowerCase();
  if (ext === '.html') return 'html';
  if (ext === '.pdf') return 'pdf';
  if (['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.svg'].includes(ext)) return 'image';
  if (['.txt', '.xml', '.json', '.webmanifest'].includes(ext)) return 'crawler';
  return 'other';
}

const EXPECT = {
  html: (cc) => /must-revalidate/.test(cc),
  pdf: (cc) => /must-revalidate/.test(cc),
  hashed: (cc) => /immutable/.test(cc),
  image: (cc) => /max-age=604800/.test(cc),
  crawler: (cc) => /max-age=3600/.test(cc),
  other: (cc) => /must-revalidate/.test(cc) || /max-age=3600/.test(cc),
};
const EXPECT_LABEL = {
  html: 'must-revalidate',
  pdf: 'must-revalidate',
  hashed: 'immutable',
  image: 'max-age=604800',
  crawler: 'max-age=3600',
  other: 'must-revalidate or max-age=3600',
};

function evaluateTree(files, passes, label) {
  let checked = 0;
  const uncovered = [];
  const wrong = [];
  for (const rel of files) {
    const cls = classify(rel);
    const { cache, applied } = effectivePolicy(rel, passes, true);
    checked++;
    if (cache === null) {
      uncovered.push(`${rel} [${cls}] matched no upload pass -> never deployed`);
      continue;
    }
    if (!EXPECT[cls](cache)) {
      wrong.push(
        `${rel} [${cls}] ends with "${cache}", expected ${EXPECT_LABEL[cls]} (passes: ${applied.join(' -> ')})`
      );
    }
    // A mutable filename must never be pinned immutable.
    if (cls !== 'hashed' && /immutable/.test(cache)) {
      wrong.push(`${rel} [${cls}] is marked immutable but its filename is mutable`);
    }
  }
  for (const u of uncovered) problems.push(`${label}: ${u}`);
  for (const w of wrong) problems.push(`${label}: ${w}`);
  notes.push(`${label}: ${checked} files checked, ${uncovered.length} uncovered, ${wrong.length} mis-cached`);
  return { checked, uncovered: uncovered.length, wrong: wrong.length };
}

/* ------------------------------------------------------------------ fixture */

// A synthetic tree that pins the exact shapes that broke before, so the test
// keeps its teeth even if dist/ happens not to contain one of them today.
const FIXTURE = [
  'index.html',                                  // root HTML: the regression
  '404.html',                                    // root HTML: the regression
  'blog/index.html',                             // nested HTML
  'work/qualitech/index.html',                   // deeper nested HTML
  '_astro/index.a1b2c3.css',                     // hashed CSS
  '_astro/client.d4e5f6.js',                     // hashed JS
  '_astro/icon.a7b8c9.svg',                      // hashed SVG: overlap trap
  '_astro/photo.f1e2d3.webp',                    // hashed image: overlap trap
  'images/hero.png',                             // image directly in images/
  'images/og/card.jpg',                          // nested image
  'favicon.svg',                                 // root SVG
  'apple-touch-icon.png',                        // root icon
  'Antonio-Cumberbatch-CV-2026.pdf',             // approved CV
  'resume.pdf',                                  // CV alias
  'resources/checklist.pdf',                     // nested PDF
  'robots.txt',
  'llms.txt',
  'sitemap-0.xml',
  'sitemap-index.xml',
  'rss.xml',
  'site.webmanifest',
];

/* ---------------------------------------------------------------- CV hash */

function checkCvHashes() {
  for (const dir of ['public', DIST]) {
    for (const name of CV_FILES) {
      const p = path.join(dir, name);
      if (!fs.existsSync(p)) {
        problems.push(`approved CV missing: ${p}`);
        continue;
      }
      const sum = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      if (sum !== APPROVED_CV_SHA256) {
        problems.push(`CV bytes changed: ${p}\n      expected ${APPROVED_CV_SHA256}\n      got      ${sum}`);
      } else {
        notes.push(`CV hash OK: ${p}`);
      }
    }
  }
}

/* -------------------------------------------------------------------- run */

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

if (!fs.existsSync(WORKFLOW)) {
  console.error(`${WORKFLOW} not found.`);
  process.exit(1);
}
const passes = parseWorkflow(fs.readFileSync(WORKFLOW, 'utf8'));

if (!passes.length) {
  problems.push('no upload passes found in the workflow');
}

// A pass that cannot overwrite is a pass that cannot fix a stale file. The
// original bug was exactly this: the only step covering root HTML ran with
// --overwrite false, so the homepage could never be updated.
for (const p of passes) {
  if (!p.overwrite) {
    problems.push(
      `upload pass "${p.name}" uses --overwrite false, so on a redeploy it silently skips existing blobs and leaves them stale`
    );
  }
}

// There must be a catch-all pass (no --pattern) so nothing can be missed.
if (!passes.some((p) => p.patterns === null)) {
  problems.push(
    'no unpatterned baseline upload pass: with fnmatch patterns alone, some file class will eventually be missed'
  );
}

console.log('Upload passes parsed from the workflow, in order:');
for (const p of passes) {
  const pat = p.patterns === null ? '(all files)' : p.patterns.join(' ');
  console.log(`  ${p.name}`);
  console.log(`      patterns : ${pat}`);
  console.log(`      cache    : ${p.cache}`);
  console.log(`      overwrite: ${p.overwrite}`);
}
console.log('');

evaluateTree(FIXTURE, passes, 'fixture');

if (fs.existsSync(DIST)) {
  evaluateTree(walk(DIST), passes, 'dist');
} else {
  notes.push('dist/ not present, skipped real-tree check (run npm run build first)');
}

checkCvHashes();

console.log(notes.map((n) => '  ' + n).join('\n'));

if (problems.length) {
  console.error(`\nFAIL: ${problems.length} upload-policy problem(s)\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('\nPASS: every file is uploaded, exactly one policy wins per file, and the CV bytes are the approved artifact.');
