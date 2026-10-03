import type { CapturedRequest } from '../../shared/types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const hookUrl = (id: string) => `${API}/hook/${id}`;
export const streamUrl = (id: string) => `${API}/api/endpoints/${id}/stream`;

export async function createEndpoint(): Promise<string> {
  const res = await fetch(`${API}/api/endpoints`, { method: 'POST' });
  if (!res.ok) throw new Error('Could not create endpoint');
  return (await res.json()).id;
}

export async function listRequests(id: string): Promise<CapturedRequest[]> {
  const res = await fetch(`${API}/api/endpoints/${id}/requests`);
  if (!res.ok) throw new Error('Unknown endpoint');
  return res.json();
}

export async function clearRequests(id: string): Promise<void> {
  await fetch(`${API}/api/endpoints/${id}/requests`, { method: 'DELETE' });
}
