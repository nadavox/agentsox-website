import { describe, expect, it } from 'vitest';
import { allowedOriginsCsv, clientOrigins, isOriginAllowedForClient } from '../src/lib/cors';
import { acmeFixture, fixtureRegistry } from './fixtures/registry';

describe('cors - single source of truth from the registry', () => {
  it('union of client origins in production (no localhost)', () => {
    const csv = allowedOriginsCsv(fixtureRegistry, 'production');
    expect(csv.split(',').sort()).toEqual(['https://acme.test', 'https://other.test']);
  });

  it('adds dev origins off-production', () => {
    const csv = allowedOriginsCsv(fixtureRegistry, 'local');
    expect(csv).toContain('http://localhost:5174');
    expect(csv).toContain('https://acme.test');
  });

  it('binds a client to its own origins in production', () => {
    expect(isOriginAllowedForClient(acmeFixture, 'https://acme.test', 'production')).toBe(true);
    expect(isOriginAllowedForClient(acmeFixture, 'https://other.test', 'production')).toBe(false);
    expect(isOriginAllowedForClient(acmeFixture, 'http://localhost:5174', 'production')).toBe(false);
  });

  it('accepts localhost for a client only off-production', () => {
    expect(isOriginAllowedForClient(acmeFixture, 'http://localhost:5174', 'local')).toBe(true);
    expect(clientOrigins(acmeFixture, 'local')).toContain('http://127.0.0.1:5174');
  });
});
