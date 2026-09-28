const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Reverse the previous patch and restore grid-cols-2.
// BUT with an adjustment for odd items if we want them full width, or just grid-cols-2.
// The user explicitly stated they wanted it to be like the "UI sebelumnya" which was grid-cols-2.
// The image had 3 buttons, WAITING in col 1, PEKERJAAN DILAKSANAKAN in col 2, PEKERJAAN SELESAI in col 1 row 2.

code = code.replace(
  '<div className="flex flex-col gap-2">',
  '<div className="grid grid-cols-2 gap-2">'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
