import fs from 'fs';
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetStr = `    // 2. Update KONFIRMASI in WORK PLAN
    const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
    const sheetWP = wpSS.getSheetByName("WORK PLAN");
    if (sheetWP) {
      const dataWP = sheetWP.getDataRange().getValues();
      const headersWP = dataWP[0];
      const noWoIndexWP = headersWP.findIndex(
        (h) =>
          String(h).trim().toUpperCase() === "NO WO" ||
          String(h).trim().toUpperCase() === "NO. WO" ||
          String(h).trim().toUpperCase() === "NO.WO",
      );

      let konfColIdx = headersWP.findIndex(
        (h) => h && String(h).trim().toUpperCase() === "KONFIRMASI",
      );
      if (konfColIdx === -1) {
        konfColIdx = headersWP.length;
        sheetWP.getRange(1, konfColIdx + 1).setValue("KONFIRMASI");
      }

      if (noWoIndexWP !== -1) {
        let rowIdxWP = -1;
        for (let i = 1; i < dataWP.length; i++) {
          if (String(dataWP[i][noWoIndexWP]).trim() === String(noWo).trim()) {
            rowIdxWP = i + 1;
            break;
          }
        }

        if (rowIdxWP !== -1) {
          sheetWP.getRange(rowIdxWP, konfColIdx + 1).setValue(status);
        }
      }
    }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, '');
    console.log("Patched gas-backend.js");
} else {
    console.log("Not found.");
}
fs.writeFileSync('gas-backend.js', code);
