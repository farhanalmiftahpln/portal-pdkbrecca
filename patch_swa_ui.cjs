const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Add SWA button above Progress Stepper
const addSwaRegex = /\{\/\* Progress Stepper \*\/\}/;
const swaButtonCode = `
{/* SWA Top Button */}
{isAllowedToUpdate && (
  <div className="flex justify-end -mb-2">
    <button
      onClick={() => setShowSWAModal(true)}
      className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
    >
      <ShieldCheck className="w-4 h-4" />
      {trackingData?.["SWA"] ? "Ubah SWA" : "Laporkan SWA"}
    </button>
  </div>
)}

{/* Progress Stepper */}
`;
code = code.replace(addSwaRegex, swaButtonCode);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
