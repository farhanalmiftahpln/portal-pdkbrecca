const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `console.error("Cache write error:", e);`;
const replacement = `fs.writeFileSync('cache_error.log', e.toString()); console.error("Cache write error:", e);`;

if(!code.includes("cache_error.log")) {
  code = code.replace(targetStr, replacement);
  // also import fs
  if(!code.includes("import fs from 'fs';")) {
    code = "import fs from 'fs';\n" + code;
  }
  fs.writeFileSync('server.ts', code);
}
