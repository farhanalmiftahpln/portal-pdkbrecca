const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Add state
const stateInsert = `const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);`;
code = code.replace(/const \[showFilters, setShowFilters\] = useState\(false\);/, `const [showFilters, setShowFilters] = useState(false);\n  ${stateInsert}`);

// Add Update Status Section
const sectionRegex = /\{\/\* History \*\/\}/;
const updateStatusSection = `
{/* Update Status WO */}
<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 text-center shadow-xl">
  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center justify-center gap-2">
    <Activity className="w-4 h-4" /> Update Status WO
  </h3>
  {(() => {
    const history = getGeneratedHistory(trackingData);
    const latest = history.length > 0 ? history[history.length - 1] : null;
    return (
      <div className="flex flex-col items-center gap-4">
        {latest ? (
          <div className="flex flex-col items-center gap-2 mb-2 p-4 bg-black/20 rounded-lg border border-white/5 w-full max-w-sm">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Status Terakhir:</span>
            <span className="text-sm font-bold text-white uppercase tracking-widest">{latest.status}</span>
            {latest.foto && (
              <img src={latest.foto} className="w-16 h-16 object-cover rounded mt-2 border border-white/10" referrerPolicy="no-referrer" />
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic mb-4">Belum ada status terbaru</p>
        )}
        
        {isAllowedToUpdate && (
          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="w-full max-w-sm px-4 py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-primary/90 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Update Status
          </button>
        )}
      </div>
    );
  })()}
</div>

{/* History */}
`;
code = code.replace(sectionRegex, updateStatusSection);

// Add Update Status Modal
const modalRegex = /\{\/\* SWA Modal \*\/\}/;
const updateStatusModal = `
{/* Update Status Modal */}
{showUpdateStatusModal && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-[#0d161a] border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2 shrink-0">
        <Activity className="w-5 h-5" />
        Pilih Status Pekerjaan
      </h3>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {TRACKING_STEPS.map((step) => {
          const options = (trackingOptions[step] || []).filter((opt: string) => opt.toUpperCase() !== "WAITING");
          if (options.length === 0) return null;
          return (
            <div key={step} className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Tahap: {step}</h4>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowUpdateStatusModal(false);
                      const req = getTrackingInputRequirements(step, opt);
                      if (req.needsFoto || req.needsMultipleFotos || req.needsKeterangan) {
                        openStepModal(step, opt);
                      } else {
                        saveTrackingDirectly(step, opt);
                      }
                    }}
                    className="px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5 shrink-0">
        <button
          onClick={() => setShowUpdateStatusModal(false)}
          className="px-4 py-2 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}

{/* SWA Modal */}
`;
code = code.replace(modalRegex, updateStatusModal);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
