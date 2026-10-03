import { randomBytes } from 'node:crypto';
import type { CapturedRequest } from '../../shared/types';

const MAX_REQUESTS_PER_ENDPOINT = 100;

type Listener = (request: CapturedRequest) => void;

interface Endpoint {
  createdAt: number;
  requests: CapturedRequest[];
  listeners: Set<Listener>;
}

export class Store {
  private endpoints = new Map<string, Endpoint>();

  constructor(private readonly maxEndpoints = 1000) {}

  create(): string {
    if (this.endpoints.size >= this.maxEndpoints) throw new Error('Too many endpoints');
    const id = randomBytes(6).toString('hex');
    this.endpoints.set(id, { createdAt: Date.now(), requests: [], listeners: new Set() });
    return id;
  }

  list(id: string): CapturedRequest[] | undefined {
    const ep = this.endpoints.get(id);
    return ep ? [...ep.requests] : undefined;
  }

  add(id: string, request: CapturedRequest): boolean {
    const ep = this.endpoints.get(id);
    if (!ep) return false;
    ep.requests.unshift(request);
    if (ep.requests.length > MAX_REQUESTS_PER_ENDPOINT) ep.requests.length = MAX_REQUESTS_PER_ENDPOINT;
    ep.listeners.forEach((notify) => notify(request));
    return true;
  }

  clear(id: string): boolean {
    const ep = this.endpoints.get(id);
    if (!ep) return false;
    ep.requests = [];
    return true;
  }

  subscribe(id: string, listener: Listener): (() => void) | undefined {
    const ep = this.endpoints.get(id);
    if (!ep) return undefined;
    ep.listeners.add(listener);
    return () => ep.listeners.delete(listener);
  }

  purgeExpired(ttlMs: number, now = Date.now()): number {
    let removed = 0;
    for (const [id, ep] of this.endpoints) {
      if (now - ep.createdAt > ttlMs) {
        this.endpoints.delete(id);
        removed++;
      }
    }
    return removed;
  }
}
