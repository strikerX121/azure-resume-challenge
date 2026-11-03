"""Local-only funnel checks. Requires Python + Playwright Chromium.
No lead is submitted. Every non-local browser request is intercepted.
Use --baseline to characterize the original build, not assert the repairs.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:4331')
parser.add_argument('--artifacts', required=True)
parser.add_argument('--baseline', action='store_true')
parser.add_argument('--tracking-only', action='store_true')
args = parser.parse_args()
out = Path(args.artifacts)
out.mkdir(parents=True, exist_ok=True)
tag = (out / 'gtag.js').read_bytes()  # Real gtag downloaded by read-only HTTP, never a stub.
origin = urlparse(args.base).netloc
records = []
errors = []
slugs = ['train-copilot-to-write-emails-that-sound-like-you', 'good-chefs-saute-evenly-copilot-prompt-framework']

def custom_collect(requests):
    result = []
    for request in requests:
        query = parse_qs(urlparse(request['url']).query)
        # GA can batch multiple events as newline-separated POST bodies.
        for line in (request['body'].splitlines() if request['body'] else ['']):
            fields = query | parse_qs(line)
            if fields.get('en', [''])[0] in ['contact_intent', 'cv_download_intent']:
                result.append({k: fields[k][0] for k in ['en', 'ep.context', 'ep.method', 'ep.file'] if k in fields})
    return result

with sync_playwright() as p:
    browser = p.chromium.launch()

    def setup(**kwargs):
        context = browser.new_context(**kwargs)
        collect = []
        blocked = []
        def route(r):
            u = urlparse(r.request.url)
            if u.netloc == origin and u.scheme == 'http':
                r.continue_()
            elif u.hostname == 'www.googletagmanager.com' and u.path == '/gtag/js':
                r.fulfill(status=200, content_type='application/javascript', body=tag)
            elif '/collect' in u.path:
                collect.append({'url': r.request.url, 'body': r.request.post_data})
                r.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*'})
            else:
                blocked.append(r.request.url)
                r.abort()
        context.route('**/*', route)
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        # Prevent actual mailto, download, internal navigation and new-tab opens.
        # Runs at window after the site's document click listener.
        page.add_init_script("window.addEventListener('click', e => { if(e.target.closest('a')) e.preventDefault(); });")
        return context, page, collect, blocked

    def events(page):
        return page.evaluate("(window.dataLayer || []).filter(x => x[0] === 'event').map(x => ({name:x[1],params:x[2]}))")

    # Real built scripts and real gtag transport, with collect fulfilled locally.
    context, page, collect, blocked = setup(viewport={'width': 1280, 'height': 900})
    page.goto(args.base + '/contact/')
    page.wait_for_timeout(1200)
    state = page.evaluate("({gtag:typeof window.gtag,arcTrack:typeof window.arcTrack})")
    email = page.locator('a[href^="mailto:"]').first
    email.click()
    page.wait_for_timeout(1200)
    records.append({'test': 'real-email-click', 'globals': state, 'events': events(page)})
    if not args.baseline:
        assert state['gtag'] == 'function'
        assert len(events(page)) == 1
        assert events(page)[0]['params']['method'] == 'email'
    # Baseline's globals can be repaired in the harness ONLY to prove the
    # separately masked false-positive internal navigation/invalid-form defect.
    if args.baseline:
        page.evaluate("window.gtag = function(){window.dataLayer.push(arguments)}")
    for selector, method in [('a[href*="api.whatsapp.com"]', 'whatsapp'), ('a[href*="calendar.app.google"]', 'booking')]:
        before = len(events(page))
        page.locator(selector).first.click()
        assert len(events(page)) == before + 1
        if not args.baseline:
            assert events(page)[-1]['params']['method'] == method
    before = len(events(page))
    page.locator('header a[href="/contact"]').first.click()
    records.append({'test': 'internal-contact-navigation', 'addedEvents': len(events(page)) - before})
    if not args.baseline:
        assert len(events(page)) == before
    before = len(events(page))
    page.locator('#contact-form button').click()
    records.append({'test': 'invalid-compose-click', 'addedEvents': len(events(page)) - before})
    if not args.baseline:
        assert len(events(page)) == before
    # Valid draft uses the real submit handler. The browser is sandboxed and all
    # network traffic blocked; no external application handler is registered.
    page.locator('#name').fill('Local verification')
    page.locator('#email').fill('local@example.invalid')
    page.locator('#message').fill('Local verification only, never sent.')
    before = len(events(page))
    page.locator('#contact-form button').click()
    deadline = time.monotonic() + 8
    while not args.baseline and time.monotonic() < deadline and not any(e.get('ep.context') == 'contact-compose' for e in custom_collect(collect)):
        page.wait_for_timeout(100)
    assert 'Nothing has been sent yet' in page.locator('#form-status').inner_text()
    if not args.baseline:
        assert len(events(page)) == before + 1
        assert events(page)[-1]['params'] == {'context': 'contact-compose', 'method': 'email'}
    assert all('local@example.invalid' not in json.dumps(e) for e in events(page))
    records.append({'test': 'collect-contact', 'requests': collect, 'blocked': blocked, 'events': events(page)})
    if not args.baseline:
        encoded = json.dumps(collect)
        for method in ['email', 'whatsapp', 'booking']:
            assert 'ep.method=' + method in encoded, ('Missing real collect method', method)
        assert 'contact_intent' in encoded
        assert 'local%40example.invalid' not in encoded
        assert custom_collect(collect) == [
            {'en': 'contact_intent', 'ep.context': '/contact/', 'ep.method': 'email'},
            {'en': 'contact_intent', 'ep.context': '/contact/', 'ep.method': 'whatsapp'},
            {'en': 'contact_intent', 'ep.context': '/contact/', 'ep.method': 'booking'},
            {'en': 'contact_intent', 'ep.context': 'contact-compose', 'ep.method': 'email'},
        ], custom_collect(collect)
    context.close()

    context, page, collect, blocked = setup(accept_downloads=True)
    page.goto(args.base + '/resume/')
    page.wait_for_timeout(500)
    page.locator('a[download]').first.click()
    page.wait_for_timeout(1400)
    records.append({'test': 'cv-download', 'events': events(page), 'collect': collect})
    if not args.baseline:
        assert [e['name'] for e in events(page)] == ['cv_download_intent']
        assert 'cv_download_intent' in json.dumps(collect)
        assert custom_collect(collect) == [{'en': 'cv_download_intent', 'ep.context': '/resume/', 'ep.file': '/Antonio-Cumberbatch-CV-2026.pdf'}]
        before = len(events(page))
        if not args.tracking_only:
            page.locator('main a[href="/contact"]').first.click()
            assert len(events(page)) == before
            assert page.locator('main a[href="/contact"]').count() == 2
    assert page.locator('a[href="mailto:antonio.cumberbatch2@gmail.com"]').count() == 1
    context.close()

    for signal in ['globalPrivacyControl', 'doNotTrack', 'msDoNotTrack']:
        context, page, collect, blocked = setup()
        value = 'true' if signal == 'globalPrivacyControl' else "'1'"
        context.add_init_script(f"Object.defineProperty(navigator, '{signal}', {{get:()=>{value}}});")
        page.goto(args.base + '/contact/')
        page.wait_for_timeout(400)
        page.locator('a[href^="mailto:"]').first.click()
        page.locator('#name').fill('Local privacy check')
        page.locator('#email').fill('private@example.invalid')
        page.locator('#message').fill('Local only, never sent.')
        page.locator('#contact-form button').click()
        page.wait_for_timeout(100)
        assert events(page) == []
        contact_events = events(page)
        page.goto(args.base + '/resume/')
        page.locator('a[download]').first.click()
        assert events(page) == []
        records.append({'test': 'privacy-' + signal, 'contactCustomEvents': contact_events, 'cvCustomEvents': events(page)})
        context.close()

    if not args.baseline:
        context, page, collect, blocked = setup()
        context.route('**/gtag/js?*', lambda r: r.abort())
        page.goto(args.base + '/contact/')
        page.locator('a[href^="mailto:"]').first.click()
        assert len(events(page)) == 1
        assert collect == []
        records.append({'test': 'blocked-sdk-retains-intent-queue', 'events': events(page), 'collect': collect})
        context.close()

    if not args.baseline and not args.tracking_only:
        context, page, collect, blocked = setup(reduced_motion='reduce', viewport={'width': 360, 'height': 640})
        page.goto(args.base + '/contact/')
        assert page.locator('h1').evaluate('(e)=>getComputedStyle(e).opacity') == '1'
        for action in page.locator('.contact-actions a').all():
            action.focus()
            action.press('Enter')
        assert [e['params']['method'] for e in events(page)] == ['booking', 'whatsapp', 'email']
        records.append({'test': 'reduced-motion-keyboard-actions', 'events': events(page)})
        context.close()
        for slug in slugs:
            context, page, collect, blocked = setup(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True)
            page.goto(args.base + '/blog/' + slug + '/')
            current = page.locator('.post-hero img').evaluate('(e)=>({src:e.currentSrc,width:e.naturalWidth,complete:e.complete})')
            # naturalWidth is density-corrected for a w-descriptor srcset.
            # The selected URL proves the 1200px asset, not the CSS pixel width.
            assert current['complete'] and current['src'].endswith(slug + '.webp') and current['width'] >= 390, current
            records.append({'test': 'responsive-cover-3x', 'slug': slug, 'image': current})
            context.close()

    for width, height in ([] if args.tracking_only else [(360, 640), (390, 664), (390, 844), (1280, 900)]):
        for path in ['/contact/', '/resume/'] + ['/blog/' + s + '/' for s in slugs]:
            context, page, collect, blocked = setup(viewport={'width': width, 'height': height}, is_mobile=width < 768, device_scale_factor=1)
            page.goto(args.base + path)
            page.wait_for_timeout(600)
            data = page.evaluate(r"""() => {
                const rect = e => {const r=e.getBoundingClientRect();return {text:e.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,opacity:getComputedStyle(e).opacity}};
                return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:rect(document.querySelector('h1')),actions:[...document.querySelectorAll('.contact-actions a')].map(rect),firstExternal:[...document.querySelectorAll('main a')].filter(a=>/^(mailto:|https:\/\/(calendar|api.whatsapp))/.test(a.href)).map(rect),brokenImages:[...document.images].filter(i=>i.complete && i.naturalWidth===0 && !i.src.includes('follow.it')).map(i=>i.src)};
            }""")
            assert data['scrollWidth'] == width, (path, data)
            assert data['brokenImages'] == [], (path, data['brokenImages'])
            if not args.baseline and path == '/contact/':
                assert len(data['actions']) == 3
                assert all(a['y'] >= 64 and a['bottom'] <= height and a['height'] >= 44 for a in data['actions']), data
                assert data['h1']['opacity'] == '1'
            if not args.baseline and path.startswith('/blog/'):
                assert page.locator('.post-hero img').evaluate('(e)=>e.currentSrc').endswith('.webp')
                assert page.locator('.post-author-cta a[href="/resume"]').count() == 1
                assert page.locator('.post-author-cta a[href="/contact"]').count() == 1
                assert page.get_by_text('The work behind this post', exact=True).count() == 1
                assert page.locator('.post-byline a[href="/resume"]').count() == 2
                # Actual article reader path, not just a source-level annotation check.
                page.locator('.post-author-cta a[href="/resume"]').click()
                page.locator('.post-author-cta a[href="/contact"]').click()
                assert events(page) == []
                page.evaluate("window.scrollTo({top:document.querySelector('.post-author-cta').getBoundingClientRect().top+scrollY-88,behavior:'instant'})")
                page.wait_for_timeout(100)
            label = ('baseline' if args.baseline else 'candidate') + '-' + path.strip('/').replace('/', '-') + f'-{width}x{height}'
            # Reveal below-fold sections before taking a full-page screenshot.
            if path == '/contact/':
                for y in range(0, page.evaluate('document.documentElement.scrollHeight'), 400):
                    page.evaluate('(y)=>window.scrollTo(0,y)', y)
                    page.wait_for_timeout(80)
                page.evaluate('window.scrollTo(0,0)')
                page.wait_for_timeout(650)
            page.screenshot(path=str(out / (label + '.png')), full_page=path == '/contact/')
            records.append({'test': 'dom', 'path': path, 'viewport': [width, height], 'data': data})
            context.close()

    if not args.baseline and not args.tracking_only:
        # JavaScript unavailable: hero and primary actions must be useful anyway.
        for path in ['/contact/', '/resume/']:
            context, page, collect, blocked = setup(java_script_enabled=False, viewport={'width': 360, 'height': 640})
            page.goto(args.base + path)
            page.wait_for_timeout(650)  # Existing CSS-only entrance, no JS observer.
            assert page.locator('h1').evaluate('(e)=>getComputedStyle(e).opacity') == '1'
            if path == '/contact/':
                assert page.locator('.contact-actions a').count() == 3
            records.append({'test': 'no-javascript', 'path': path, 'heroVisible': True})
            context.close()
    browser.close()

result = {'base': args.base, 'baseline': args.baseline, 'tagSha256': hashlib.sha256(tag).hexdigest(), 'browser': 'Chromium via Playwright', 'records': records, 'pageErrors': errors}
(out / ('baseline-checks.json' if args.baseline else 'candidate-checks.json')).write_text(json.dumps(result, indent=2))
assert errors == [], errors
print(json.dumps({'baseline': args.baseline, 'records': len(records), 'pageErrors': len(errors), 'result': 'PASS'}))
