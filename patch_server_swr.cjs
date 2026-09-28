const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          const cached = await db.select().from(gasCache).where(eq(gasCache.id, cacheId)).limit(1);
          if (cached && cached.length > 0) {
            const cacheAge = Date.now() - new Date(cached[0].updatedAt).getTime();
            // Cache valid for 10 minutes (600000 ms)
            if (cacheAge < 600000) {
              console.log(\`[CACHE HIT] \${action}\`);
              return res.json(cached[0].data);
            }
          }`;

const replacementStr = `          const cached = await db.select().from(gasCache).where(eq(gasCache.id, cacheId)).limit(1);
          if (cached && cached.length > 0) {
            console.log(\`[STALE-WHILE-REVALIDATE HIT] \${action}\`);
            res.json(cached[0].data); // Respond immediately!
            
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
                   const safePayload = payload ? payload : {};
                   await db.insert(gasCache)
                    .values({ id: cacheId, action: action, payload: safePayload, data: responseData, updatedAt: new Date() })
                    .onConflictDoUpdate({ target: gasCache.id, set: { data: responseData, updatedAt: new Date() } });
                   console.log(\`[CACHE REVALIDATED] \${action}\`);
                }
              } catch(e) {
                 console.log("Background revalidation failed parsing JSON");
              }
            }).catch(e => {
                 console.log("Background revalidation fetch failed");
            });
            
            return; // STOP execution!
          }`;

if (code.includes('// Cache valid for 10 minutes')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server for stale-while-revalidate");
} else {
    console.log("Could not find the target string.");
}
