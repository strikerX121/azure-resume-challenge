// Critical-render guard: checks the built HTML for the render-path regressions
// this project has actually hit, rather than for style.
//
// Why each rule exists, with the measurement that produced it. All figures are
// local Lighthouse medians, mobile form factor, simulated throttling, 4x CPU,
// the same build served from the same local static server:
//
//   1. No cross-origin stylesheet in <head>.
//      The Google Fonts stylesheet was what first paint was waiting on.
//      Removing that single <link> and changing nothing else moved the
//      homepage from performance 70 to 98, FCP ~3.07s to ~1.32s and LCP
//      ~5.04s to ~1.41s. Fonts are self-hosted now; a cross-origin stylesheet
//      creeping back into the head would undo the largest win in the branch.
//
//   2. No eagerly loaded third-party script anywhere in the document.
//      The OneSignal SDK used to load during page load for every visitor. It
//      set a third-party cookie and logged DevTools issues, which were the two
//      weighted best-practices failures (score 73). Loading it on first real
//      interaction instead took best practices to 100 with the subscribe bell
//      still working. A plain <script src="https://..."> brings that back.
//
//   3. The homepage hero must not use the JS-gated .reveal class.
//      .reveal starts at opacity 0 and only becomes visible once the
//      IntersectionObserver at the end of the document has run, so an
//      above-the-fold element using it makes the Largest Contentful Paint wait
//      on script. Above-the-fold content uses .reveal-immediate, a pure CSS
//      entrance that starts as soon as the element renders.
//
//   4. The retired visit counter must stay retired.
//      Belt and braces next to check-no-public-credentials.mjs: the only
//      GetResumeCounter endpoint is Function-authorized, so calling it from
//      the browser means publishing its key.
//
// Usage:
//   node scripts/check-critical-render.mjs
//   node scripts/check-critical-render.mjs --selftest   prove each rule trips

import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

// Third-party script hosts that must never be loaded eagerly. These are the
// ones this site actually uses; the rule is about load timing, not about
// banning the vendor.
const DEFERRED_THIRD_PARTY = ['cdn.onesignal.com', 'onesignal.com'];

/* --------------------------------------------------------------- helpers */

function headOf(html) {
  const end = html.indexOf('</head>');
  return end === -1 ? html : html.slice(0, end);
}

