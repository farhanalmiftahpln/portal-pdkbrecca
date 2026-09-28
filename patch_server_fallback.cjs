const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `const isWrite = action.startsWith("submit") || action.startsWith("update") || action.startsWith("save") || action.startsWith("selesai") || action.startsWith("delete") || action === "clearSWA";`;
const replaceStr = `const isWrite = action && (action.startsWith("submit") || action.startsWith("update") || action.startsWith("save") || action.startsWith("selesai") || action.startsWith("delete") || action === "clearSWA");`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('server.ts', code);
