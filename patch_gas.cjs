const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// Remove PROGRES modification in SWA submit
code = code.replace(
  /if \(tProgresCol !== -1\) trackSheet\.getRange\(i \+ 1, tProgresCol \+ 1\)\.setValue\(swaOption\);/g,
  '// if (tProgresCol !== -1) trackSheet.getRange(i + 1, tProgresCol + 1).setValue(swaOption);'
);

// Remove PROGRES modification in SWA clear
code = code.replace(
  /if \(tProgresCol !== -1\) \{\s*trackSheet\.getRange\(i \+ 1, tProgresCol \+ 1\)\.setValue\("Sedang Berjalan"\);\s*\}/g,
  '// if (tProgresCol !== -1) trackSheet.getRange(i + 1, tProgresCol + 1).setValue("Sedang Berjalan");'
);

// We should also make sure PROGRES isn't being modified in updateTracking by any rogue code.
fs.writeFileSync('gas-backend.js', code);
