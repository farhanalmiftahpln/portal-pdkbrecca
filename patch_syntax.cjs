const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

code = code.replace(/};\n      img\.onerror = \(error\) => reject\(error\);\n    };\n    reader\.onerror = \(error\) => reject\(error\);\n  }\);\n};/g, '};');

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
