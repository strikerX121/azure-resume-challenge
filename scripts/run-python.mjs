// Probe the actual interpreter/dependency, not platform-specific aliases.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function selectPython(probe = spawnSync, override = process.env.PYTHON) {
  const candidates = override ? [[override, []]] : [['python3', []], ['python', []], ['py', ['-3']]];
  for (const [command, prefix] of candidates) {
    const result = probe(command, [...prefix, '-c', 'import sys; assert sys.version_info >= (3, 9); import playwright.sync_api'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
    if (!result.error && result.status === 0) return { command, prefix };
  }
  throw new Error('Python 3.9+ with Playwright is required. Set PYTHON to its executable path; install Playwright and Chromium in that environment. No packages are installed automatically.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { command, prefix } = selectPython();
    const result = spawnSync(command, [...prefix, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
