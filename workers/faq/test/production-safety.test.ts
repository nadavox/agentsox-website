import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('production registry safety', () => {
  it('src/clients never imports a test fixture', () => {
    const path = fileURLToPath(new URL('../src/clients/index.ts', import.meta.url));
    const source = readFileSync(path, 'utf8');
    expect(source).not.toMatch(/from\s+['"][^'"]*test/);
  });
});
