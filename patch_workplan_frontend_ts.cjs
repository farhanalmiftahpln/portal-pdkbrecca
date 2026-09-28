const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The frontend addHist currently tries to find TS_ in lampiranSteps.CL_
// We need to change it to read from trackingData directly (which represents the TRACKING sheet row)

const targetAddHist = `    const tsKey = "TS_" + val.toUpperCase();
    const tsTime = trackingData.lampiranSteps?.[\`CL_\${step}\`]?.[tsKey];
    
    hist.push({
      status: val,
      tanggal: tsTime || trackingData[timeKey] || fallbackTime,`;

const replacementAddHist = `    const tsKey = "TS_" + val.toUpperCase();
    const tsTime = trackingData[tsKey];
    
    hist.push({
      status: val,
      tanggal: tsTime || trackingData[timeKey] || fallbackTime,`;

code = code.replace(targetAddHist, replacementAddHist);

// We also need to read TS_SWA for the SWA history entry
const targetSwaHist = `  // Add SWA to history if exists
  if (trackingData["SWA"]) {
    hist.push({
      status: "SWA: " + trackingData["SWA"],
      tanggal: trackingData["SWA_TIME"] || trackingData["SWA_START_TIME"] || new Date().toISOString(),`;

const replacementSwaHist = `  // Add SWA to history if exists
  if (trackingData["SWA"]) {
    hist.push({
      status: "SWA: " + trackingData["SWA"],
      tanggal: trackingData["TS_SWA"] || trackingData["SWA_TIME"] || trackingData["SWA_START_TIME"] || new Date().toISOString(),`;

code = code.replace(targetSwaHist, replacementSwaHist);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
console.log("Successfully patched WorkPlan.tsx for TRACKING TS_ tracking.");