// Strip HTML comments before pattern matching. The layout documents these very
// rules in comments that name the hosts involved, and a guard that trips on
// its own rationale is a guard nobody keeps.
function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function tagsOf(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  return html.match(re) || [];
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

/* ----------------------------------------------------------------- rules */

// Rule 1: no cross-origin stylesheet in <head>.
function checkNoCrossOriginStylesheet(html, page, problems) {
  const head = stripComments(headOf(html));
  for (const tag of tagsOf(head, 'link')) {
    const rel = (attr(tag, 'rel') || '').toLowerCase();
    if (!rel.split(/\s+/).includes('stylesheet')) continue;
    const href = attr(tag, 'href') || '';
    if (/^https?:\/\//i.test(href)) {
      problems.push(
        `${page}: cross-origin stylesheet in <head> (${href}). ` +
          `First paint waits on it. Self-host the asset instead.`
      );
    }
  }
  // preload as=style has the same effect once it is promoted to a stylesheet.
  for (const tag of tagsOf(head, 'link')) {
    const rel = (attr(tag, 'rel') || '').toLowerCase();
    const as = (attr(tag, 'as') || '').toLowerCase();
    const href = attr(tag, 'href') || '';
    if (rel === 'preload' && as === 'style' && /^https?:\/\//i.test(href)) {
      problems.push(`${page}: cross-origin preload as=style in <head> (${href}).`);
    }
  }
}

// Rule 2: no eagerly loaded deferred-by-policy third-party script.
function checkNoEagerThirdParty(html, page, problems) {
  const body = stripComments(html);
  for (const tag of tagsOf(body, 'script')) {
    const src = attr(tag, 'src');
    if (!src) continue;
    for (const host of DEFERRED_THIRD_PARTY) {
      if (src.includes(host)) {
        problems.push(
          `${page}: ${host} is loaded by a parser-visible <script src>. ` +
            `It must be injected on first user interaction instead.`
        );
      }
    }
  }
}

// Rule 3: homepage hero must not be JS-gated.
function checkHeroNotJsGated(html, page, problems) {
  if (page !== '/index.html') return;
  const h1 = html.match(/<h1\b[^>]*>/i);
  if (!h1) {
    problems.push(`${page}: no <h1> found, cannot verify the hero render path.`);
    return;
  }
  const cls = attr(h1[0], 'class') || '';
  const classes = cls.split(/\s+/).filter(Boolean);
  if (classes.includes('reveal')) {
    problems.push(
      `${page}: hero <h1> uses the JS-gated .reveal class, which makes the ` +
        `Largest Contentful Paint wait for the IntersectionObserver. ` +
        `Use .reveal-immediate above the fold.`
    );
  }
}

// Rule 4: the retired counter stays retired.
function checkCounterStaysRetired(html, page, problems) {
  const body = stripComments(html);
  if (/GetResumeCounter/i.test(body)) {
    problems.push(`${page}: references GetResumeCounter. The counter is retired.`);
  }
}

const RULES = [
  checkNoCrossOriginStylesheet,
  checkNoEagerThirdParty,
  checkHeroNotJsGated,
  checkCounterStaysRetired,
];

/* ------------------------------------------------------------- self-test */

// Each fixture must trip exactly the rule it targets. This is the same shape
// as check-no-public-credentials.mjs --selftest: a guard that has never been
// shown to fail is not evidence of anything.
function selfTest() {
  const fixtures = [
    {
      name: 'cross-origin stylesheet in head',
      page: '/index.html',
      html:
        '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">' +
        '</head><body><h1 class="reveal-immediate">x</h1></body></html>',
      expect: /cross-origin stylesheet/,
    },
    {
      name: 'cross-origin preload as=style in head',
      page: '/index.html',
      html:
        '<html><head><link rel="preload" as="style" href="https://fonts.googleapis.com/css2">' +
        '</head><body><h1 class="reveal-immediate">x</h1></body></html>',
      expect: /preload as=style/,
    },
    {
      name: 'eager third-party script',
      page: '/index.html',
      html:
        '<html><head></head><body><h1 class="reveal-immediate">x</h1>' +
        '<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script></body></html>',
      expect: /first user interaction/,
    },
    {
      name: 'JS-gated hero h1',
      page: '/index.html',
      html: '<html><head></head><body><h1 class="reveal">x</h1></body></html>',
      expect: /JS-gated \.reveal/,
    },
    {
      name: 'counter resurrected',
      page: '/index.html',
      html:
        '<html><head></head><body><h1 class="reveal-immediate">x</h1>' +
        '<script>fetch("/api/GetResumeCounter")</script></body></html>',
      expect: /counter is retired/,
    },
    {
      name: 'comment naming a host must NOT trip',
      page: '/index.html',
      html:
        '<html><head><!-- deliberately no fonts.googleapis.com stylesheet here -->' +
        '<link rel="stylesheet" href="/_astro/a.css"></head>' +
        '<body><h1 class="reveal-immediate">x</h1>' +
        '<!-- cdn.onesignal.com is injected on interaction --></body></html>',
      expect: null,
    },
  ];

  let failures = 0;
  for (const f of fixtures) {
    const found = [];
    for (const rule of RULES) rule(f.html, f.page, found);
    const matched = f.expect ? found.some((p) => f.expect.test(p)) : found.length === 0;
    if (matched) {
      console.log(`  ok    ${f.name}`);
    } else {
      failures++;
      console.log(`  FAIL  ${f.name}`);
      console.log(`        expected ${f.expect || 'no findings'}, got ${JSON.stringify(found)}`);
    }
  }
  if (failures) {
    console.error(`\ncheck-critical-render selftest: ${failures} fixture(s) failed.`);
    process.exit(1);
  }
  console.log('\ncheck-critical-render selftest: all fixtures behaved as expected.');
  process.exit(0);
}

/* ---------------------------------------------------------------- runner */

if (process.argv.includes('--selftest')) selfTest();

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const problems = [];
const htmlFiles = walk(DIST);
for (const file of htmlFiles) {
  const page = '/' + path.relative(DIST, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  for (const rule of RULES) rule(html, page, problems);
}

console.log(`check-critical-render: ${htmlFiles.length} page(s) checked.`);

if (problems.length) {
  console.error('\nCritical-render problems:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}

console.log('No critical-render regressions found.');
