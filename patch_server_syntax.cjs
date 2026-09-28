const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetLog = `console.log(\\\`Server running on port \\\${PORT}\\\`);`;
const replacementLog = `console.log(\`Server running on port \${PORT}\`);`;

code = code.replace(targetLog, replacementLog);
code = code.replace(`console.log(\\\`Server running on port \\\${PORT}\\\`);`, replacementLog);
// Just in case:
code = code.replace(/console\.log\(\\\`Server running on port \\\$\\{PORT\\}\\\`\);/g, `console.log(\`Server running on port \${PORT}\`);`);


fs.writeFileSync('server.ts', code);
