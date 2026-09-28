const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The block to remove starts with {/* Current Step Options */}
// and ends right before {/* SWA SECTION */}
const regex = /\{\/\* Current Step Options \*\/\}([\s\S]*?)(?=\{\/\* SWA SECTION \*\/\})/;

code = code.replace(regex, '');

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
