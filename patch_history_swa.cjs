const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const getGenHistRegex = /const getGeneratedHistory = \(trackingData: any\) => \{[\s\S]*?return hist;\n\};/;

const newGetGenHist = `
const getGeneratedHistory = (trackingData: any) => {
  if (!trackingData) return [];
  const hist: any[] = [];
  const steps = ["START", "PERSIAPAN", "PELAKSANAAN"];
  
  // Custom mapping based on linear states
  const addHist = (val: string, step: string) => {
    hist.push({
      status: val,
      tanggal: trackingData[\`\${step}_END_TIME\`] || trackingData[\`\${step}_START_TIME\`] || new Date().toISOString(),
      keterangan: trackingData[\`Keterangan \${step}\`] || trackingData[\`KETERANGAN \${step}\`] || "",
      foto: trackingData[\`FOTO \${step}\`] || trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO SEBELUM"] || trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROGRES"] || trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PEKERJAAN"],
      foto1: trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROSES 1"],
      foto2: trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROSES 2"],
      aktor: ""
    });
  };

  steps.forEach(step => {
    const val = trackingData[step];
    if (val && val.toUpperCase() !== "WAITING" && val.trim() !== "") {
      addHist(val, step);
    }
  });

  // Add SWA to history if exists
  if (trackingData["SWA"]) {
    hist.push({
      status: "SWA: " + trackingData["SWA"],
      tanggal: trackingData["SWA_TIME"] || trackingData["SWA_START_TIME"] || new Date().toISOString(),
      keterangan: trackingData[\`Keterangan \${trackingData["SWA"]}\`] || trackingData["Keterangan SWA"] || trackingData["SWA"],
      foto: trackingData[trackingData["SWA"]] || trackingData["FOTO SWA"],
      aktor: ""
    });
  }

  return hist;
};
`;

code = code.replace(getGenHistRegex, newGetGenHist.trim());
fs.writeFileSync('src/pages/WorkPlan.tsx', code);
