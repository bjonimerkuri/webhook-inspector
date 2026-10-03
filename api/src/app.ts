import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import type { CapturedRequest } from '../../shared/types';
import { Store } from './store';

export function createApp(store = new Store()) {
  const app = express();
  app.use('/api', cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));

  app.all(['/hook/:id', '/hook/:id/*'], express.raw({ type: () => true, limit: '1mb' }), (req, res) => {
    const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const captured: CapturedRequest = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      query: req.query as Record<string, unknown>,
      headers: req.headers,
      body,
      ip: req.ip ?? '',
      size: Buffer.byteLength(body),
    };
    if (!store.add(req.params.id, captured)) {
      return res.status(404).json({ error: 'Unknown endpoint' });
    }
    res.status(200).json({ ok: true });
  });

  app.post('/api/endpoints', (_req, res) => {
    try {
      res.status(201).json({ id: store.create() });
    } catch {
      res.status(503).json({ error: 'Too many endpoints, try again later' });
    }
  });

  app.get('/api/endpoints/:id/requests', (req, res) => {
    const list = store.list(req.params.id);
    if (!list) return res.status(404).json({ error: 'Unknown endpoint' });
    res.json(list);
  });

  app.delete('/api/endpoints/:id/requests', (req, res) => {
    if (!store.clear(req.params.id)) return res.status(404).json({ error: 'Unknown endpoint' });
    res.status(204).end();
  });

  app.get('/api/endpoints/:id/stream', (req, res) => {
    const unsubscribe = store.subscribe(req.params.id, (r) => {
      res.write(`data: ${JSON.stringify(r)}\n\n`);
    });
    if (!unsubscribe) return res.status(404).json({ error: 'Unknown endpoint' });

    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    res.write(': connected\n\n');

    const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);
    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  return app;
}
