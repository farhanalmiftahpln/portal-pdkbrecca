const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const targetHistoryFunc = `const getGeneratedHistory = (trackingData: any) => {
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

    const tsKey = "TS_" + val.toUpperCase();
    const tsTime = trackingData[tsKey];
    
    hist.push({
      status: val,
      tanggal: tsTime || trackingData[timeKey] || fallbackTime,
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
      tanggal: trackingData["TS_SWA"] || trackingData["SWA_TIME"] || trackingData["SWA_START_TIME"] || new Date().toISOString(),
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

  // Absolute logical order for statuses
  const absoluteOrder = [
    "MENUJU LOKASI",
    "TIBA DI LOKASI",
    "GELAR PERALATAN & BRIEFING",
    "SIAP DIMULAI",
    "PEKERJAAN DILAKSANAKAN",
    "PEKERJAAN SELESAI",
    "PEKERJAAN DIHENTIKAN"
  ];
  
  hist.sort((a, b) => {
    const idxA = absoluteOrder.indexOf(a.status.toUpperCase());
    const idxB = absoluteOrder.indexOf(b.status.toUpperCase());
    
    // If both are in the absolute order list, sort by their logical order!
    if (idxA !== -1 && idxB !== -1) {
      if (idxA !== idxB) return idxA - idxB;
    }
    
    // Otherwise fallback to chronological
    const parseCustomDate = (dStr) => {
      if (!dStr) return 0;
      if (typeof dStr === 'string' && dStr.includes('/')) {
        const parts = dStr.split(/[ \\/:]/);
        if (parts.length >= 5) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4])).getTime();
        }
      }
      return new Date(dStr).getTime();
    };
    
    const timeDiff = parseCustomDate(a.tanggal) - parseCustomDate(b.tanggal);
    if (timeDiff === 0 || isNaN(timeDiff)) return a.index - b.index;
    return timeDiff;
  });

  return hist;
};`;

