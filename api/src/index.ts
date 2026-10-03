import { createApp } from './app';
import { Store } from './store';

const DAY_MS = 24 * 60 * 60 * 1000;
const store = new Store();
setInterval(() => store.purgeExpired(DAY_MS), 10 * 60 * 1000).unref();

const port = Number(process.env.PORT ?? 3001);
createApp(store).listen(port, () => console.log(`Webhook inspector API on http://localhost:${port}`));
