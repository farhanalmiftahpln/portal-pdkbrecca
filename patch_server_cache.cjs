const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetProxyStr = `      let responseData;
      
      if (action === "updateTracking" || action === "submitSWA" || action === "clearSWA") {`;

const proxyEndStr = `    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ success: false, message: "Proxy error to GAS" });
    }
  });`;

const replacement = `      let responseData;
      
      // 1. Cache strategy for READS
      if (!isWrite && req.method === "POST") {
        // Try to find in cache
        try {
          const crypto = require('crypto');
          const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
          const cacheId = \`\${action}_\${hash}\`;
          
          const cached = await db.select().from(gasCache).where(eq(gasCache.id, cacheId)).limit(1);
          if (cached && cached.length > 0) {
            const cacheAge = Date.now() - new Date(cached[0].updatedAt).getTime();
            // Cache valid for 10 minutes (600000 ms)
            if (cacheAge < 600000) {
              console.log(\`[CACHE HIT] \${action}\`);
              return res.json(cached[0].data);
            }
          }
        } catch(e) {
          console.error("Cache read error:", e);
        }
      }

      if (action === "updateTracking" || action === "submitSWA" || action === "clearSWA") {
        try {
          const { noWo } = payload;
          if (noWo) {
            let data = payload;
            if (action === "clearSWA") {
              data = { STATUS_SWA: "PEKERJAAN DILANJUTKAN" };
            }
            await db.insert(tracking)
              .values({ noWo: String(noWo), status: action, data: data })
              .onConflictDoUpdate({ target: tracking.noWo, set: { status: action, data: data } });
          }
        } catch(e) {
          console.error("DB error", e);
        }
      }

      // Proxy to GAS
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
      });
      
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch(e) {
        responseData = { success: false, message: "Invalid JSON from GAS", raw: responseText };
      }
      
      // 2. Save READS to Cache & Clear Cache on WRITES
      try {
        if (responseData.success) {
          if (!isWrite) {
            const crypto = require('crypto');
            const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
            const cacheId = \`\${action}_\${hash}\`;
            
            await db.insert(gasCache)
              .values({ id: cacheId, action: action, payload: payload, data: responseData, updatedAt: new Date() })
              .onConflictDoUpdate({ target: gasCache.id, set: { data: responseData, updatedAt: new Date() } });
            console.log(\`[CACHE SET] \${action}\`);
          } else {
             // Invalidate all caches on write to be safe, or we could be more specific.
             // For simplicity, when a write happens, we delete all gasCache so the next read fetches fresh data.
             await db.delete(gasCache);
             console.log(\`[CACHE CLEARED] due to write action: \${action}\`);
          }
        }
      } catch(e) {
        console.error("Cache write error:", e);
      }

      res.json(responseData);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ success: false, message: "Proxy error to GAS" });
    }
  });`;

// Extract from targetProxyStr to proxyEndStr
const startIndex = code.indexOf(targetProxyStr);
const endIndex = code.indexOf(proxyEndStr) + proxyEndStr.length;

if(startIndex !== -1 && endIndex !== -1) {
   code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
   fs.writeFileSync('server.ts', code);
   console.log("Patched successfully");
} else {
   console.log("Could not find blocks");
}
