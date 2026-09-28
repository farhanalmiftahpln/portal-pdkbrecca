const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const target = `let tTsSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA_CLEARED_TIME");
        if (tTsSwaClearedTimeCol === -1) {
           tTsSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tTsSwaClearedTimeCol + 1).setValue("TS_SWA_CLEARED_TIME");
           tHeaders.push("TS_SWA_CLEARED_TIME");
        }`;

const replace = `let tTsSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA");
        if (tTsSwaClearedTimeCol === -1) {
           tTsSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tTsSwaClearedTimeCol + 1).setValue("TS_SWA");
           tHeaders.push("TS_SWA");
        }`;

code = code.replace(target, replace);
fs.writeFileSync('gas-backend.js', code);
