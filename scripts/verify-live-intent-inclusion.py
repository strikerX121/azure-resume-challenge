"""Read-only live HTML inclusion check. Never runs production JavaScript.
Requires requests. Stores raw public HTML, script hashes and exact local match.
"""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
import requests

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.current = {'attrs': dict(attrs), 'body': ''}
    def handle_data(self, data):
        if self.current is not None:
            self.current['body'] += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.current is not None:
            self.scripts.append(self.current)
            self.current = None

def scripts(text):
    p = Scripts()
    p.feed(text)
    return p.scripts

p = argparse.ArgumentParser()
p.add_argument('--artifacts', required=True)
p.add_argument('--reuse', action='store_true', help='Analyze previously saved HTML instead of fetching')
a = p.parse_args()
out = Path(a.artifacts)
out.mkdir(parents=True, exist_ok=True)
paths = ['/contact/', '/resume/', '/blog/train-copilot-to-write-emails-that-sound-like-you/', '/blog/good-chefs-saute-evenly-copilot-prompt-framework/']
records = []
for path in paths:
    name = path.strip('/').replace('/', '-')
    target = out / ('live-' + name + '.html')
    if not a.reuse:
        response = requests.get('https://www.antoniocumberbatch.com' + path, timeout=30)
        response.raise_for_status()
        target.write_bytes(response.content)
    raw = target.read_bytes()
    live = scripts(raw.decode())
    local = scripts((out / 'baseline-dist' / path.strip('/') / 'index.html').read_text())
    hook = next(s for s in live if 'arcTrack' in s['body'] and 'contact_intent' in s['body'])
    baseline_hook = next(s for s in local if 'arcTrack' in s['body'] and 'contact_intent' in s['body'])
    config = next(s for s in live if 'dataLayer.push(arguments)' in s['body'])
    record = {'url': 'https://www.antoniocumberbatch.com' + path, 'htmlSha256': hashlib.sha256(raw).hexdigest(), 'hookIncluded': True, 'hookMatchesBaseline': hook == baseline_hook, 'hookSha256': hashlib.sha256(hook['body'].encode()).hexdigest(), 'configScriptType': config['attrs'].get('type'), 'configAssignsWindowGtag': 'window.gtag=' in config['body'], 'configBody': config['body'], 'tagIncluded': any('googletagmanager.com/gtag/js?id=G-B7EJB7Y1HL' in s['attrs'].get('src', '') for s in live)}
    records.append(record)
assert len(records) == len(paths)
(out / 'live-inclusion-analysis.json').write_text(json.dumps(records, indent=2))
print(json.dumps(records, indent=2))
