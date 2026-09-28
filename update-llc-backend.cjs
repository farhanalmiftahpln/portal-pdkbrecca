const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf-8');

if (!code.includes('case "updateLlcStatus":')) {
  code = code.replace(
    'case "getLlcList":',
    'case "updateLlcStatus":\n        result = handleUpdateLlcStatus(payload);\n        break;\n      case "getLlcList":'
  );
}

if (!code.includes('handleUpdateLlcStatus')) {
  code += `\n
// --- UPDATE LLC STATUS ---
function handleUpdateLlcStatus(payload) {
  try {
    const { rowIndex, status } = payload;
    if (!rowIndex) return { success: false, message: "Row index not provided" };
    
    const llcSSId = "1laMd_noHiogta5tGnAW6PIN51Md2zwMWC6H0vu9u0zA";
    const llcSS = SpreadsheetApp.openById(llcSSId);
    const sheet = llcSS.getSheetByName("LIST LLC");
    
    if (!sheet) return { success: false, message: "Sheet LIST LLC tidak ditemukan" };
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusColIdx = headers.findIndex(h => h && h.toString().trim().toUpperCase() === "STATUS PEMELIHARAAN");
    
    if (statusColIdx > -1) {
      sheet.getRange(rowIndex, statusColIdx + 1).setValue(status);
      return { success: true, message: "Status LLC diupdate" };
    }
    return { success: false, message: "Kolom STATUS PEMELIHARAAN tidak ditemukan" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
`;
}

code = code.replace(
  'const result = rows.map(row => {',
  'const result = rows.map((row, rIdx) => {\n      let obj = { _rowIndex: rIdx + 2 };'
);

fs.writeFileSync('gas-backend.js', code);
console.log('Backend updated');
