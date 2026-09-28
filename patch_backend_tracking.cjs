const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// We need to modify handleUpdateTracking so it saves to "Foto Selesai" if it's the completion step.
const targetBlock = `        const valColIdx = clHeaders.findIndex(
          (h) =>
            h && String(h).trim().toUpperCase() === stepValue.toUpperCase(),
        );`;

const replacementBlock = `        let targetColName = stepValue.toUpperCase();
        if (sheetNameCL === "CL_PELAKSANAAN" && (stepValue.toUpperCase() === "PEKERJAAN SELESAI" || stepValue.toUpperCase() === "SELESAI")) {
          targetColName = "FOTO SELESAI";
        }
        
        const valColIdx = clHeaders.findIndex(
          (h) =>
            h && String(h).trim().toUpperCase() === targetColName.toUpperCase(),
        );`;

if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, replacementBlock);
  fs.writeFileSync('gas-backend.js', code);
  console.log("Successfully patched handleUpdateTracking");
} else {
  console.log("Target block not found in gas-backend.js");
}
