import { describe, it, expect } from 'vitest';
import path from 'path';
import { spawnSync } from 'child_process';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');

describe('i18n Missing Keys Check', () => {
  it('should not report missing i18n keys', () => {
    const result = spawnSync(process.execPath, ['scripts/verify-i18n.js'], {
      cwd: FRONTEND_ROOT,
      encoding: 'utf-8',
      stdio: 'ignore',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
  });
});
