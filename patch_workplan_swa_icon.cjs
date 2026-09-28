const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const targetStr = `            } else if (h.state === "swa_cleared") {
              IconCmp = TriangleAlert;
              iconColorCls = "text-green-400 bg-green-400/10 border border-green-400/20";
              lineCls = "bg-green-400/20";
              textColorCls = "text-green-400 font-extrabold";
            }`;

if (code.includes(targetStr)) {
  console.log("SWA cleared icon is already updated");
} else {
  console.log("Checking if ShieldCheck is present...");
}
