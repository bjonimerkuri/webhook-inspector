# Webhook Inspector (React + Node.js + TypeScript)

A tiny tool for debugging webhooks, in the spirit of webhook.site. You get a unique URL; anything sent to it (any method, any path, any body) shows up **live** in the UI, where you can inspect headers and body, filter, and copy the request as a cURL command.

Useful when integrating a payment provider, GitHub, Stripe or any service that calls your backend and you need to see exactly what it sends.

## What it demonstrates
- **Real-time updates with Server-Sent Events (SSE):** new requests are pushed to the browser as they arrive, with automatic reconnection built into `EventSource`.
- **Race-free loading:** the UI opens the stream first, then loads history, and merges by request id, so a request that arrives in between is neither lost nor duplicated.
- **Raw body capture:** `express.raw` keeps the body exactly as sent, whatever the content type (JSON, form, XML, plain text).
- **Shared types:** `shared/types.ts` is imported by both the API and the web app, so the contract can't drift.
- **Bounded by design:** capped requests per endpoint, capped number of endpoints, 1 MB body limit, and a TTL cleanup job.
- **Tests:** unit tests for the store and the cURL builder, plus HTTP tests with supertest.

## Stack
Node.js · Express · TypeScript · React · Vite · SSE · Vitest · Supertest

## Architecture
```
 external service ──POST /hook/:id/...──▶  Express API ──▶ in-memory Store
                                              │                │ notify subscribers
 browser (React) ◀────── SSE stream ──────────┘◀───────────────┘
        │
        └──GET history / DELETE clear / POST new endpoint──▶ Express API
```

## Run locally
```bash
cd api && npm install && npm run dev      # http://localhost:3001
cd web && npm install && npm run dev      # http://localhost:5173
cd api && npm test && cd ../web && npm test
```
Open the UI, copy the URL, then:
```bash
curl -X POST "<your-url>/orders?source=demo" -H "Content-Type: application/json" -d '{"amount": 42}'
```

## API
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/endpoints` | Create an endpoint, returns `{ id }` |
| ANY | `/hook/:id` and `/hook/:id/*` | Receive and store a request |
| GET | `/api/endpoints/:id/requests` | History (newest first, max 100) |
| DELETE | `/api/endpoints/:id/requests` | Clear history |
| GET | `/api/endpoints/:id/stream` | Live feed (SSE) |

## Decisions and trade-offs
- **SSE instead of WebSocket:** the data only flows server to client, SSE works over plain HTTP, reconnects automatically and needs no extra library. WebSocket would make sense if the client needed to send live messages too.
- **No server-side "replay" button:** letting the server call an arbitrary URL is a server-side request forgery (SSRF) risk. "Copy as cURL" gives the same result safely, from the user's own machine.
- **In-memory storage:** simple and fast for a demo. The trade-off is that data is lost on restart (the UI detects this and creates a new endpoint) and it can't run on more than one instance.
- **Endpoint ids are random 48-bit values**, so URLs are unguessable enough for a demo, but they are not authentication.

## Limitations and next steps
- [ ] Persist to PostgreSQL, and use Redis pub/sub so several API instances can share live updates
- [ ] User accounts and private endpoints
- [ ] Configurable response (status code, delay, body) to simulate failures and retries
- [ ] Signature helpers (verify Stripe / GitHub webhook signatures)
- [ ] Rate limiting per IP
- [ ] Deploy a live demo (API on Render or Railway, web on Vercel) and add the link here. Note: the apps import `../../shared`, so deploy from the repo root.
