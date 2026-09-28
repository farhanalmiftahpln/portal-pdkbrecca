const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const regex = /const getGeneratedHistory = \([\s\S]*?return hist;\n\};/;

const newLogic = `const getGeneratedHistory = (trackingData: any) => {
  if (!trackingData) return [];
  const hist: any[] = [];
  const steps = ["START", "PERSIAPAN", "PELAKSANAAN"];
  
  const addHist = (val: string, step: string, isEnd: boolean) => {
    // Determine the correct time key
    const timeKey = isEnd ? \`\${step}_END_TIME\` : \`\${step}_START_TIME\`;
    const fallbackTime = trackingData[\`\${step}_END_TIME\`] || trackingData[\`\${step}_START_TIME\`] || new Date().toISOString();
    
    // Some logic for fallbacks
    const foto = isEnd 
      ? (trackingData.lampiranSteps?.[val]?.["FOTO PROGRES"] || trackingData.lampiranSteps?.[val]?.["FOTO PEKERJAAN"] || trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROGRES"] || trackingData[\`FOTO \${step}\`])
      : (trackingData.lampiranSteps?.[val]?.["FOTO SEBELUM"] || trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO SEBELUM"] || trackingData[\`FOTO \${step}\`]);

    hist.push({
      status: val,
      tanggal: trackingData[timeKey] || fallbackTime,
      keterangan: trackingData[\`Keterangan \${step}\`] || trackingData[\`KETERANGAN \${step}\`] || "",
      foto: foto,
      foto1: isEnd ? trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROSES 1"] : null,
      foto2: isEnd ? trackingData.lampiranSteps?.[\`CL_\${step}\`]?.["FOTO PROSES 2"] : null,
      aktor: "",
      index: hist.length
    });
  };

  const processStep = (step: string) => {
    const val = trackingData[step];
    if (!val || val.toUpperCase() === "WAITING" || val.trim() === "") return;
    const vUpper = val.toUpperCase();

    if (step === "START") {
      if (vUpper === "TIBA DI LOKASI") {
        addHist("Menuju Lokasi", step, false);
        addHist("Tiba di Lokasi", step, true);
      } else {
        addHist(val, step, false);
      }
    } else if (step === "PERSIAPAN") {
      if (vUpper === "SIAP DIMULAI") {
        addHist("Gelar Peralatan & Briefing", step, false);
        addHist("Siap Dimulai", step, true);
      } else {
        addHist(val, step, false);
      }
    } else if (step === "PELAKSANAAN") {
      if (vUpper === "PEKERJAAN SELESAI" || vUpper === "PEKERJAAN DIHENTIKAN" || vUpper.includes("SELESAI")) {
        addHist("Pekerjaan dilaksanakan", step, false);
        addHist(val, step, true);
      } else {
        addHist(val, step, false);
      }
    } else {
      addHist(val, step, false);
    }
  };

  steps.forEach(processStep);

  // Add SWA to history if exists
  if (trackingData["SWA"]) {
    hist.push({
      status: "SWA: " + trackingData["SWA"],
      tanggal: trackingData["SWA_TIME"] || trackingData["SWA_START_TIME"] || new Date().toISOString(),
      keterangan: trackingData[\`Keterangan \${trackingData["SWA"]}\`] || trackingData["Keterangan SWA"] || trackingData["SWA"],
      foto: trackingData[trackingData["SWA"]] || trackingData["FOTO SWA"],
      aktor: "",
      index: hist.length
    });
  }

  // Add PEKERJAAN DILANJUTKAN if SWA was cleared
  if (trackingData["STATUS SWA"] === "PEKERJAAN DILANJUTKAN") {
    hist.push({
      status: "PEKERJAAN DILANJUTKAN",
      tanggal: trackingData["SWA_CLEARED_TIME"] || new Date().toISOString(),
      keterangan: "Status SWA telah dihapus dan pekerjaan dilanjutkan.",
      foto: null,
      aktor: "",
      index: hist.length
    });
  }

  // Sort chronologically by tanggal, fallback to index
  hist.sort((a, b) => {
    const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    if (timeDiff === 0) return a.index - b.index;
    return timeDiff;
  });

  return hist;
};`;

code = code.replace(regex, newLogic);
fs.writeFileSync('src/pages/WorkPlan.tsx', code);