const replacementHistoryFunc = `const getGeneratedHistory = (trackingData: any) => {
  if (!trackingData) return [];

  const stepsDef = [
    { id: "MENUJU LOKASI", column: "START", labelEnd: "Menuju Lokasi" },
    { id: "TIBA DI LOKASI", column: "START", labelEnd: "Tiba di Lokasi" },
    { id: "GELAR PERALATAN & BRIEFING", column: "PERSIAPAN", labelEnd: "Gelar Peralatan & Briefing" },
    { id: "SIAP DIMULAI", column: "PERSIAPAN", labelEnd: "Siap Dimulai" },
    { id: "PEKERJAAN DILAKSANAKAN", column: "PELAKSANAAN", labelEnd: "Pekerjaan dilaksanakan" },
    { id: "PEKERJAAN SELESAI", column: "PELAKSANAAN", labelEnd: "Pekerjaan Selesai" }
  ];

  const valStart = (trackingData["START"] || "").toUpperCase();
  const valPers = (trackingData["PERSIAPAN"] || "").toUpperCase();
  const valPelak = (trackingData["PELAKSANAAN"] || "").toUpperCase();
  const valClosing = (trackingData["CLOSING"] || "").toUpperCase();

  let currentIndex = -1;
  if (valClosing === "SELESAI" || valPelak.includes("SELESAI") || valPelak.includes("DIHENTIKAN") || valPelak.includes("AMBIL ALIH")) {
    currentIndex = 5;
    if (valPelak.includes("DIHENTIKAN")) stepsDef[5].labelEnd = "Pekerjaan Dihentikan";
    if (valPelak.includes("AMBIL ALIH")) stepsDef[5].labelEnd = "Pekerjaan Diambil Alih";
  } else if (valPelak.includes("DILAKSANAKAN")) {
    currentIndex = 4;
  } else if (valPers.includes("SIAP DIMULAI")) {
    currentIndex = 3;
  } else if (valPers.includes("GELAR") || valPers.includes("BRIEFING")) {
    currentIndex = 2;
  } else if (valStart.includes("TIBA")) {
    currentIndex = 1;
  } else if (valStart.includes("MENUJU")) {
    currentIndex = 0;
  }

  let finalTimeline: any[] = [];

  for (let i = 0; i < stepsDef.length; i++) {
    const def = stepsDef[i];
    let state = "pending";
    if (i < currentIndex) state = "completed";
    if (i === currentIndex) {
      if (i === 5) state = "completed";
      else state = "active";
    }

    let tsTime = trackingData[\`TS_\${def.labelEnd.toUpperCase()}\`];
    
    let foto = trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO PROGRES"] || 
               trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO PEKERJAAN"] || 
               trackingData.lampiranSteps?.[\`CL_\${def.column}\`]?.["FOTO PROGRES"] || 
               trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO SEBELUM"] || 
               trackingData[\`FOTO \${def.column}\`];

    let foto1 = trackingData.lampiranSteps?.[\`CL_\${def.column}\`]?.["FOTO PROSES 1"];
    let foto2 = trackingData.lampiranSteps?.[\`CL_\${def.column}\`]?.["FOTO PROSES 2"];

    let ket = trackingData[\`Keterangan \${def.column}\`] || trackingData[\`KETERANGAN \${def.column}\`] || "";

    finalTimeline.push({
      status: def.labelEnd,
      state: state, // 'pending', 'active', 'completed'
      tanggal: tsTime,
      keterangan: (state !== "pending") ? ket : "",
      foto: (state !== "pending") ? foto : null,
      foto1: (state !== "pending") ? foto1 : null,
      foto2: (state !== "pending") ? foto2 : null,
      aktor: ""
    });

    // Check SWA insertion after the current active step
    if (i === currentIndex && trackingData["SWA"]) {
      const swaAktif = trackingData["STATUS SWA"] !== "PEKERJAAN DILANJUTKAN";
      
      finalTimeline.push({
        status: "SWA: " + trackingData["SWA"],
        state: "swa_active",
        tanggal: trackingData["TS_SWA"] || trackingData["SWA_TIME"],
        keterangan: trackingData[\`Keterangan \${trackingData["SWA"]}\`] || trackingData["Keterangan SWA"] || trackingData["SWA"],
        foto: trackingData[trackingData["SWA"]] || trackingData["FOTO SWA"],
        foto1: null,
        foto2: null,
        aktor: ""
      });

      if (!swaAktif) {
        finalTimeline.push({
          status: "PEKERJAAN DILANJUTKAN",
          state: "swa_cleared",
          tanggal: trackingData["TS_SWA_CLEARED_TIME"] || trackingData["SWA_CLEARED_TIME"],
          keterangan: "Status SWA telah dihapus dan pekerjaan dilanjutkan.",
          foto: null,
          foto1: null,
          foto2: null,
          aktor: ""
        });
      }
    }
  }

  return finalTimeline;
};`;

if (!code.includes("const getGeneratedHistory = (trackingData: any) => {")) {
    console.log("Could not find getGeneratedHistory!");
    process.exit(1);
}
// Using string replacement might be tricky if the function body changed. I will just replace using substring.
const startIdx = code.indexOf("const getGeneratedHistory = (trackingData: any) => {");
const endStr = "  return hist;\n};";
const endIdx = code.indexOf(endStr, startIdx) + endStr.length;

if(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    code = code.substring(0, startIdx) + replacementHistoryFunc + code.substring(endIdx);
    console.log("Replaced getGeneratedHistory successfully.");
} else {
    console.log("Failed to extract substring for getGeneratedHistory.");
}


