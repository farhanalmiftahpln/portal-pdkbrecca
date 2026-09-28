const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

code = code.replace(
  /alert\("Gagal menyimpan eviden: " \+ \(res\.message \|\| "Unknown error"\)\);/g,
  'alert("Gagal menyimpan eviden: " + (res.message || res.error || JSON.stringify(res) || "Unknown error"));'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
