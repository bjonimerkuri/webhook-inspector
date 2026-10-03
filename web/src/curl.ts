import type { CapturedRequest } from '../../shared/types';

const SKIP = new Set([
  'host', 'content-length', 'connection', 'accept-encoding',
  'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host',
]);

const quote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export function toCurl(r: CapturedRequest, target = 'http://localhost:3000/webhook'): string {
  const lines = [`curl -X ${r.method} ${quote(target)}`];
  for (const [name, value] of Object.entries(r.headers)) {
    if (value === undefined || SKIP.has(name.toLowerCase())) continue;
    lines.push(`  -H ${quote(`${name}: ${Array.isArray(value) ? value.join(', ') : value}`)}`);
  }
  if (r.body) lines.push(`  --data-raw ${quote(r.body)}`);
  return lines.join(' \\\n');
}
