import { describe, it, expect } from 'vitest';
import { v4 } from './uuid';

describe('UUID generator', () => {
  it('generates a valid UUID string using crypto.randomUUID', () => {
    const id = v4();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates a valid UUID using Math.random fallback when crypto.randomUUID is not available', () => {
    // Temporarily mock globalThis.crypto to not have randomUUID
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const id = v4();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    } finally {
      // Restore
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });
});
