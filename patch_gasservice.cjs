const fs = require('fs');
let code = fs.readFileSync('src/services/gasService.ts', 'utf8');

const targetStr = `const GAS_BACKEND_URL = formatUrl(RAW_URL);`;
const replaceStr = `const GAS_BACKEND_URL = '/api/gas'; // Routing all calls to local backend first`;

code = code.replace(targetStr, replaceStr);

const targetFetch = `const response = await fetch(GAS_BACKEND_URL, {`;
const replaceFetch = `const response = await fetch('/api/gas', {`;

code = code.replace(targetFetch, replaceFetch);

fs.writeFileSync('src/services/gasService.ts', code);
