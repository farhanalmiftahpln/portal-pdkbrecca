const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

code = code.replace(
  'var ss = SpreadsheetApp.openById(SPREADSHEETS.TRACKING_EVIDENCES);',
  'var ss = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);'
);

fs.writeFileSync('gas-backend.js', code);
