import { beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  get length(): number { return this.values.size; }
}

describe('license request policy', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', new MemoryStorage());
    localStorage.setItem('sb_license:fair-turn', 'test-token');
  });

  it('coalesces 30 concurrent verification attempts into one upstream request', async () => {
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const fetchMock = vi.fn(async () => {
      await waiting;
      return new Response(JSON.stringify({ valid: false, reason: 'invalid' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { verifyLicense } = await import('../src/license');
    const requests = Array.from({ length: 30 }, () => verifyLicense(true));
    release();
    await Promise.all(requests);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('honors Retry-After after a 429 without another upstream request', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 429, headers: { 'Retry-After': '60' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { verifyLicense } = await import('../src/license');
    await expect(verifyLicense(true)).resolves.toMatchObject({ valid: false, reason: 'rate_limited' });
    await expect(verifyLicense(true)).resolves.toMatchObject({ valid: false, reason: 'rate_limited' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
