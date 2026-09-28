const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The bug is in getTrackingInputRequirements which dictates when the modal should show.
// We need to ensure "PEKERJAAN SELESAI" triggers needsFoto = true.
const targetBlock = `      } else if (val === "Pekerjaan Selesai" || val === "Selesai") {
        needsFoto = true;`;

const replacementBlock = `      } else if (val.toUpperCase() === "PEKERJAAN SELESAI" || val.toUpperCase() === "SELESAI") {
        needsFoto = true;`;

if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, replacementBlock);
  fs.writeFileSync('src/pages/WorkPlan.tsx', code);
  console.log("Successfully patched WorkPlan.tsx modal trigger logic.");
} else {
  console.log("Target block not found.");
}
