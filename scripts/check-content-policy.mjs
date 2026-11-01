// Content policy guard: things that must never reach the public site.
//
// Two classes of rule:
//
//   1. EXCLUDED CONTENT. Names and topics Antonio has ruled out of public copy
//      (client engagements under NDA or not yet public, uncertified exams,
//      internal security history, an intake page still in development), plus
//      every client- and staff-identifying string in the source n8n catalogue
//      that /automations was scrubbed from. If the scrubbing ever regresses,
//      the build fails here rather than on someone's screen.
//
//   2. PAYMENT SECRETS. WAM's production API keys are 64-character hex
//      strings and its test keys start sk_test_. Neither may ever appear in a
//      static site. Matches are reported by file and line only; the value is
//      never printed.
//
// Scans the BUILT output (dist/), raw, including HTML comments and inline
// JSON-LD, because view-source is public too.
//
// Usage:
//   node scripts/check-content-policy.mjs             scan dist/
//   node scripts/check-content-policy.mjs --selftest  prove each rule trips

import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.json', '.js', '.txt', '.webmanifest', '.css']);

// [label, regex]. Word-bounded so "Sheldon" does not trip on a substring.
const EXCLUDED = [
  // Engagements and people ruled out of public copy.
  ['LT Accounting', /\bLT Accounting\b/i],
  ['Leslie', /\bLeslie\b/],
  ['Pierre Point', /\bPierre Point\b/i],
  ['Caribbean Eye Institute', /\bCaribbean Eye Institute\b/i],
  ['CEI', /\bCEI\b/],
  ['Charlene', /\bCharlene\b/],
  ['Sheldon', /\bSheldon\b/],
  ['Vidia', /\bVidia\b/],
  ['PwC', /\bPwC\b|PricewaterhouseCoopers/],
  ['Roger', /\bRoger\b/],
  ['Shaun', /\bShaun\b/],
  ['The Nook', /\bThe Nook\b/],
  ['Asiya', /\bAsiya\b/],
  ['Conflict Women', /\bConflict Women\b/i],
  // Not yet earned.
  ['AB-620', /\bAB-620\b/i],
  ['AB-100', /\bAB-100\b/i],
  // Internal security history and compliance claims stay off the site.
  ['HIPAA', /\bHIPAA\b/i],
  // The 3ST T&TMA public intake page is still in development.
  ['T&TMA intake page link', /3stripestech\.com\/ttma\b|href="\/ttma\b/i],
  // Internal agent tooling names.
  ['Hermes (internal agent tooling)', /\bHermes\b/],
  // Identifiers from the source n8n catalogue (/automations was scrubbed of these).
  ['catalogue: sales staff surnames', /\b(Hosein|Awong|Persaud|Lochai|Ramdial|Ramcharan|Ramlochan|Ginger-JM)\b/],
  ['catalogue: client sheet names', /MotorShop|Regional Information|trinidad_private_doctors|Staff Expense Tracker/i],
  ['catalogue: Family Medical', /\bFamily Medical\b/i],
  ['catalogue: bank name', /\bRBL\b/],
  ['catalogue: fitness client', /\bimage fitness\b/i],
  ['catalogue: unofficial WhatsApp API', /\bWAHA\b/],
  ['catalogue: staff handle', /Syedhamzashamim/i],
];

// [label, regex, path regex]. Same as EXCLUDED, but only on the pages named.
// /automations credits "our team", never a named individual (Antonio,
// 2026-11-01). The name is still credited on /work/qualitech, which is out of
// this rule's scope; widen the path regex to /./ to make it site-wide.
const EXCLUDED_ON_PAGE = [
  ['Hamza (no individual credit on /automations)', /\bHamza\b/i, /(^|\/)dist\/automations\//],
];

const SECRETS = [
  ['WAM production-style API key (64 hex)', /(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])/g],
  ['WAM test API key (sk_test_)', /\bsk_(test|live)_[A-Za-z0-9]{8,}/g],
];

function scan(text, file, problems) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [label, re] of EXCLUDED) {
      if (re.test(line)) problems.push(`${file}:${i + 1}: excluded content (${label})`);
    }
    for (const [label, re, where] of EXCLUDED_ON_PAGE) {
      if (where.test(file) && re.test(line)) problems.push(`${file}:${i + 1}: excluded content (${label})`);
    }
    for (const [label, re] of SECRETS) {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) problems.push(`${file}:${i + 1}: ${label}, ${m[0].length} chars (value redacted)`);
    }
  });
}

function selfTest() {
  const cases = [
    ['Our client Pierre Point Villa', /Pierre Point/],
    ['compiled by <strong>Hamza</strong>', /Hamza/, 'dist/automations/index.html'],
    ['built by hamza', /Hamza/, 'dist/automations/index.html'],
    ['compiled by our team at 3 Stripes Technologies', null, 'dist/automations/index.html'],
    ['<p>Sales rep Robin Hosein</p>', /surnames/],
    ['<a href="https://www.3stripestech.com/ttma">', /intake page/],
    ['Certified AB-620', /AB-620/],
    ['powered by Hermes agents', /Hermes/],
    ['key=' + 'ab12'.repeat(16), /64 hex/],
    ['sk_test_' + 'x'.repeat(20), /sk_test_/],
    ['Shelter and Sheldonia are fine words', null],
    ['ABC Paediatrics, 11 doctors, WhatsApp reminders', null],
  ];
  let fail = 0;
  for (const [text, expect, file = 'fixture'] of cases) {
    const found = [];
    scan(text, file, found);
    const ok = expect ? found.some(f => expect.test(f)) : found.length === 0;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${JSON.stringify(text).slice(0, 60)}`);
    if (!ok) { fail++; console.log('        got', found); }
  }
  if (fail) { console.error(`\ncheck-content-policy selftest: ${fail} failure(s).`); process.exit(1); }
  console.log('\ncheck-content-policy selftest: all fixtures behaved as expected.');
  process.exit(0);
}

if (process.argv.includes('--selftest')) selfTest();

const DIST = 'dist';
if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (TEXT_EXTENSIONS.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

const problems = [];
const files = walk(DIST);
for (const f of files) scan(fs.readFileSync(f, 'utf8'), f.split(path.sep).join('/'), problems);

console.log(`check-content-policy: ${files.length} file(s) checked.`);
if (problems.length) {
  console.error('\nContent policy violations:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log('No excluded content or payment secrets found.');
