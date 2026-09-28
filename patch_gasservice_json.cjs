const fs = require('fs');
let code = fs.readFileSync('src/services/gasService.ts', 'utf8');

code = code.replace(`'Content-Type': 'text/plain',`, `'Content-Type': 'application/json',`);

fs.writeFileSync('src/services/gasService.ts', code);
