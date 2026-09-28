const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// The function is handleSelesaikanPekerjaan
// We need to change where the fotoGridUrl is saved.
// It currently tries to save to WORK PLAN -> FOTO SESUDAH
// We want to save to CL_PELAKSANAAN -> FOTO REALISASI

const targetBlock = `    // Attempt to save fotoGridUrl to WORK PLAN's FOTO SESUDAH column
    try {
      if (fotoGridUrl) {
        const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
        const wpSheet = wpSS.getSheetByName("WORK PLAN");
        if (wpSheet) {
          const wpData = wpSheet.getDataRange().getValues();
          const wpH = wpData[0];
          const wpWoIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
          const fsIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO SESUDAH");
          
          if (wpWoIdx !== -1 && fsIdx !== -1) {
            for (let i = 1; i < wpData.length; i++) {
              if (String(wpData[i][wpWoIdx]).trim() === String(noWo).trim()) {
                wpSheet.getRange(i + 1, fsIdx + 1).setValue(fotoGridUrl);
                break;
              }
            }
          }
        }
      }
    } catch(err) {
      console.log("Gagal simpan foto grid ke WORK PLAN: " + err.message);
    }`;

const replacementBlock = `    // Save fotoGridUrl to CL_PELAKSANAAN -> FOTO REALISASI
    try {
      if (fotoGridUrl) {
        const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
        const wpSheet = wpSS.getSheetByName("CL_PELAKSANAAN");
        if (wpSheet) {
          const wpData = wpSheet.getDataRange().getValues();
          const wpH = wpData[0];
          const wpWoIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
          const fsIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO REALISASI");
          
          if (wpWoIdx !== -1 && fsIdx !== -1) {
            for (let i = 1; i < wpData.length; i++) {
              if (String(wpData[i][wpWoIdx]).trim() === String(noWo).trim()) {
                wpSheet.getRange(i + 1, fsIdx + 1).setValue(fotoGridUrl);
                break;
              }
            }
          }
        }
      }
    } catch(err) {
      console.log("Gagal simpan foto grid ke CL_PELAKSANAAN: " + err.message);
    }`;

if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, replacementBlock);
  fs.writeFileSync('gas-backend.js', code);
  console.log("Successfully patched backend handleSelesaikanPekerjaan.");
} else {
  console.log("Target block not found.");
}
