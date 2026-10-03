import { useEffect, useState } from 'react';
import { createEndpoint, hookUrl } from './api';
import { toCurl } from './curl';
import { useRequestStream } from './useRequestStream';

const copy = (text: string) => navigator.clipboard.writeText(text);

function pretty(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export default function App() {
  const [id, setId] = useState<string | null>(() => localStorage.getItem('endpointId'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [method, setMethod] = useState('ALL');
  const [query, setQuery] = useState('');
  const { requests, status, clear } = useRequestStream(id);

  async function newEndpoint() {
    const created = await createEndpoint();
    localStorage.setItem('endpointId', created);
    setSelectedId(null);
    setId(created);
  }

  useEffect(() => {
    if (!id || status === 'missing') newEndpoint().catch(console.error);
  }, [id, status]);

  const methods = ['ALL', ...Array.from(new Set(requests.map((r) => r.method)))];
  const filtered = requests.filter(
    (r) =>
      (method === 'ALL' || r.method === method) &&
      `${r.path} ${r.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0];

  return (
    <div className="app">
      <header>
        <h1>Webhook Inspector</h1>
        <span className={`status ${status}`}>{status}</span>
      </header>

      {id && (
        <section className="url">
          <code>{hookUrl(id)}</code>
          <button onClick={() => copy(hookUrl(id))}>Copy URL</button>
          <button onClick={newEndpoint}>New endpoint</button>
          <button onClick={clear}>Clear</button>
        </section>
      )}

      <section className="filters">
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {methods.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input placeholder="Search path or body" value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>

      <main>
        <ul className="list">
          {filtered.length === 0 && <li className="empty">Waiting for requests… send one to the URL above.</li>}
          {filtered.map((r) => (
            <li key={r.id} className={r.id === selected?.id ? 'active' : ''} onClick={() => setSelectedId(r.id)}>
              <b className={`method ${r.method}`}>{r.method}</b>
              <span className="path">{r.path.replace(/^\/hook\/[^/?]+/, '') || '/'}</span>
              <time>{new Date(r.receivedAt).toLocaleTimeString()}</time>
            </li>
          ))}
        </ul>

        <article className="detail">
          {selected ? (
            <>
              <div className="actions">
                <button onClick={() => copy(toCurl(selected))}>Copy as cURL</button>
                <button onClick={() => copy(pretty(selected.body))}>Copy body</button>
                <span>{selected.size} bytes · {selected.ip}</span>
              </div>
              <h3>Headers</h3>
              <table>
                <tbody>
                  {Object.entries(selected.headers).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td>{Array.isArray(v) ? v.join(', ') : v}</td></tr>
                  ))}
                </tbody>
              </table>
              <h3>Body</h3>
              <pre>{selected.body ? pretty(selected.body) : '(empty)'}</pre>
            </>
          ) : (
            <p className="empty">Select a request to inspect it.</p>
          )}
        </article>
      </main>
    </div>
  );
}
