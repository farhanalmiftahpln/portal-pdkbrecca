const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// In handleSubmitSWA, set STATUS SWA to AKTIF
code = code.replace(
  /trackSheet\.getRange\(i \+ 1, tSwaCol \+ 1\)\.setValue\(swaOption\);/g,
  `trackSheet.getRange(i + 1, tSwaCol + 1).setValue(swaOption);
            let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");
            if (tStatusSwaCol === -1) {
               tStatusSwaCol = tHeaders.length;
               trackSheet.getRange(1, tStatusSwaCol + 1).setValue("STATUS SWA");
               tHeaders.push("STATUS SWA");
            }
            trackSheet.getRange(i + 1, tStatusSwaCol + 1).setValue("AKTIF");`
);

// In handleClearSWA, DO NOT empty SWA, but set STATUS SWA to PEKERJAAN DILANJUTKAN and set SWA_CLEARED_TIME
code = code.replace(
  /trackSheet\.getRange\(i \+ 1, tSwaCol \+ 1\)\.setValue\(""\);\s*\/\/ if \(tProgresCol \!\=\= -1\) trackSheet\.getRange\(i \+ 1, tProgresCol \+ 1\)\.setValue\("Sedang Berjalan"\);/g,
  `let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");
        if (tStatusSwaCol === -1) {
           tStatusSwaCol = tHeaders.length;
           trackSheet.getRange(1, tStatusSwaCol + 1).setValue("STATUS SWA");
           tHeaders.push("STATUS SWA");
        }
        trackSheet.getRange(i + 1, tStatusSwaCol + 1).setValue("PEKERJAAN DILANJUTKAN");
        let tSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "SWA_CLEARED_TIME");
        if (tSwaClearedTimeCol === -1) {
           tSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tSwaClearedTimeCol + 1).setValue("SWA_CLEARED_TIME");
           tHeaders.push("SWA_CLEARED_TIME");
        }
        trackSheet.getRange(i + 1, tSwaClearedTimeCol + 1).setValue(new Date().toISOString());`
);

fs.writeFileSync('gas-backend.js', code);
