"""Built-page and real Chromium regression for the portfolio EMR referral only.
Run after npm run build; serve dist at http://127.0.0.1:4331.
All external requests and all non-GET/HEAD requests are blocked before navigation.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from typing import Any, Iterator
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

DESCRIPTION = "Explore 3ST's electronic medical records and clinic-management software. Visit the product site for current plans and rollout options."
ENGAGEMENT = "Review current plans and discuss your clinic's rollout with 3ST."
CTA = 'View 3ST plans and rollout options'
URL = 'https://www.3stripestech.com/pricing'
NAME = '3 Stripes Tech EMR'
OBSOLETE = re.compile(r'99|25[- ]day|trial|UnitPriceSpecification|user.per.month', re.I)

class JsonLd(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = []
        self.active = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'script' and dict(attrs).get('type') == 'application/ld+json':
            self.active = True
            self.parts = []

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.active:
            self.blocks.append(json.loads(''.join(self.parts)))
            self.active = False


def walk(value: Any) -> Iterator[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--artifacts', required=True)
    args = parser.parse_args()
    out = Path(args.artifacts)
    out.mkdir(parents=True, exist_ok=True)
    parsed = JsonLd()
    parsed.feed(Path('dist/services/index.html').read_text(encoding='utf-8'))
    nodes = list(walk(parsed.blocks))
    lists = [n for n in nodes if n.get('@type') == 'ItemList']
    referrals = [n for n in nodes if n.get('@type') == 'Service' and n.get('name') == NAME]
    assert len(lists) == 1 and len(lists[0]['itemListElement']) == 4
    assert len(referrals) == 1
    emr = referrals[0]
    assert lists[0]['itemListElement'][1] == {'@type': 'ListItem', 'position': 2, 'item': emr}
    assert emr == {'@type': 'Service', 'name': NAME, 'description': DESCRIPTION + ' ' + ENGAGEMENT, 'url': URL}
    assert not OBSOLETE.search(json.dumps(emr))
    assert not any(k in n for n in walk(emr) for k in ['offers', 'price', 'priceSpecification', 'priceCurrency', 'availability'])
    # Compare untouched service items and page-owned graphs to the actual base
    # revision, not to a hand-translated fixture. This is source parity evidence,
    # separate from the browser assertions below.
    program = """const cp=require('child_process'),vm=require('vm');
const source=cp.execFileSync('git',['show','dd2af950f9ffc17cac01d34f78fc7884c0535a3b:src/pages/services.astro'],{encoding:'utf8'});
const code=source.split('---')[1].replace(/^import .*;$/mg,'');
console.log(JSON.stringify(vm.runInNewContext(code+';({serviceSchema,orgSchema,breadcrumbSchema,frameworkSchema,faqSchema})')));"""
    baseline = json.loads(subprocess.check_output(['node', '-e', program], text=True))
    for i in [0, 2, 3]:
        assert lists[0]['itemListElement'][i] == baseline['serviceSchema']['itemListElement'][i]
    for key in ['orgSchema', 'breadcrumbSchema', 'frameworkSchema', 'faqSchema']:
        assert baseline[key] in parsed.blocks, key
    assert any(n.get('@type') == 'Person' for n in nodes)
    assert any(n.get('@type') == 'WebSite' for n in nodes)
    cv = {}
    for root in ['public', 'dist']:
        for name in ['Antonio-Cumberbatch-CV-2026.pdf', 'resume.pdf']:
            p = Path(root) / name
            before = subprocess.check_output(['git', 'show', 'dd2af950f9ffc17cac01d34f78fc7884c0535a3b:public/' + name])
            assert p.read_bytes() == before
            cv[str(p)] = {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(before).hexdigest()}
    cases, errors, blocked = [], [], []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for javascript in [True, False]:
            for width in [320, 360, 390, 768, 820, 1024, 1280]:
                context = browser.new_context(viewport={'width': width, 'height': 900}, java_script_enabled=javascript, service_workers='block')
                def route(r):
                    u = urlsplit(r.request.url)
                    if u.scheme == 'http' and u.netloc == '127.0.0.1:4331' and r.request.method in ['GET', 'HEAD']:
                        r.continue_()
                    else:
                        blocked.append({'host': u.netloc, 'method': r.request.method})
                        r.abort()
                context.route('**/*', route)
                page = context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto('http://127.0.0.1:4331/services/', wait_until='networkidle')
                card = page.locator('main h2').filter(has_text=NAME).locator('../..')
                assert card.count() == 1
                card.scroll_into_view_if_needed()
                page.wait_for_timeout(800)
                text = card.inner_text()
                assert DESCRIPTION in text and ENGAGEMENT in text
                assert not OBSOLETE.search(text)
                assert '\u2014' not in text
                link = card.get_by_role('link', name=CTA, exact=True)
                assert link.get_attribute('href') == URL
                assert link.get_attribute('target') == '_blank'
                assert link.get_attribute('rel') == 'noopener noreferrer'
                assert link.get_attribute('data-track') is None
                demo = card.locator('a[href="mailto:antonio.cumberbatch@3stripestech.com"]')
                assert demo.count() == 1 and 'arrange a demo directly.' in text
                # Element containment catches clipping hidden by overflow:hidden,
                # not merely document-wide horizontal scroll.
                geometry = card.evaluate("""e => {const b=e.getBoundingClientRect(); return {
                  opacity:getComputedStyle(e).opacity, width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
                  overflows:[...e.querySelectorAll('a,p')].filter(x=>{const r=x.getBoundingClientRect();return r.left<b.left-1 || r.right>b.right+1 || x.scrollWidth>x.clientWidth+1}).map(x=>({tag:x.tagName,text:x.textContent.trim(),width:x.clientWidth,scrollWidth:x.scrollWidth}))
                }}""")
                cases.append({'javascript': javascript, 'width': width, 'geometry': geometry})
                page.screenshot(path=str(out / f'services-{width}-js-{javascript}.png'), full_page=False)
                assert geometry['opacity'] == '1', geometry
                assert geometry['scrollWidth'] == width and not geometry['overflows'], geometry
                if width == 320 and not javascript:
                    # Capture the whole card in document coordinates, avoiding
                    # a viewport crop through its heading or demo note.
                    page.evaluate('window.scrollTo(0, 0)')
                    page.screenshot(path=str(out / 'emr-card-320-no-js.png'), full_page=True, clip=card.bounding_box())
                context.close()
        browser.close()
    assert not errors, errors
    result = {'result': 'PASS', 'jsonLdBlocks': len(parsed.blocks), 'itemLists': len(lists), 'serviceItems': 4, 'emr': emr, 'cv': cv, 'cases': cases, 'pageErrors': errors, 'blockedRequests': blocked}
    (out / 'emr-checks.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps({'result': 'PASS', 'browserCases': len(cases), 'jsonLdBlocks': len(parsed.blocks), 'pageErrors': len(errors)}))

if __name__ == '__main__':
    main()
