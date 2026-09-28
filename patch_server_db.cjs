const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetProxyStr = `      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
      });
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch(e) {
        responseData = { success: false, message: "Invalid JSON from GAS", raw: responseText };
      }`;

const replaceProxyStr = `      let responseData;
      
      if (action === "updateTracking" || action === "submitSWA" || action === "clearSWA") {
        // Here we will eventually save to PostgreSQL directly.
        // For now, we dual write: save to PG and send to GAS
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
      }`;

if(!code.includes("import { tracking }")) {
  code = code.replace(`import { gasCache, writeQueue } from './src/db/schema.js';`, `import { gasCache, writeQueue, tracking } from './src/db/schema.js';`);
}

code = code.replace(targetProxyStr, replaceProxyStr);
fs.writeFileSync('server.ts', code);
