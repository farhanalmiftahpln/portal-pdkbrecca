const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const regex = /\{\/\* SWA SECTION \*\/\}([\s\S]*?)(?=\{\/\* History \*\/\})/;

code = code.replace(regex, '');

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
