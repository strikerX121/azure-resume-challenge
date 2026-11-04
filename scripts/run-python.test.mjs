import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectPython } from './run-python.mjs';

for (const available of ['python3', 'python', 'py']) {
  test(`selects ${available} only when the dependency probe succeeds`, () => {
    const calls = [];
    const selected = selectPython((command, args) => {
      calls.push([command, args]);
      return { status: command === available ? 0 : 1 };
    }, '');
    assert.equal(selected.command, available);
    if (available === 'py') assert.deepEqual(selected.prefix, ['-3']);
    assert.ok(calls.every(([, args]) => args.at(-1).includes('playwright.sync_api')));
  });
}
test('explicit executable path with spaces is not shell-split', () => {
  const command = 'C:/Python With Spaces/python.exe';
  assert.equal(selectPython((cmd) => ({ status: cmd === command ? 0 : 1 }), command).command, command);
});
test('unavailable dependencies fail with an actionable message', () => {
  assert.throws(() => selectPython(() => ({ error: new Error('ENOENT') }), ''), /Set PYTHON/);
});
