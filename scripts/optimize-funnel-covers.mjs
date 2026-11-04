// Compatibility entry point: all formats now come from the canonical SVG
// renderer, not a separate lossy JPEG -> WebP transcode that could drift.
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['scripts/generate-covers.mjs', '--funnel-only'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
