const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Remove from inside the component
code = code.replace(/const TRACKING_STEPS = \["START", "PERSIAPAN", "PELAKSANAAN"\];/, '');

// Add to the top of the file, after imports
const importRegex = /import [\s\S]*?from [\s\S]*?;(\n)+/;
code = code.replace(importRegex, '$&const TRACKING_STEPS = ["START", "PERSIAPAN", "PELAKSANAAN"];\n');

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
