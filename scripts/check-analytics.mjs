// Offline regression gate over emitted HTML, included in verify before upload.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

export function checkGtag(html, load = () => '') {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...clean.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .map(([, attrs, body]) => {
      const src = attrs.match(/\bsrc="([^"]+)"/);
      return src ? (src[1].startsWith('/') ? load(src[1]) : '') : body;
    });
  const config = scripts.filter(s => s.includes('G-B7EJB7Y1HL') && s.includes('dataLayer'));
  assert.equal(config.length, 1, 'Exactly one built GA queue/config script required');
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  // Function wrapper mimics module scope; a plain top-level function in a VM
  // would be global and mask the original Astro module-local gtag defect.
  vm.runInContext(`(function(){${config[0]}\n})();`, sandbox, { timeout: 1000 });
  assert.equal(typeof sandbox.gtag, 'function', 'Built module must expose window.gtag');
  sandbox.gtag('event', 'offline_regression', { context: 'test' });
  assert.equal(sandbox.dataLayer.at(-1)[1], 'offline_regression');
  assert.equal(sandbox.dataLayer.filter(x => x[0] === 'config').length, 1);
  const params = sandbox.dataLayer.find(x => x[0] === 'config')[2];
  assert.equal(params.anonymize_ip, true);
  assert.equal(params.allow_google_signals, false);
  assert.equal(params.allow_ad_personalization_signals, false);
}

if (process.argv.includes('--selftest')) {
  const good = '<script type="module">window.dataLayer=[];function tag(){window.dataLayer.push(arguments)}window.gtag=tag;tag("config","G-B7EJB7Y1HL",{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});</script>';
  checkGtag(good);
  assert.throws(() => checkGtag(good.replace('window.gtag=tag;', '')), /expose window.gtag/);
  assert.throws(() => checkGtag(''), /Exactly one/);
  assert.throws(() => checkGtag(good + good), /Exactly one/);
  assert.throws(() => checkGtag(good.replace('allow_google_signals:false', 'allow_google_signals:true')));
  console.log('Analytics guard: 5 self-tests passed (including module-scope regression)');
} else {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const files = walk('dist').filter(p => p.endsWith('.html'));
  let checked = 0, links = 0, posts = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue;
    checkGtag(html, src => fs.readFileSync(path.join('dist', src), 'utf8'));
    checked++;
    const content = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '');
    for (const [anchor] of content.matchAll(/<a\b[^>]*href="\/contact\/?"[^>]*>/g)) {
      assert.match(anchor, /data-track="project_enquiry_intent"/, `${file}: contact CTA event`);
      assert.match(anchor, /data-track-context="[a-z0-9][^" ]+"/, `${file}: meaningful CTA context`);
      links++;
    }
    if (file.includes(`${path.sep}blog${path.sep}`) && html.includes('post-author-heading')) {
      const slug = path.basename(path.dirname(file));
      const source = fs.readFileSync(`src/content/blog/${slug}.md`, 'utf8');
      const copilot = /^tags:.*"microsoft copilot"/m.test(source);
      const card = html.match(/<section[^>]*aria-labelledby="post-author-heading"[\s\S]*?<\/section>/)?.[0];
      assert.ok(card, `${slug}: author card`);
      assert.equal(card.includes('2,574+'), copilot, `${slug}: scoped training claim`);
      assert.equal(card.includes('Put Copilot into practice'), copilot, `${slug}: scoped heading`);
      assert.doesNotMatch(card.replace(/<[^>]*>/g, ''), /\b95\b/, 'No engagement count in the Copilot card');
      posts++;
    }
  }
  assert.ok(checked > 30 && posts === 18 && links > 50);
  console.log(`Analytics guard: ${checked} built pages, ${links} contextual contact CTAs, ${posts} scoped blog cards passed`);
}
