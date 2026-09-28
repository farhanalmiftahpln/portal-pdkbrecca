import fs from 'fs';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { handleSupabaseRead, handleSupabaseWrite } from './supabaseBackend';

dotenv.config();

const memoryCache = new Map<string, { data: any; updatedAt: Date }>();

export function createApp() {
  const app = express();

  // Support pre-parsed bodies from Serverless runtimes (such as Vercel)
  app.use((req: any, res, next) => {
    if (req.body !== undefined && typeof req.body === 'object') {
      req._body = true;
    }
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Supabase + GAS Bridge logic
  app.post('/api/gas', async (req, res) => {
    const body = req.body || {};
    const { action, payload } = body;
    const GAS_URL = process.env.VITE_GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec";

    if (!action) {
      return res.status(400).json({ success: false, message: "Parameter 'action' wajib disertakan." });
    }

    const isWrite = action && (action.startsWith("submit") || action.startsWith("update") || action.startsWith("save") || action.startsWith("record") || action.startsWith("add") || action.startsWith("selesai") || action.startsWith("delete") || action.startsWith("sync") || action === "clearSWA" || action === "logActivity" || action.startsWith("upload") || action === "requestAkun" || action.startsWith("export"));

    try {
      // 1. FAST WRITE: Write to Supabase & Mirror asynchronously to Google Sheet
      if (isWrite) {
        const writeResult = await handleSupabaseWrite(action, payload);
        return res.json(writeResult);
      }

      // 2. FAST READ: Query Supabase directly (< 300ms)
      const supabaseReadResult = await handleSupabaseRead(action, payload);
      if (supabaseReadResult !== null) {
        return res.json(supabaseReadResult);
      }

      // 3. Fallback to GAS for unhandled actions with Stale-While-Revalidate caching
      const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
      const cacheId = `${action}_${hash}`;

      if (memoryCache.has(cacheId)) {
        const cached = memoryCache.get(cacheId)!;
        res.json(cached.data);

        // Background revalidation
        fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action, payload })
        }).then(async r => {
          try {
            const responseText = await r.text();
            const responseData = JSON.parse(responseText);
            if (responseData.success) {
              memoryCache.set(cacheId, { data: responseData, updatedAt: new Date() });
            }
          } catch(e) {
            // ignore
          }
        }).catch(() => {});

        return;
      }

      // Direct proxy to GAS if not in cache
      let responseText = "";
      let responseData: any;
      let retries = 3;
      
      while (retries > 0) {
        try {
          const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, payload })
          });
          responseText = await response.text();
          responseData = JSON.parse(responseText);
          break;
        } catch(e) {
          retries--;
          if (retries === 0) {
             responseData = { success: false, message: "Server GAS sedang sibuk, silakan coba lagi.", raw: responseText };
          } else {
             await new Promise(res => setTimeout(res, 1000));
          }
        }
      }

      if (responseData && responseData.success) {
        memoryCache.set(cacheId, { data: responseData, updatedAt: new Date() });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("API error in /api/gas:", error);
      res.status(500).json({ 
        success: false, 
        message: error?.message || "Server error processing request" 
      });
    }
  });

  // Global error handler for body-parser (PayloadTooLargeError)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      console.error('[BODY-PARSER ERROR] Payload too large:', err.message);
      return res.status(413).json({
        success: false,
        error: 'Ukuran payload atau foto terlalu besar. Silakan gunakan foto yang lebih ringkas.',
        message: 'PayloadTooLargeError: request entity too large'
      });
    }
    next(err);
  });

  return app;
}

function getTargetPort(): number {
  // 1. Check command line arguments for --port <number> or -p <number>
  const portArgIndex = process.argv.findIndex(arg => arg === '--port' || arg === '-p');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  for (const arg of process.argv) {
    if (arg.startsWith('--port=')) {
      const parsed = Number(arg.split('=')[1]);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  // 2. In AI Studio Cloud Run, NGINX runs on port 8080 (NGINX_PORT) and proxies to DEFAULT_APP_PORT (3000).
  // The app MUST NOT bind to the NGINX port (8080), but to DEFAULT_APP_PORT.
  if (process.env.DEFAULT_APP_PORT) {
    const defaultAppPort = Number(process.env.DEFAULT_APP_PORT);
    if (!isNaN(defaultAppPort) && defaultAppPort > 0) return defaultAppPort;
  }

  if (process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT) {
    return 3000;
  }

  // 3. Fallback to process.env.PORT or 3000
  const envPort = Number(process.env.PORT);
  if (!isNaN(envPort) && envPort > 0) {
    return envPort;
  }

  return 3000;
}

let isStarting = false;
let serverInstance: any = null;

export async function startServer() {
  if (serverInstance || isStarting) return serverInstance;
  isStarting = true;
  const app = createApp();
  const PORT = getTargetPort();

  const isDevCommand = process.env.npm_lifecycle_event === 'dev';
  const hasDist = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

  if (isDevCommand || !hasDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      serverInstance = server;
      resolve(server);
    });

    server.on('error', (err: any) => {
      console.error(`Server listen error on port ${PORT}:`, err?.message);
      isStarting = false;
      reject(err);
    });
  });
}

// Auto-run if executed directly as entrypoint
if (process.env.AUTO_START_SERVER !== 'false' && (process.argv[1]?.endsWith('server/app.ts') || process.argv[1]?.endsWith('server.cjs'))) {
  startServer();
}
