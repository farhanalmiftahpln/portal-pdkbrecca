import fs from 'fs';
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetStr = `    // 2. Update KONFIRMASI in WORK PLAN`;
const insertStr = `    // 1.5 Update Material in REVIEW WO
    if (materials) {
      const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);
      const sheetMaterials = reviewWoSS.getSheetByName("MATERIAL");
      if (sheetMaterials) {
        // delete old materials for this WO
        const dataRWM = sheetMaterials.getDataRange().getValues();
        for (let i = dataRWM.length - 1; i >= 1; i--) {
          if (String(dataRWM[i][0]).trim() === String(noWo).trim()) {
            sheetMaterials.deleteRow(i + 1);
          }
        }
        // insert new materials
        materials.forEach((mat) => {
          if (mat.nama || mat.spesifikasi || mat.volume || mat.keterangan) {
            sheetMaterials.appendRow([
              noWo,
              mat.nama || "",
              mat.spesifikasi || "",
              mat.volume || "",
              mat.keterangan || "",
            ]);
          }
        });
      }
    }

    // 2. Update KONFIRMASI in WORK PLAN`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, insertStr);
    console.log("Patched REVIEW WO materials update");
} else {
    console.log("targetStr not found");
}

fs.writeFileSync('gas-backend.js', code);
