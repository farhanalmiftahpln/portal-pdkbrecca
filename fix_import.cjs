const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');
code = code.replace(',, Upload', ', Upload');
fs.writeFileSync('src/pages/WorkPlan.tsx', code);
