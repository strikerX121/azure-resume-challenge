// Repeatable guard: no Azure Function access credential may reach public output.
//
// The site once fetched its visit counter with the Function key pasted into the
// request URL, which published a privileged credential in page source and in
// this public repository. This gate makes that class of mistake fail the build
// instead of shipping.
//
// What it looks for (patterns, not known values, so a rotated or brand new key
// is caught just the same):
//
//   - Function auth in a query string      ?code=<value>   &code=<value>
//   - the Function key header              x-functions-key: <value>
//   - the master/host key query form       ?clientId=<value> on an api/ route
//   - Azure Functions SAS-style tokens     ?sv=...&sig=<value>
//
// A match is only reported when the value looks like a real credential: long
// enough, high entropy alphabet, and not an obvious placeholder. That keeps
// documentation that writes `?code=YOUR_KEY_HERE` from failing the gate.
//
// FAILURE OUTPUT NEVER PRINTS A MATCHED VALUE. Only file, line, pattern name
// and the character length of the redacted secret are shown, so CI logs and
// terminal scrollback stay clean even when the guard trips.
//
// Usage:
//   node scripts/check-no-public-credentials.mjs             scan dist/ src/ public/ and root client JS
//   node scripts/check-no-public-credentials.mjs dist src    scan explicit roots
//   node scripts/check-no-public-credentials.mjs --selftest  prove the guard trips on a dummy fixture
//
// Exit code 0 = clean, 1 = at least one credential-shaped match found.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.txt', '.xml', '.json', '.js', '.mjs', '.cjs',
  '.css', '.svg', '.astro', '.ts', '.tsx', '.md', '.mdx', '.webmanifest',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', '.astro', 'media-originals', 'bin', 'obj']);

// Default roots: the built artefact plus the sources that produce it, plus the
// legacy root-level client scripts that are still served from this repo.
const DEFAULT_ROOTS = ['dist', 'src', 'public', 'main.js', 'index.html', 'js', 'docs'];

