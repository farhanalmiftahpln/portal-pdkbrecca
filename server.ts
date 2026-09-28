import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServer = path.join(__dirname, 'dist', 'server.cjs');

// In development with `npm run dev` (run via tsx), load dynamic TypeScript app with Vite middlewares.
// In all other cases (e.g. production start, Cloud Run, node server.ts), load the bundled dist/server.cjs.
const isDev = process.env.npm_lifecycle_event === 'dev';

if (!isDev && fs.existsSync(distServer)) {
  const require = createRequire(import.meta.url);
  const bundled = require(distServer);
  if (bundled && typeof bundled.startServer === 'function') {
    bundled.startServer().catch((err: any) => {
      console.error('Failed to start bundled server:', err);
    });
  }
} else {
  const { startServer } = await import('./server/app.ts');
  startServer().catch((err: any) => {
    console.error('Failed to start server:', err);
  });
}
