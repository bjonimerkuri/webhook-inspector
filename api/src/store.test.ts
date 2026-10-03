import { describe, expect, it, vi } from 'vitest';
import type { CapturedRequest } from '../../shared/types';
import { Store } from './store';

const req = (id: string): CapturedRequest => ({
  id, receivedAt: new Date().toISOString(), method: 'POST', path: '/hook/x',
  query: {}, headers: {}, body: '', ip: '', size: 0,
});

describe('Store', () => {
  it('returns newest requests first', () => {
    const store = new Store();
    const id = store.create();
    store.add(id, req('a'));
    store.add(id, req('b'));
    expect(store.list(id)?.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('keeps at most 100 requests per endpoint', () => {
    const store = new Store();
    const id = store.create();
    for (let i = 0; i < 120; i++) store.add(id, req(String(i)));
    expect(store.list(id)).toHaveLength(100);
    expect(store.list(id)?.[0].id).toBe('119');
  });

  it('rejects requests for unknown endpoints', () => {
    expect(new Store().add('nope', req('a'))).toBe(false);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const store = new Store();
    const id = store.create();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(id, listener)!;
    store.add(id, req('a'));
    unsubscribe();
    store.add(id, req('b'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('limits the number of endpoints', () => {
    const store = new Store(2);
    store.create();
    store.create();
    expect(() => store.create()).toThrow();
  });

  it('purges expired endpoints', () => {
    const store = new Store();
    const id = store.create();
    expect(store.purgeExpired(1000, Date.now() + 5000)).toBe(1);
    expect(store.list(id)).toBeUndefined();
  });
});
