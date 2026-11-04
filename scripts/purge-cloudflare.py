"""Release-only purge; fail closed and emit no credentials/raw responses."""
import json
import os
import urllib.error
import urllib.request

EXPECTED_ZONE = 'a6ab4fd341293a54697d8e4a3990d81e'

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def purge():
    out = {'http': None, 'json_valid': False, 'success': False, 'error_codes': [], 'transport_error': False}
    token = os.environ.get('CF_TOKEN', '')
    zone = os.environ.get('CF_ZONE', '')
    if zone != EXPECTED_ZONE or not token or any(ord(c) < 33 or ord(c) > 126 for c in token):
        out['precondition_failed'] = True
        return out
    try:
        req = urllib.request.Request('https://api.cloudflare.com/client/v4/zones/' + zone + '/purge_cache',
            data=json.dumps({'purge_everything': True}).encode(),
            headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, method='POST')
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        try:
            response = opener.open(req, timeout=25)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            out['http'] = response.code
            raw = response.read(65537)
        if len(raw) > 65536:
            return out
        data = json.loads(raw)
        if not isinstance(data, dict):
            return out
        out['json_valid'] = True
        out['success'] = data.get('success') is True
        errors = data.get('errors', [])
        if isinstance(errors, list):
            out['error_codes'] = [e['code'] for e in errors if isinstance(e, dict) and type(e.get('code')) is int][:8]
    except Exception:
        out['transport_error'] = True
    return out

def main():
    result = purge()
    print('CF_RELEASE_PURGE=' + json.dumps(result, sort_keys=True))
    return 0 if result['http'] == 200 and result['json_valid'] and result['success'] and not result['error_codes'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
