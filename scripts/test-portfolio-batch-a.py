"""Offline emitted-HTML regressions for local portfolio batch A. Build first."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, route):
        super().__init__()
        self.text, self.links, self.schemas = [], [], []
        self.main = False
        self.skip = None
        self.ld = False
        self.parts = []
        self.feed((ROOT / 'dist' / route / 'index.html').read_text(encoding='utf-8'))
        self.visible = ' '.join(' '.join(self.text).split())

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main': self.main = True
        if tag in ('script', 'style'):
            self.skip = tag
            self.ld = a.get('type') == 'application/ld+json'
            self.parts = []
        if tag == 'a' and self.main: self.links.append(a)

    def handle_endtag(self, tag):
        if tag == 'main': self.main = False
        if tag == self.skip:
            if self.ld: self.schemas.append(json.loads(''.join(self.parts)))
            self.skip, self.ld = None, False

    def handle_data(self, data):
        if self.ld: self.parts.append(data)
        if self.main and not self.skip: self.text.append(data)

class BatchA(unittest.TestCase):
    def test_sassi_client_delivery_roles_and_status(self):
        p = Page('work/sassi')
        for text in ['Client delivery', 'Antonio-led, team-delivered', 'Project management', 'cloud architecture', 'customer success', 'Naeem', 'Rakib', 'Delivered workflow', 'Evidence reviewed: November 10, 2026', 'reported', 'client review', 'Discuss a similar workflow or delivery role']:
            self.assertIn(text, p.visible)
        self.assertNotRegex(p.visible, r'(?i)200\+|active users|managed by ARC|built entirely by ARC|came to ARC|fully managed SaaS|without Antonio|currently in active development')
        self.assertTrue(any(a.get('href') == '/contact' and a.get('data-track-context') == 'work-sassi-cta' for a in p.links))
        self.assertIn("Client's shipping website", p.visible)
        raw = (ROOT / 'dist/work/sassi/index.html').read_text(encoding='utf-8')
        self.assertNotIn('How ARC Cloud Consulting built', raw)
        work = [s for s in p.schemas if s.get('@type') == 'CreativeWork']
        self.assertEqual(len(work), 1)
        self.assertEqual(work[0]['creator'], {'@type':'Person', 'name':'Antonio Cumberbatch', 'url':'https://www.antoniocumberbatch.com'})

    def test_emr_faq_and_routes(self):
        p = Page('work/3-stripes-tech')
        faqs = [s for s in p.schemas if s.get('@type') == 'FAQPage']
        self.assertEqual(len(faqs), 1)
        for q in faqs[0]['mainEntity']:
            self.assertIn(q['name'], p.visible)
            self.assertIn(q['acceptedAnswer']['text'], p.visible)
        self.assertNotRegex(p.visible + json.dumps(faqs), r'(?i)\$99|25[- ]day|free trial|founding partner|founding rate|per user per month')
        for text in ['Co-founded product', 'Delivered workflow', 'Evidence reviewed: November 10, 2026', 'Antonio', 'Naeem', 'Rakib', 'reported', 'Evaluate the EMR', 'Discuss architecture or team delivery']:
            self.assertIn(text, p.visible)
        self.assertTrue(any(a.get('href') == 'https://www.3stripestech.com/pricing' for a in p.links))
        self.assertTrue(any(a.get('href') == '/contact' and a.get('data-track-context') == 'work-3-stripes-tech-cta' for a in p.links))
        self.assertNotIn('eliminated the impact on real users entirely', p.visible)
        work = [s for s in p.schemas if s.get('@type') == 'CreativeWork']
        self.assertEqual(work[0]['creator']['name'], 'Antonio Cumberbatch')

    def test_collaboration_guidance_and_preserved_behaviour(self):
        for route in ['', 'services', 'contact']:
            p = Page(route)
            self.assertIn('collaboration', p.visible.lower())
            self.assertIn('existing team', p.visible.lower())
        p = Page('contact')
        self.assertIn('Nothing is sent from this page', p.visible)
        self.assertTrue(any(a.get('href') == 'https://calendar.app.google/hxSqa4yRVmLW5fubA' for a in p.links))
        # Preserve exact contact script, fields, booking targets and shared logic.
        for name in ['src/layouts/BaseLayout.astro', 'src/styles/global.css', 'package-lock.json']:
            before = subprocess.check_output(['git', 'show', '46986ef82db0f3d93d1be041a6144e76e11bf825:' + name], cwd=ROOT)
            self.assertEqual((ROOT / name).read_bytes().replace(b'\r\n', b'\n'), before.replace(b'\r\n', b'\n'))
        source = (ROOT / 'src/pages/contact.astro').read_text(encoding='utf-8')
        before = subprocess.check_output(['git', 'show', '46986ef82db0f3d93d1be041a6144e76e11bf825:src/pages/contact.astro'], cwd=ROOT, text=True)
        self.assertEqual(source[source.index('<script>'):], before[before.index('<script>'):])

    def test_download_bytes(self):
        for root in ['public', 'dist']:
            for name in ['Antonio-Cumberbatch-CV-2026.pdf', 'resume.pdf']:
                self.assertEqual(hashlib.sha256((ROOT / root / name).read_bytes()).hexdigest(), 'a7afbd123e6edca84bcdef7d902e44f91432ef40779e7e7496c36fb4b06da1a4')

    def test_other_case_creators_keep_existing_default(self):
        for slug in ['arc-portfolio', 'esvd-dashboard', 'jimny-shop', 'qualitech', 'wiman-dlp']:
            work = [s for s in Page('work/' + slug).schemas if s.get('@type') == 'CreativeWork']
            self.assertEqual(work[0]['creator'], {'@type':'Organization','name':'ARC Cloud Consulting','url':'https://www.arccloudconsulting.com'})

if __name__ == '__main__': unittest.main()
