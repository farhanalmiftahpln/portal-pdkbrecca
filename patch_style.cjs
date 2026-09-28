const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

code = code.replace(
  'btnClass = "bg-green-500/20 text-green-500 border-green-500/50 cursor-not-allowed";',
  'btnClass = "bg-green-500/20 text-green-500 border-green-500/50 cursor-not-allowed";\n                            btnDisabled = false; // ALLOW CLICK TO VIEW'
);

code = code.replace(
  'if (btnLabel === "MULAI PROGRES") {',
  'if (btnLabel === "PROGRES SELESAI" || btnLabel === "LIHAT PROGRES") {\n                              loadTracking(noWo);\n                            } else if (btnLabel === "MULAI PROGRES") {'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
