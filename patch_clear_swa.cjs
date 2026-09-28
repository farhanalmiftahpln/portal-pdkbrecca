const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetStr = `        let tSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "SWA_CLEARED_TIME");
        if (tSwaClearedTimeCol === -1) {
           tSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tSwaClearedTimeCol + 1).setValue("SWA_CLEARED_TIME");
           tHeaders.push("SWA_CLEARED_TIME");
        }
        trackSheet.getRange(i + 1, tSwaClearedTimeCol + 1).setValue(new Date().toISOString());`;

const replacementStr = `        let tTsSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA_CLEARED_TIME");
        if (tTsSwaClearedTimeCol === -1) {
           tTsSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tTsSwaClearedTimeCol + 1).setValue("TS_SWA_CLEARED_TIME");
           tHeaders.push("TS_SWA_CLEARED_TIME");
        }
        
        function getJakartaTime() {
          const d = new Date();
          const localTime = d.getTime();
          const localOffset = d.getTimezoneOffset() * 60000;
          const utc = localTime + localOffset;
          const offset = 7; // WIB (UTC+7)
          return new Date(utc + 3600000 * offset);
        }
        const clearedTimeStr = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy HH:mm");
        
        trackSheet.getRange(i + 1, tTsSwaClearedTimeCol + 1).setValue(clearedTimeStr);`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('gas-backend.js', code);
console.log("Patched clear SWA backend successfully.");
