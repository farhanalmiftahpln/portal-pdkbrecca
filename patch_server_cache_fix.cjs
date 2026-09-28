const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetProxyStr = `            const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
            const cacheId = \`\${action}_\${hash}\`;
            
            await db.insert(gasCache)
              .values({ id: cacheId, action: action, payload: payload, data: responseData, updatedAt: new Date() })
              .onConflictDoUpdate({ target: gasCache.id, set: { data: responseData, updatedAt: new Date() } });`;

const replacement = `            const hash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
            const cacheId = \`\${action}_\${hash}\`;
            
            // Try to store, make sure payload is json friendly
            const safePayload = payload ? payload : {};
            await db.insert(gasCache)
              .values({ id: cacheId, action: action, payload: safePayload, data: responseData, updatedAt: new Date() })
              .onConflictDoUpdate({ target: gasCache.id, set: { data: responseData, updatedAt: new Date() } });`;

code = code.replace(targetProxyStr, replacement);
fs.writeFileSync('server.ts', code);
