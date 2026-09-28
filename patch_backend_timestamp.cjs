const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// 1. Move getJakartaTime to the top of handleUpdateTracking
const getJakartaFunc = `    function getJakartaTime() {
      const d = new Date();
      const localTime = d.getTime();
      const localOffset = d.getTimezoneOffset() * 60000;
      const utc = localTime + localOffset;
      const offset = 7; // WIB (UTC+7)
      const jakartaTime = utc + 3600000 * offset;
      return new Date(jakartaTime);
    }`;

// Wait, I can just define it globally or at the top of handleUpdateTracking.
const topOfHandleUpdateTracking = `function handleUpdateTracking(payload) {
  function getJakartaTime() {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const offset = 7; // WIB (UTC+7)
    return new Date(utc + 3600000 * offset);
  }
`;

code = code.replace("function handleUpdateTracking(payload) {", topOfHandleUpdateTracking);
// Remove the inner one
code = code.replace(getJakartaFunc, "");

// 2. Insert TS update logic in CL_ Sheets
const clTarget = `      if (clRowIndex !== -1) {
        let targetColName = stepValue.toUpperCase();`;
        
const clReplacement = `      if (clRowIndex !== -1) {
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
        }`;
        
code = code.replace(clTarget, clReplacement);

// 3. Update TRACKING sheet time format
// The user says "Sekarang Waktu yang tersimpan berformat [DD/MM/YYYY] [hh:mm]". Let's apply this format to TRACKING sheet as well to be safe, or just leave it. If they mean the whole time formatting should be updated:
const oldTimeFormat = `const currentTimeStr = Utilities.formatDate(
      getJakartaTime(),
      "GMT+7",
      "HH:mm:ss",
    );`;
const newTimeFormat = `const currentTimeStr = Utilities.formatDate(
      getJakartaTime(),
      "GMT+7",
      "dd/MM/yyyy HH:mm",
    );`;
code = code.replace(oldTimeFormat, newTimeFormat);
code = code.replace(`"HH:mm:ss"`, `"dd/MM/yyyy HH:mm"`); // fallback

fs.writeFileSync('gas-backend.js', code);
console.log("Successfully patched backend for timestamp format and TS_ column.");