// Now modify the rendering of history
const targetRender = `          {history.map((h: any, i: number) => (
            <div key={i} className="flex gap-4 p-3 bg-black/20 rounded-lg border border-white/5 relative">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Clock className="w-4 h-4" />
                </div>
                {i < history.length - 1 && <div className="w-0.5 h-full bg-white/5 absolute top-11 bottom-[-1rem] left-7" />}
              </div>
              <div className="flex flex-col w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{h.status}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{formatDateTime(h.tanggal)}</span>
                </div>
                <span className="text-[10px] text-gray-400 mb-2">{h.aktor}</span>
                {h.keterangan && <p className="text-xs text-gray-300 bg-black/40 p-2 rounded">{h.keterangan}</p>}
                {(h.foto || h.foto1 || h.foto2) && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[h.foto, h.foto1, h.foto2].filter(Boolean).map((url: string, idx) => (
                      <img loading="lazy"
                        key={idx}
                        onClick={() => setZoomedImage(url)}
                        src={url}
                        alt="Bukti Progres"
                        className="h-16 w-16 object-cover rounded border border-white/10 cursor-pointer hover:opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return <p className="text-xs text-gray-500 italic">Belum ada riwayat progres</p>;
    }`;

const replacementRender = `          {history.map((h: any, i: number) => {
            let IconCmp = Clock;
            let iconColorCls = "text-gray-500 bg-white/5 border border-white/10";
            let lineCls = "bg-white/5";
            let textColorCls = "text-gray-400";
            
            if (h.state === "completed") {
              IconCmp = CheckCircle2;
              iconColorCls = "text-green-500 bg-green-500/10 border border-green-500/20";
              lineCls = "bg-green-500/20";
              textColorCls = "text-gray-200";
            } else if (h.state === "active") {
              IconCmp = Zap;
              iconColorCls = "text-orange-500 bg-orange-500/10 border border-orange-500/20";
              lineCls = "bg-orange-500/20";
              textColorCls = "text-white font-extrabold";
            } else if (h.state === "swa_active") {
              IconCmp = TriangleAlert;
              iconColorCls = "text-red-500 bg-red-500/10 border border-red-500/20";
              lineCls = "bg-red-500/20";
              textColorCls = "text-red-400 font-extrabold";
            } else if (h.state === "swa_cleared") {
              IconCmp = ShieldCheck;
              iconColorCls = "text-green-400 bg-green-400/10 border border-green-400/20";
              lineCls = "bg-green-400/20";
              textColorCls = "text-green-400 font-extrabold";
            }
            
            return (
            <div key={i} className="flex gap-4 p-3 bg-black/20 rounded-lg border border-white/5 relative">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center \${iconColorCls}\`}>
                  <IconCmp className="w-4 h-4" />
                </div>
                {i < history.length - 1 && <div className={\`w-0.5 h-full absolute top-11 bottom-[-1rem] left-7 \${lineCls}\`} />}
              </div>
              <div className="flex flex-col w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className={\`text-xs uppercase tracking-widest \${textColorCls}\`}>{h.status}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{formatDateTime(h.tanggal)}</span>
                </div>
                <span className="text-[10px] text-gray-400 mb-2">{h.aktor}</span>
                {h.keterangan && <p className="text-xs text-gray-300 bg-black/40 p-2 rounded">{h.keterangan}</p>}
                {(h.foto || h.foto1 || h.foto2) && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[h.foto, h.foto1, h.foto2].filter(Boolean).map((url: string, idx) => (
                      <img loading="lazy"
                        key={idx}
                        onClick={() => setZoomedImage(url)}
                        src={url}
                        alt="Bukti Progres"
                        className="h-16 w-16 object-cover rounded border border-white/10 cursor-pointer hover:opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      );
    } else {
      return <p className="text-xs text-gray-500 italic">Belum ada riwayat progres</p>;
    }`;

const targetRenderIdx = code.indexOf(`{history.map((h: any, i: number) => (`);
const endRenderIdx = code.indexOf(`    } else {
      return <p className="text-xs text-gray-500 italic">Belum ada riwayat progres</p>;
    }`);

if (targetRenderIdx !== -1 && endRenderIdx !== -1) {
    code = code.substring(0, targetRenderIdx) + replacementRender + code.substring(endRenderIdx + `    } else {
      return <p className="text-xs text-gray-500 italic">Belum ada riwayat progres</p>;
    }`.length);
    console.log("Replaced rendering logic successfully.");
} else {
    console.log("Failed to find rendering logic.");
}

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
