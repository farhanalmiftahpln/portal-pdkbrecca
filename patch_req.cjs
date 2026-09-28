const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// 1. In getTrackingInputRequirements, remove the special logic for "Pekerjaan dilaksanakan"
const reqFrom = `      } else if (val === "Pekerjaan Selesai" || val === "Selesai") {
        needsFoto = true;
      } else if (
        val === "Pekerjaan dilaksanakan" ||
        val.toLowerCase().includes("dilaksanakan")
      ) {
        needsMultipleFotos = true;
      }`;
const reqTo = `      } else if (val === "Pekerjaan Selesai" || val === "Selesai") {
        needsFoto = true;
      }`;
code = code.replace(reqFrom, reqTo);
fs.writeFileSync('src/pages/WorkPlan.tsx', code);
