const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

if (!code.includes("Upload,")) {
  code = code.replace(/import \{([^}]+)\} from "lucide-react";/, (match, group1) => {
    return `import { ${group1.trim()}, Upload } from "lucide-react";`;
  });
  fs.writeFileSync('src/pages/WorkPlan.tsx', code);
}
