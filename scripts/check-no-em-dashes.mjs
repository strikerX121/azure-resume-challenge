// Repeatable guard: no em dash may reach the public site copy.
//
// This checks RENDERED output (dist/) rather than source, because an em dash can
// arrive in the build through several forms that a plain source grep for U+2014
// would miss entirely:
//
//   - the literal character             U+2014
//   - HTML entities                     &mdash;  &#8212;  &#x2014;  (and &#8212 without
//                                       the semicolon, which browsers still render)
//   - JS/JSON string escapes            \u2014  \U00002014  (JSON-LD and inline scripts)
//   - percent-encoding in URLs/params   %E2%80%94
//   - raw UTF-8 bytes                   e2 80 94
//
// Scope: text-bearing build artefacts only. The approved CV PDF is a supplied
// binary that must stay byte-identical, so PDFs and images are never read.
//
// Usage:
//   node scripts/check-no-em-dashes.mjs            scan dist/ (run after a build)
//   node scripts/check-no-em-dashes.mjs --src      also scan src/ and public/
//   node scripts/check-no-em-dashes.mjs dist src   scan explicit roots
//
// Exit code 0 = clean, 1 = at least one occurrence found.

import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.txt', '.xml', '.json', '.js', '.mjs', '.cjs',
  '.css', '.svg', '.astro', '.ts', '.tsx', '.md', '.mdx', '.webmanifest',
]);

// Anything matching these is deliberately excluded. `media-originals/` holds
// parked source photography and is never deployed.
const SKIP_DIRS = new Set(['node_modules', '.git', '.astro', 'media-originals']);

const PATTERNS = [
  { name: 'literal U+2014',        re: /\u2014/g },
  { name: 'entity &mdash;',        re: /&mdash;?/gi },
  { name: 'entity &#8212;',        re: /&#8212;?/g },
  { name: 'entity &#x2014;',       re: /&#x2014;?/gi },
  { name: 'escaped \\u2014',       re: /\\u2014/gi },
  { name: 'escaped \\U00002014',   re: /\\U00002014/gi },
  { name: 'percent-encoded %E2%80%94', re: /%E2%80%94/gi },
];

function collect(root, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collect(full, out);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

const args = process.argv.slice(2);
const wantSrc = args.includes('--src');
const explicit = args.filter((a) => !a.startsWith('--'));

let roots = explicit.length ? explicit : ['dist'];
if (wantSrc && !explicit.length) roots = ['dist', 'src', 'public'];

const present = roots.filter((r) => fs.existsSync(r));
if (!present.length) {
  console.error(`No scan root found. Looked for: ${roots.join(', ')}`);
  console.error('Run `npm run build` first, or pass an explicit directory.');
  process.exit(1);
}

const findings = [];
let filesScanned = 0;

for (const root of present) {
  for (const file of collect(root)) {
    filesScanned++;
    const text = fs.readFileSync(file, 'utf8');
    // Cheap pre-filter: skip the per-pattern work unless something could match.
    if (!/[\u2014]|&mdash|&#8212|&#x2014|\\u2014|\\U00002014|%E2%80%94/i.test(text)) continue;

    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const { name, re } of PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          findings.push({
            file,
            line: i + 1,
            form: name,
            excerpt: line.trim().slice(0, 160),
          });
          break; // one finding per line is enough to act on
        }
      }
    });
  }
}

console.log(`Scanned ${filesScanned} text files under: ${present.join(', ')}`);

if (!findings.length) {
  console.log('PASS: no em dash found in any form.');
  process.exit(0);
}

console.error(`\nFAIL: ${findings.length} line(s) contain an em dash.\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.form}]`);
  console.error(`    ${f.excerpt}`);
}
process.exit(1);
