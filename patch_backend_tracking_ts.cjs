const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// 1. Remove TS_ modification from CL_ logic that we just added (we will do it in TRACKING instead)
const oldClLogic = `      if (clRowIndex !== -1) {
        let targetColName = stepValue.toUpperCase();
        
        // Update TS_[Status Pekerjaan]
        const tsColName = "TS_" + stepValue.toUpperCase();
        const timestampFormatted = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy HH:mm");
        const tsColIdx = clHeaders.findIndex(
          (h) => h && String(h).trim().toUpperCase() === tsColName.toUpperCase()
        );
        if (tsColIdx > -1) {
          clSheet.getRange(clRowIndex, tsColIdx + 1).setValue(timestampFormatted);
        } else {
          console.log("Kolom '" + tsColName + "' tidak ditemukan di sheet " + sheetNameCL);
        }
        if (sheetNameCL === "CL_PELAKSANAAN" && (stepValue.toUpperCase() === "PEKERJAAN SELESAI" || stepValue.toUpperCase() === "SELESAI")) {`;

const restoredClLogic = `      if (clRowIndex !== -1) {
        let targetColName = stepValue.toUpperCase();
        if (sheetNameCL === "CL_PELAKSANAAN" && (stepValue.toUpperCase() === "PEKERJAAN SELESAI" || stepValue.toUpperCase() === "SELESAI")) {`;

code = code.replace(oldClLogic, restoredClLogic);

// 2. Add TS_ logic to TRACKING update
const trackUpdateTarget = `    // If it's completed, set END time
    const isCompleted = [`;

const trackUpdateReplacement = `    // Save custom timestamp TS_[Status Pekerjaan] to TRACKING sheet
    const tsColName = "TS_" + stepValue.toUpperCase();
    const tsColIdx = headers.findIndex((h) => h && String(h).trim().toUpperCase() === tsColName.toUpperCase());
    if (tsColIdx > -1) {
      if (rowIndex !== -1) {
        trackSheet.getRange(rowIndex, tsColIdx + 1).setValue(currentTimeStr);
      } else {
        updates[tsColName] = currentTimeStr;
      }
    } else {
      console.log("Kolom '" + tsColName + "' tidak ditemukan di sheet TRACKING");
    }

    // If it's completed, set END time
    const isCompleted = [`;

code = code.replace(trackUpdateTarget, trackUpdateReplacement);

// 3. For SWA submit, update TS_SWA in TRACKING sheet
const swaTarget = `            trackSheet.getRange(i + 1, tSwaCol + 1).setValue(swaOption);
            let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");`;

const swaReplacement = `            trackSheet.getRange(i + 1, tSwaCol + 1).setValue(swaOption);
            
            let tTsSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA");
            if (tTsSwaCol > -1) {
              function getJakartaTime() {
                const d = new Date();
                const localTime = d.getTime();
                const localOffset = d.getTimezoneOffset() * 60000;
                const utc = localTime + localOffset;
                const offset = 7; // WIB (UTC+7)
                return new Date(utc + 3600000 * offset);
              }
              const swaTimeStr = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy HH:mm");
              trackSheet.getRange(i + 1, tTsSwaCol + 1).setValue(swaTimeStr);
            }
            
            let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");`;

code = code.replace(swaTarget, swaReplacement);

fs.writeFileSync('gas-backend.js', code);
console.log("Successfully patched backend for TRACKING TS_ tracking and TS_SWA.");
