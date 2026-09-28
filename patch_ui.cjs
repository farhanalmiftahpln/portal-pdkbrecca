const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// 1. Add LINEAR_STATES and related helpers before WorkPlan function
const helpers = `
const LINEAR_STATES = [
  { step: "START", value: "Waiting", label: "Menunggu" },
  { step: "START", value: "Menuju Lokasi", label: "Menuju Lokasi" },
  { step: "PERSIAPAN", value: "Gelar Peralatan & Briefing", label: "Gelar Peralatan & Briefing", backfill: { step: "START", value: "Tiba di Lokasi" } },
  { step: "PELAKSANAAN", value: "Pekerjaan dilaksanakan", label: "Pekerjaan dilaksanakan" },
  { step: "PELAKSANAAN", value: "Pekerjaan Selesai", label: "Pekerjaan Selesai" },
  { step: "CLOSING", value: "SELESAI", label: "SELESAI" }
];

const getCurrentLinearIndex = (trackingData: any) => {
  if (!trackingData) return 0;
  if (trackingData["CLOSING"]?.toUpperCase() === "SELESAI") return 5;
  
  const pel = trackingData["PELAKSANAAN"]?.toUpperCase() || "";
  if (pel.includes("SELESAI")) return 4;
  if (pel.includes("DILAKSANAKAN") || pel.includes("DIHENTIKAN") || pel.includes("AMBIL ALIH")) return 3;
  
  const per = trackingData["PERSIAPAN"]?.toUpperCase() || "";
  if (per.includes("GELAR") || per.includes("BRIEFING")) return 2;
  
  const start = trackingData["START"]?.toUpperCase() || "";
  if (start.includes("TIBA")) return 1; // Needs to do Gelar Peralatan
  if (start.includes("MENUJU")) return 1;
  
  return 0;
};

const getGeneratedHistory = (trackingData: any) => {
  if (!trackingData) return [];
  const hist: any[] = [];
  const steps = ["START", "PERSIAPAN", "PELAKSANAAN"];
  
  // Custom mapping based on linear states
  const addHist = (val: string, step: string) => {
    hist.push({
      status: val,
      tanggal: trackingData[\`\${step}_END_TIME\`] || trackingData[\`\${step}_START_TIME\`],
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
  return hist;
};
`;

code = code.replace(
  'export default function WorkPlan() {',
  helpers + '\nexport default function WorkPlan() {'
);

// We need to inject the Lanjut and Mundur buttons in place of "Current Step Options" grid
const currentStepOptionsRegex = /\{\/\* Current Step Options \*\/\}([\s\S]*?)\{\/\* SWA SECTION \*\/\}/;

const newStepOptionsCode = `
{/* Current Step Options */}
<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 text-center">
  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">STATUS PEKERJAAN SAAT INI</h3>
  {(() => {
    const currIdx = getCurrentLinearIndex(trackingData);
    const currState = LINEAR_STATES[currIdx];
    
    if (currIdx === 5) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-green-500">
          <CheckCircle2 className="w-16 h-16 mb-4" />
          <h4 className="text-lg font-bold uppercase tracking-widest">Pekerjaan Selesai</h4>
          <p className="text-xs text-gray-400 text-center mt-2">Semua tahapan pekerjaan telah diselesaikan.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 flex flex-col items-center">
        <div className="p-4 bg-black/40 rounded-xl border border-white/10 w-full max-w-sm">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">{currState.step}</div>
          <div className="text-lg font-bold text-white uppercase tracking-widest">{currState.label}</div>
        </div>
        
        <div className="flex gap-4 w-full max-w-sm">
          <button
            disabled={!isAllowedToUpdate || currIdx === 0}
            onClick={() => {
              if (currIdx > 1) {
                const prev = LINEAR_STATES[currIdx - 1];
                saveTrackingDirectly(prev.step, prev.value);
              }
            }}
            className="flex-1 px-4 py-3 bg-black/40 text-gray-400 border border-white/10 hover:text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mundur
          </button>
          
          {currIdx === 4 ? (
            <button
              disabled={!isAllowedToUpdate}
              onClick={() => {
                const target = LINEAR_STATES[5];
                saveTrackingDirectly(target.step, target.value);
                setIsTrackingMode(false);
              }}
              className="flex-1 px-4 py-3 bg-green-500 text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selesaikan Pekerjaan
            </button>
          ) : (
            <button
              disabled={!isAllowedToUpdate}
              onClick={() => {
                const target = LINEAR_STATES[currIdx + 1];
                const req = getTrackingInputRequirements(target.step, target.value);
                if (req.needsFoto || req.needsMultipleFotos || req.needsKeterangan) {
                  openStepModal(target.step, target.value);
                } else {
                  saveTrackingDirectly(target.step, target.value);
                }
              }}
              className="flex-1 px-4 py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjut
            </button>
          )}
        </div>
      </div>
    );
  })()}
</div>

`;

code = code.replace(currentStepOptionsRegex, newStepOptionsCode + '\n                        {/* SWA SECTION */}');

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
