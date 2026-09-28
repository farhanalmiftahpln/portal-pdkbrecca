import fs from 'fs';
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetStr = `  const result = headers.reduce((acc, h, i) => {
    acc[h?.toString().trim()] = row[i];
    return acc;
  }, {});

  return { success: true, data: result };`;

const replacementStr = `  const result = headers.reduce((acc, h, i) => {
    acc[h?.toString().trim()] = row[i];
    return acc;
  }, {});

  try {
    const listSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const listSheet = listSS.getSheetByName("LIST REALISASI");
    if (listSheet) {
      const listData = listSheet.getDataRange().getValues();
      const listHeaders = listData[0];
      const noWoIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
      const konfIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "KONFIRMASI");
      
      if (noWoIdx !== -1 && konfIdx !== -1) {
        for(let i=1; i<listData.length; i++) {
           if (String(listData[i][noWoIdx]).trim() === String(noWo).trim()) {
              result["KONFIRMASI"] = String(listData[i][konfIdx]).trim();
              break;
           }
        }
      }
    }
  } catch(e) {
    // Ignore error
  }

  return { success: true, data: result };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  console.log("Patched GetWorkPlanDetail");
} else {
  console.log("Target string not found in GetWorkPlanDetail");
}
fs.writeFileSync('gas-backend.js', code);
