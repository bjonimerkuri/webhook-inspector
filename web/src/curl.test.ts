import { describe, expect, it } from 'vitest';
import type { CapturedRequest } from '../../shared/types';
import { toCurl } from './curl';

const base: CapturedRequest = {
  id: '1', receivedAt: '', method: 'POST', path: '/hook/x', query: {}, ip: '', size: 10,
  headers: { host: 'example.com', 'content-type': 'application/json', 'content-length': '10', 'x-multi': ['a', 'b'] },
  body: `{"name":"O'Brien"}`,
};

describe('toCurl', () => {
  it('includes method, target, headers and body', () => {
    const curl = toCurl(base, 'http://localhost:4000/hook');
    expect(curl).toContain("curl -X POST 'http://localhost:4000/hook'");
    expect(curl).toContain("-H 'content-type: application/json'");
    expect(curl).toContain('--data-raw');
  });

  it('skips headers curl should compute itself', () => {
    const curl = toCurl(base);
    expect(curl).not.toContain('content-length');
    expect(curl).not.toContain('host:');
  });

  it('escapes single quotes in the body', () => {
    expect(toCurl(base)).toContain(`O'\\''Brien`);
  });

  it('joins array header values', () => {
    expect(toCurl(base)).toContain('x-multi: a, b');
  });

  it('omits the body flag for empty bodies', () => {
    expect(toCurl({ ...base, body: '' })).not.toContain('--data-raw');
  });
});
