"""Offline release regressions. No real credentials or network permitted."""
import contextlib
from email.message import Message
import importlib.util
import io
import json
import os
from pathlib import Path
import socket
import unittest
from unittest.mock import patch
import urllib.error

ROOT = Path(__file__).parent

def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), ROOT / (name + '.py'))
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

purge = load('purge-cloudflare')
headers = load('check-cache-header')

class Response(io.BytesIO):
    def __init__(self, code, body):
        super().__init__(body)
        self.code = code

class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {'CF_TOKEN': 'dummy-test-only-not-a-credential', 'CF_ZONE': purge.EXPECTED_ZONE}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.network = patch.object(socket, 'socket', side_effect=AssertionError('Tests must not use the network'))
        self.network.start()
        self.addCleanup(self.network.stop)

    def run_case(self, code=200, body=b'{"success":true,"errors":[]}'):
        requests = []
        class Opener:
            def open(self, req, timeout):
                requests.append((req, timeout))
                return Response(code, body)
        with patch.object(purge.urllib.request, 'build_opener', return_value=Opener()), contextlib.redirect_stdout(io.StringIO()) as output:
            status = purge.main()
        result = json.loads(output.getvalue().split('=', 1)[1])
        self.assertEqual(len(requests), 1)
        req, timeout = requests[0]
        self.assertEqual(req.get_method(), 'POST')
        self.assertEqual(req.full_url, 'https://api.cloudflare.com/client/v4/zones/' + purge.EXPECTED_ZONE + '/purge_cache')
        self.assertEqual(json.loads(req.data), {'purge_everything': True})
        self.assertEqual(timeout, 25)
        self.assertNotIn(os.environ['CF_TOKEN'], output.getvalue())
        self.assertNotIn('sensitive-response-marker', output.getvalue())
        return status, result

    def test_success(self):
        status, result = self.run_case()
        self.assertEqual(status, 0)
        self.assertTrue(result['success'])

    def test_fail_closed_responses(self):
        cases = [
            (401, b'{"success":false,"errors":[{"code":10000,"message":"sensitive-response-marker"}]}'),
            (403, b'{"success":false}'), (500, b'{"success":true}'),
            (302, b'{"success":true}'), (200, b'<html>sensitive-response-marker</html>'),
            (200, b'[]'), (200, b'null'), (200, b'{}'),
            (200, b'{"success":1}'), (200, b'{"success":"true"}'),
            (200, b'{"success":true,"errors":[{"code":10000}]}'),
            (200, b'x' * 65537),
        ]
        for code, body in cases:
            with self.subTest(code=code, size=len(body)):
                status, _ = self.run_case(code, body)
                self.assertEqual(status, 1)

    def test_preconditions_do_not_open(self):
        for changes in [{'CF_TOKEN': ''}, {'CF_ZONE': ''}, {'CF_ZONE': 'wrong-zone'},
                        {'CF_TOKEN': ' leading'}, {'CF_TOKEN': 'trailing '},
                        {'CF_TOKEN': 'line\nbreak'}, {'CF_TOKEN': 'nonascii-\u00e9'}]:
            with self.subTest(changes=changes), patch.dict(os.environ, changes), patch.object(purge.urllib.request, 'build_opener') as build:
                self.assertTrue(purge.purge()['precondition_failed'])
                build.assert_not_called()

    def test_http_error_sanitized(self):
        error = urllib.error.HTTPError('https://api.cloudflare.com', 401, 'sensitive-response-marker', Message(), io.BytesIO(b'{"success":false,"errors":[{"code":10000}]}'))
        with patch.object(purge.urllib.request, 'build_opener') as build:
            build.return_value.open.side_effect = error
            result = purge.purge()
        self.assertEqual(result['http'], 401)
        self.assertEqual(result['error_codes'], [10000])
        self.assertFalse(result['transport_error'])

    def test_transport_error_sanitized(self):
        with patch.object(purge.urllib.request, 'build_opener') as build:
            build.return_value.open.side_effect = TimeoutError('sensitive-response-marker')
            with contextlib.redirect_stdout(io.StringIO()) as output:
                status = purge.main()
        self.assertEqual(status, 1)
        self.assertNotIn('sensitive-response-marker', output.getvalue())

    def test_redirect_rejected(self):
        self.assertIsNone(purge.NoRedirect().redirect_request(None, None, 307, 'redirect', {}, 'https://example.invalid'))

    def test_error_codes_bounded_and_numeric(self):
        body = json.dumps({'success': False, 'errors': [{'code': i} for i in range(20)] + [{'code': True}, {'code': 'secret'}]}).encode()
        _, result = self.run_case(403, body)
        self.assertEqual(result['error_codes'], list(range(8)))

    def test_header_policy_acceptance(self):
        cases = [
            ('public, max-age=3600', 'public, max-age=3600'),
            ('MAX-AGE=3600, PUBLIC', 'public, max-age=3600'),
            ('public, max-age=0, must-revalidate', 'public, max-age=0, must-revalidate'),
            ('public, max-age=31536000, immutable', 'public, max-age=31536000, immutable'),
        ]
        for actual, expected in cases:
            with self.subTest(actual=actual):
                self.assertTrue(headers.matches(actual, expected))

    def test_header_policy_regressions(self):
        baseline = 'public, max-age=0, must-revalidate'
        cases = [('', baseline), ('public, max-age=14400, must-revalidate', baseline),
                 ('public, max-age=14400', 'public, max-age=3600'),
                 ('public, max-age=36000', 'public, max-age=3600'),
                 ('public, max-age=3600, max-age=14400', 'public, max-age=3600'),
                 ('private, max-age=3600', 'public, max-age=3600'),
                 ('public, no-store, max-age=3600', 'public, max-age=3600'),
                 ('public, max-age=31536000', 'public, max-age=31536000, immutable')]
        for actual, expected in cases:
            with self.subTest(actual=actual):
                self.assertFalse(headers.matches(actual, expected))

    def test_workflow_wiring(self):
        workflow = (ROOT.parent / '.github/workflows/deploy.yml').read_text()
        step = workflow.split('- name: Purge Cloudflare cache', 1)[1].split('# Read the headers', 1)[0]
        self.assertIn('CF_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}', step)
        self.assertIn('CF_ZONE: ${{ secrets.CLOUDFLARE_ZONE_ID }}', step)
        self.assertNotIn('${{', step.split('run: |', 1)[1])
        self.assertIn('python3 scripts/purge-cloudflare.py', step)
        self.assertIn('python3 scripts/test-release-prechecks.py', workflow)
        self.assertLess(workflow.index('python3 scripts/test-release-prechecks.py'), workflow.index('- name: Log in to Azure'))
        self.assertIn('python3 scripts/check-cache-header.py "$got" "$expect"', workflow)
        self.assertIn('CRAWLER_CACHE: \'public, max-age=3600\'', workflow)
        self.assertIn('"$base/robots.txt"                        "$CRAWLER_CACHE"', workflow)
        self.assertIn('"$base/Antonio-Cumberbatch-CV-2026.pdf"   "$BASELINE_CACHE"', workflow)
        self.assertIn('"$base/resume.pdf"                        "$BASELINE_CACHE"', workflow)
        self.assertIn('"$base$asset" "$IMMUTABLE_CACHE"', workflow)
        self.assertIn('sha256sum dist/Antonio-Cumberbatch-CV-2026.pdf', workflow)
        self.assertIn('if [ "$fail" -ne 0 ]; then', workflow)

if __name__ == '__main__':
    unittest.main(verbosity=2)
