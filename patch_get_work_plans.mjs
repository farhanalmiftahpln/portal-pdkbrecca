import fs from 'fs';
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetStr = `  const results = data
    .map((row, idx) => {
      let obj = {};
      headers.forEach((h, i) => {
        // Clean header string usually handled in frontend mapping, but let's keep keys similar
        obj[h?.toString().trim()] = row[i];
      });
      return obj;
    })
    .filter((r) => r && r["NO. WO"]); // filter rows that have NO. WO

  return { success: true, data: results };`;

const replacement = `  const results = data
    .map((row, idx) => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h?.toString().trim()] = row[i];
      });
      return obj;
    })
    .filter((r) => r && r["NO. WO"]); 

  // Grab KONFIRMASI from LIST REALISASI
  try {
    const listSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const listSheet = listSS.getSheetByName("LIST REALISASI");
    if (listSheet) {
      const listData = listSheet.getDataRange().getValues();
      const listHeaders = listData[0];
      const noWoIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
      const konfIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "KONFIRMASI");
      
      if (noWoIdx !== -1 && konfIdx !== -1) {
        const konfMap = {};
        for(let i=1; i<listData.length; i++) {
           const wo = String(listData[i][noWoIdx]).trim();
           if (wo) {
              konfMap[wo] = String(listData[i][konfIdx]).trim();
           }
        }
        results.forEach(r => {
           let wo = String(r["NO. WO"] || r["NO WO"] || "").trim();
           if (konfMap[wo]) {
              r["KONFIRMASI"] = konfMap[wo];
           }
        });
      }
    }
  } catch(e) {
    // Ignore error
  }

  return { success: true, data: results };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  console.log("Patched GetWorkPlans");
} else {
  console.log("Target string not found in GetWorkPlans");
}
fs.writeFileSync('gas-backend.js', code);
