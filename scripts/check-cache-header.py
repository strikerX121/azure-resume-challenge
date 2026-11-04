"""Check exact Cache-Control directive values, not substring lookalikes."""
import sys


def directives(value):
    parsed = {}
    for part in value.lower().split(','):
        key, separator, item = part.strip().partition('=')
        key = key.strip()
        if not key or key in parsed:
            raise ValueError('empty or duplicate cache directive')
        parsed[key] = item.strip().strip('"') if separator else None
    return parsed


def matches(actual, expected):
    try:
        actual, expected = directives(actual), directives(expected)
    except ValueError:
        return False
    if {'private', 'no-store', 'no-cache'} & actual.keys():
        return False
    return all(key in actual and actual[key] == value for key, value in expected.items())


if __name__ == '__main__':
    raise SystemExit(0 if len(sys.argv) == 3 and matches(sys.argv[1], sys.argv[2]) else 1)