const PATTERNS = [
  { name: 'Function key in query (?code=)', re: /[?&]code=([^"'`\s&<>)]+)/gi },
  { name: 'Function key header (x-functions-key)', re: /x-functions-key["'\s]*[:=]["'\s]*([^"'`\s,}<>]+)/gi },
  { name: 'Function host key in query (?clientId=)', re: /[?&]clientId=([^"'`\s&<>)]+)/gi },
  { name: 'SAS signature in query (&sig=)', re: /[?&]sig=([^"'`\s&<>)]+)/gi },
];

// Obvious non-secrets. Anything here is a placeholder, a template expression or
// an environment lookup, none of which is a leaked credential.
const PLACEHOLDER = /^(your[-_]?|my[-_]?|insert|replace|example|sample|dummy|fake|test|placeholder|redacted|xxx|<|\{|\$\{|%|process\.env|import\.meta)/i;
const PLACEHOLDER_EXACT = new Set(['', 'key', 'code', 'none', 'null', 'undefined', 'secret', 'functionkey']);

// Azure Function keys are long, base64url-ish and mix character classes. Real
// values comfortably clear this bar; words and slugs do not.
function looksLikeCredential(value) {
  const v = value.replace(/^['"`]|['"`]$/g, '');
  if (PLACEHOLDER_EXACT.has(v.toLowerCase())) return false;
  if (PLACEHOLDER.test(v)) return false;
  if (v.length < 24) return false;
  if (!/^[A-Za-z0-9\-_=+/%.~]+$/.test(v)) return false;
  const classes =
    (/[a-z]/.test(v) ? 1 : 0) +
    (/[A-Z]/.test(v) ? 1 : 0) +
    (/[0-9]/.test(v) ? 1 : 0) +
    (/[-_=+/.~%]/.test(v) ? 1 : 0);
  if (classes < 2) return false;
  // Reject low-variety strings such as a long repeated word or a hyphen slug.
  const unique = new Set(v).size;
  return unique >= 12;
}

function collect(root, out = []) {
  let stat;
  try {
    stat = fs.statSync(root);
  } catch {
    return out;
  }
  if (stat.isFile()) {
    if (TEXT_EXTENSIONS.has(path.extname(root).toLowerCase())) out.push(root);
    return out;
  }
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

function scan(roots) {
  const present = roots.filter((r) => fs.existsSync(r));
  const findings = [];
  let filesScanned = 0;

  for (const root of present) {
    for (const file of collect(root)) {
      filesScanned++;
      const text = fs.readFileSync(file, 'utf8');
      if (!/code=|clientId=|x-functions-key|[?&]sig=/i.test(text)) continue;

      const lines = text.split(/\r?\n/);
      lines.forEach((line, i) => {
        for (const { name, re } of PATTERNS) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(line)) !== null) {
            if (!looksLikeCredential(m[1])) continue;
            findings.push({
              file,
              line: i + 1,
              form: name,
              // Length only. The value itself is deliberately never retained.
              redactedLength: m[1].length,
            });
            break;
          }
        }
      });
    }
  }
  return { present, findings, filesScanned };
}

// --- self test ------------------------------------------------------------
// Proves the guard actually trips, using a throwaway dummy credential written
// to a temp directory at runtime. Nothing credential-shaped is committed to the
// repo, and the dummy never touches src/, public/ or dist/.
function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cred-guard-fixture-'));
  const dummy = ['Guard', 'Fixture', 'Not', 'A', 'Real'].join('') +
    'Key_0123456789abcdefABCDEF-xyz==';
  const fixture = path.join(dir, 'leaky.html');
  fs.writeFileSync(
    fixture,
    `<script>fetch('https://example.azurewebsites.net/api/Thing?code=${dummy}')</script>\n` +
    `<script>fetch('/api/Thing', { headers: { 'x-functions-key': '${dummy}' } })</script>\n` +
    `<p>A documented placeholder like ?code=YOUR_FUNCTION_KEY_HERE must not trip this.</p>\n`,
    'utf8',
  );

  const { findings } = scan([dir]);
  const forms = new Set(findings.map((f) => f.form));
  const leakedValue = findings.some((f) => JSON.stringify(f).includes(dummy));

  fs.rmSync(dir, { recursive: true, force: true });

  const problems = [];
  if (findings.length < 2) problems.push(`expected at least 2 findings on the fixture, got ${findings.length}`);
  if (!forms.has('Function key in query (?code=)')) problems.push('query-string pattern did not trip');
  if (!forms.has('Function key header (x-functions-key)')) problems.push('header pattern did not trip');
  if (findings.length > 2) problems.push(`placeholder text was flagged (${findings.length} findings, expected 2)`);
  if (leakedValue) problems.push('finding records contained the credential value');

  if (problems.length) {
    console.error('SELFTEST FAIL:');
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
  }
  console.log(`SELFTEST PASS: dummy fixture produced ${findings.length} redacted finding(s), placeholder ignored, no value retained.`);
  process.exit(0);
}

// --- main -----------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--selftest')) selfTest();

const explicit = args.filter((a) => !a.startsWith('--'));
const roots = explicit.length ? explicit : DEFAULT_ROOTS;
const { present, findings, filesScanned } = scan(roots);

if (!present.length) {
  console.error(`No scan root found. Looked for: ${roots.join(', ')}`);
  console.error('Run `npm run build` first, or pass an explicit path.');
  process.exit(1);
}

console.log(`Scanned ${filesScanned} text files under: ${present.join(', ')}`);

if (!findings.length) {
  console.log('PASS: no Function access credential in public output.');
  process.exit(0);
}

console.error(`\nFAIL: ${findings.length} credential-shaped value(s) in public output.`);
console.error('Values are withheld on purpose. Open the file at the line shown.\n');
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.form}]  value withheld, ${f.redactedLength} chars`);
}
console.error('\nRemove the credential from source. Do not move it into another');
console.error('public bundle or query string. Rotation is a separate server-side step.');
process.exit(1);
