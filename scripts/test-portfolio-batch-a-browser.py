"""Local Astro preview only. Block writes/analytics BEFORE any navigation."""
import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--artifacts', required=True)
parser.add_argument('--home-only', action='store_true')
args = parser.parse_args()
out = Path(args.artifacts)
out.mkdir(parents=True, exist_ok=True)
base = 'http://127.0.0.1:4331'
routes = ['/'] if args.home_only else ['/', '/work/sassi/', '/work/3-stripes-tech/', '/services/', '/contact/']
cases, failures, errors, blocked, bad_assets, journeys = [], [], [], [], [], []
screenshots = []

def check(ok, message):
    if not ok: failures.append(message)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for javascript in [True, False]:
        for width, height in [(320, 740), (390, 844), (1440, 900)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, java_script_enabled=javascript, service_workers='block')
            def guard(r):
                u = urlsplit(r.request.url)
                if u.scheme == 'http' and u.netloc == '127.0.0.1:4331' and r.request.method in ['GET', 'HEAD'] and not re.search(r'/api/|collect|analytics|telemetry', u.path, re.I):
                    r.continue_()
                else:
                    blocked.append({'host': u.netloc, 'path': u.path, 'method': r.request.method})
                    r.abort()
            context.route('**/*', guard)
            context.route_web_socket('**/*', lambda ws: ws.close())
            page = context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: bad_assets.append({'url':r.url,'status':r.status}) if r.url.startswith(base) and r.status >= 400 else None)
            for route in routes:
                key = f'{route}-{width}-js-{javascript}'
                slug = route.strip('/').replace('/', '-') or 'home'
                page.goto(base + route, wait_until='networkidle')
                page.wait_for_timeout(350)
                check(urlsplit(page.url).path == route, key + ': route identity')
                # Existing software images remain untouched, but are masked in
                # retained evidence. Image loading is checked independently.
                masks = page.locator('img[alt^="SASSI client portal"], img[alt^="SASSI admin portal"]')
                def capture(name, stage):
                    identity = page.evaluate("() => ({path:location.pathname,title:document.title,h1:document.querySelector('h1').textContent,width:innerWidth,scrollY})")
                    check(identity['path'] == route, key + ': screenshot route ' + stage)
                    page.screenshot(path=str(out / name), mask=[masks])
                    screenshots.append(identity | {'file':name,'stage':stage,'javascript':javascript})
                proof = page.evaluate("""() => ({path:location.pathname,title:document.title,h1:document.querySelector('h1').textContent,viewW:innerWidth,docW:document.documentElement.scrollWidth})""")
                screenshot = f'{slug}-{width}-js-{javascript}-initial.png'
                capture(screenshot, 'initial')
                proof['screenshot'] = screenshot
                if route == '/':
                    actions = []
                    for label in ['Discuss your project', 'See relevant work']:
                        a = page.get_by_role('link', name=label, exact=True).first
                        box = a.bounding_box()
                        visible = a.evaluate("e => {let n=e; while(n){if(getComputedStyle(n).opacity==='0'||getComputedStyle(n).visibility==='hidden')return false;n=n.parentElement;}return true}")
                        actions.append({'label':label,'box':box,'visible':visible})
                        if label == 'Discuss your project' or width != 320:
                            check(box and box['y'] >= 0 and box['y'] + box['height'] <= height and visible, key + ': initial action ' + label)
                    proof['actions'] = actions
                # Exercise reveal on the actual scroll path and capture final CTA.
                if javascript:
                    page.evaluate('window.scrollTo(0, 0)')
                    for y in range(0, page.evaluate('document.documentElement.scrollHeight'), max(400, height - 150)):
                        page.evaluate('(y) => window.scrollTo(0,y)', y)
                        page.wait_for_timeout(45)
                if route.startswith('/work/'):
                    selector = 'a[data-track-context="work-sassi-cta"]' if 'sassi' in route else 'a[data-track-context="work-3-stripes-tech-cta"]'
                    a = page.locator(selector)
                    # Pin the whole closing section below the fixed header,
                    # not just an inline CTA at the top edge of the viewport.
                    a.evaluate("e => window.scrollTo({top:e.closest('section').getBoundingClientRect().top + scrollY - 76, behavior:'instant'})")
                    page.wait_for_timeout(350)
                    check(a.get_attribute('href') == '/contact', key + ': consulting destination')
                    check(a.evaluate("e => {let n=e;while(n){if(getComputedStyle(n).opacity==='0')return false;n=n.parentElement;}return true}"), key + ': CTA opacity')
                    capture(f'{slug}-{width}-js-{javascript}-cta.png', 'cta')
                    if javascript:
                        a.click()
                        check(urlsplit(page.url).path.rstrip('/') == '/contact', key + ': actual contact journey')
                        journeys.append({'source':route,'width':width,'destination':urlsplit(page.url).path})
                        page.goto(base + route, wait_until='networkidle')
                    if '3-stripes' in route:
                        product = page.get_by_role('link', name='Evaluate the EMR at 3ST', exact=True)
                        check(product.get_attribute('href') == 'https://www.3stripestech.com/pricing', key + ': product route')
                        if javascript:
                            before = len(blocked)
                            with context.expect_page() as popup:
                                product.click()
                            popup.value.wait_for_timeout(300)
                            check(any(r['host'] == 'www.3stripestech.com' and r['path'] == '/pricing' for r in blocked[before:]), key + ': intercepted product journey')
                            popup.value.close()
                            journeys.append({'source':route,'width':width,'destination':'https://www.3stripestech.com/pricing','intercepted':True})
                    glance = page.get_by_role('heading', name='At a glance', exact=True)
                    glance.evaluate("e => window.scrollTo({top:e.getBoundingClientRect().top + scrollY - 88,behavior:'instant'})")
                    page.wait_for_timeout(200)
                    capture(f'{slug}-{width}-js-{javascript}-roles.png', 'roles')
                # All visible page copy must remain readable with JS disabled.
                if not javascript:
                    invisible = page.locator('main').evaluate("""e => [...e.querySelectorAll('h1,h2,h3,p,a')].filter(x => x.textContent.trim() && (()=>{let n=x;while(n){if(getComputedStyle(n).opacity==='0')return true;n=n.parentElement;}return false})()).map(x=>x.textContent.trim().slice(0,60))""")
                    check(not invisible, key + ': no-JS hidden copy ' + repr(invisible[:5]))
                geometry = page.evaluate("""() => ({width:innerWidth,docW:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.left < -1 || r.right > innerWidth+1)}).slice(0,12).map(e=>({tag:e.tagName,text:e.textContent.slice(0,45)})),broken:[...document.images].filter(i=>i.src.startsWith(location.origin)&&i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))})""")
                check(geometry['docW'] <= width and not geometry['overflow'], key + ': overflow ' + repr(geometry))
                check(not geometry['broken'], key + ': broken images')
                page.evaluate('window.scrollTo(0, 500)')
                page.wait_for_timeout(150)
                capture(f'{slug}-{width}-js-{javascript}-scrolled.png', 'scrolled')
                proof['geometry'] = geometry
                cases.append(proof | {'javascript': javascript, 'width': width})
            context.close()
    browser.close()
check(not errors, 'page errors: ' + repr(errors))
check(not bad_assets, 'local HTTP errors: ' + repr(bad_assets))
result = {'result':'FAIL' if failures else 'PASS','cases':cases,'failures':failures,'pageErrors':errors,'badAssets':bad_assets,'blockedRequests':blocked,'journeys':journeys,'boundary':'Loopback Astro production preview only; external requests, writes and sockets intercepted before navigation. No live backend acceptance, mail, booking or analytics delivery tested.'}
(out / 'browser-checks.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
(out / 'screenshot-route-proof.json').write_text(json.dumps(screenshots, indent=2), encoding='utf-8')
print(json.dumps({'result':result['result'],'cases':len(cases),'failures':failures,'pageErrors':errors}, indent=2))
raise SystemExit(bool(failures))
