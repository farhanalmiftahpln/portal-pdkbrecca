const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          } else {
             // Invalidate all caches on write to be safe, or we could be more specific.
             // For simplicity, when a write happens, we delete all gasCache so the next read fetches fresh data.
             await db.delete(gasCache);
             console.log(\`[CACHE CLEARED] due to write action: \${action}\`);
          }`;

const replacementStr = `          } else {
             // Smart Cache Invalidation: Only delete related caches instead of wiping everything
             const { ilike } = require('drizzle-orm');
             let prefix = "";
             if (action.includes("Tracking") || action.includes("SWA")) prefix = "getTracking";
             else if (action.includes("Berkas")) prefix = "getBerkasActions";
             else if (action.includes("selesai")) prefix = "getWorkPlan";
             else if (action.includes("Jumat")) prefix = "getWorkPlan";
             else if (action.includes("Review")) prefix = "getReview";
             else if (action.includes("Realisasi")) prefix = "getRealisasi";
             else if (action.includes("Llc")) prefix = "getLlc";
             
             if (prefix) {
                 await db.delete(gasCache).where(ilike(gasCache.id, prefix + "%"));
                 console.log(\`[CACHE CLEARED] specific prefix '\${prefix}' due to write action: \${action}\`);
             } else {
                 // For unknown writes, we might clear everything just to be safe, or just let TTL handle it.
                 // Let's just clear getDashboardStats to refresh stats, but keep everything else.
                 await db.delete(gasCache).where(ilike(gasCache.id, "getDashboardStats%"));
                 console.log(\`[CACHE CLEARED] dashboard stats due to general write action: \${action}\`);
             }
          }`;

if (code.includes('await db.delete(gasCache);')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server for smart cache invalidation");
} else {
    console.log("Could not find the target string.");
}
