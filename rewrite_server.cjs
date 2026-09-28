const fs = require('fs');
const content = `import fs from 'fs';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const memoryCache = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // GAS Bridge logic
  app.post('/api/gas', async (req, res) => {
    const { action, payload } = req.body;
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";

    const isWrite = action && (action.startsWith("submit") || action.startsWith("update") || action.startsWith("save") || action.startsWith("selesai") || action.startsWith("delete") || action === "clearSWA");

    try {
      const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
      const cacheId = \`\${action}_\${hash}\`;

      // 1. Cache strategy for READS (Stale-While-Revalidate)
      if (!isWrite && req.method === "POST") {
        if (memoryCache.has(cacheId)) {
          const cached = memoryCache.get(cacheId);
          console.log(\`[STALE-WHILE-REVALIDATE HIT] \${action}\`);
          res.json(cached.data); // Respond immediately!

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
                 console.log(\`[CACHE REVALIDATED] \${action}\`);
              }
            } catch(e) {
               console.log("Background revalidation failed parsing JSON");
            }
          }).catch(e => {
               console.log("Background revalidation fetch failed");
          });

          return; // STOP execution!
        }
      }

      // Proxy to GAS with Retry Logic for Transient HTML errors
      let responseText = "";
      let responseData;
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
          break; // Success
        } catch(e) {
          retries--;
          console.error(\`Failed to parse GAS JSON. Retries left: \${retries}. Response: \${responseText.substring(0, 100)}\`);
          if (retries === 0) {
             responseData = { success: false, message: "Server GAS sedang sibuk, silakan coba lagi.", raw: responseText };
          } else {
             await new Promise(res => setTimeout(res, 1000));
          }
        }
      }

      // 2. Save READS to Cache & Clear Cache on WRITES
      if (responseData && responseData.success) {
        if (!isWrite) {
          memoryCache.set(cacheId, { data: responseData, updatedAt: new Date() });
          console.log(\`[CACHE SET] \${action}\`);
        } else {
          // Smart Cache Invalidation
          let prefix = "";
          if (action.includes("Tracking") || action.includes("SWA")) prefix = "getTracking";
          else if (action.includes("Berkas")) prefix = "getBerkasActions";
          else if (action.includes("selesai") || action.includes("Jumat")) prefix = "getWorkPlan";
          else if (action.includes("Review")) prefix = "getReview";
          else if (action.includes("Realisasi")) prefix = "getRealisasi";
          else if (action.includes("Llc")) prefix = "getLlc";

          if (prefix) {
            for (const key of memoryCache.keys()) {
               if (key.startsWith(prefix)) {
                  memoryCache.delete(key);
               }
            }
            console.log(\`[CACHE CLEARED] specific prefix '\${prefix}' due to write action: \${action}\`);
          } else {
            // General clear for dashboard stats
            for (const key of memoryCache.keys()) {
               if (key.startsWith("getDashboardStats")) {
                  memoryCache.delete(key);
               }
            }
            console.log(\`[CACHE CLEARED] dashboard stats due to general write action: \${action}\`);
          }
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ success: false, message: "Proxy error to GAS" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', content);
console.log("Rewrote server.ts for In-Memory Caching");
