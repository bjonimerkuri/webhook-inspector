import { useEffect, useState } from 'react';
import type { CapturedRequest } from '../../shared/types';
import { clearRequests, listRequests, streamUrl } from './api';

export type StreamStatus = 'connecting' | 'live' | 'offline' | 'missing';
const MAX = 100;

export function useRequestStream(id: string | null) {
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [status, setStatus] = useState<StreamStatus>('connecting');

  useEffect(() => {
    if (!id) return;
    let closed = false;
    setRequests([]);
    setStatus('connecting');

    const source = new EventSource(streamUrl(id));
    source.onopen = () => setStatus('live');
    source.onerror = () => setStatus('offline');
    source.onmessage = (e) => {
      const incoming: CapturedRequest = JSON.parse(e.data);
      setRequests((prev) => (prev.some((p) => p.id === incoming.id) ? prev : [incoming, ...prev].slice(0, MAX)));
    };

    listRequests(id)
      .then((history) => {
        if (closed) return;
        setRequests((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...history.filter((h) => !seen.has(h.id))]
            .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
            .slice(0, MAX);
        });
      })
      .catch(() => {
        if (closed) return;
        source.close();
        setStatus('missing');
      });

    return () => {
      closed = true;
      source.close();
    };
  }, [id]);

  const clear = async () => {
    if (!id) return;
    await clearRequests(id);
    setRequests([]);
  };

  return { requests, status, clear };
}
