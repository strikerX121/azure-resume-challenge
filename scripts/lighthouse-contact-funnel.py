"""Paired, alternating LOCAL mobile Lighthouse, first-party-only control.
All HTTPS is blocked, so no production analytics events or test leads.
This isolates render/asset changes, not GA network/TBT or field conversions.
Pass installed Lighthouse CLI and Chrome executable explicitly. No npx install.
"""
import argparse
import json
import os
import statistics
import subprocess
from typing import Any
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--cli', required=True)
p.add_argument('--chrome', required=True)
p.add_argument('--artifacts', required=True)
p.add_argument('--runs', type=int, default=3)
a = p.parse_args()
out = Path(a.artifacts)
out.mkdir(parents=True, exist_ok=True)
os.environ['CHROME_PATH'] = a.chrome
pages = {'contact': '/contact/', 'resume': '/resume/', 'train': '/blog/train-copilot-to-write-emails-that-sound-like-you/', 'chefs': '/blog/good-chefs-saute-evenly-copilot-prompt-framework/'}
results = []
for run in range(a.runs):
    for name, path in pages.items():
        for version in (['baseline', 'candidate'] if run % 2 == 0 else ['candidate', 'baseline']):
            port = 4330 if version == 'baseline' else 4331
            target = out / f'lh-{version}-{name}-{run+1}.json'
            cmd = ['node', a.cli, f'http://127.0.0.1:{port}{path}', '--output=json', '--output-path=' + str(target), '--quiet', '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless --no-sandbox --disable-background-networking --disable-component-update --host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"', '--blocked-url-patterns=https://*', '--throttling-method=simulate']
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            (out / (target.stem + '.log')).write_text(proc.stdout + proc.stderr)
            if proc.returncode:
                raise RuntimeError(f'{target.name} exited {proc.returncode}: {proc.stderr[-1000:]}')
            data = json.loads(target.read_text(encoding='utf-8'))
            if data.get('runtimeError'):
                raise RuntimeError(data['runtimeError'])
            audits = data['audits']
            item = {'version': version, 'page': name, 'run': run+1, 'lighthouseVersion': data['lighthouseVersion'], 'scores': {k: v['score'] for k,v in data['categories'].items()}, 'fcp': audits['first-contentful-paint']['numericValue'], 'lcp': audits['largest-contentful-paint']['numericValue'], 'tbt': audits['total-blocking-time']['numericValue'], 'cls': audits['cumulative-layout-shift']['numericValue'], 'bytes': audits['total-byte-weight']['numericValue']}
            results.append(item)
            (out / 'lighthouse-runs.json').write_text(json.dumps(results, indent=2))
            print(json.dumps(item), flush=True)
summary = []
for name in pages:
    item: dict[str, Any] = {'page': name}
    for version in ['baseline', 'candidate']:
        group = [r for r in results if r['page'] == name and r['version'] == version]
        item[version] = {metric: {'median': statistics.median(r[metric] for r in group), 'min': min(r[metric] for r in group), 'max': max(r[metric] for r in group)} for metric in ['fcp', 'lcp', 'tbt', 'cls', 'bytes']}
        item[version]['performance'] = statistics.median(r['scores']['performance'] for r in group)
    summary.append(item)
(out / 'lighthouse-summary.json').write_text(json.dumps({'method': '3 alternating paired local runs per page, mobile defaults, simulated throttling, HTTPS blocked in BOTH variants', 'pages': summary}, indent=2))
print('Finished', len(results), 'Lighthouse runs')
