const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The block starts with {currIdx === 4 ? ( ... )
const searchStr = '{currIdx === 4 ? (\\s*<button[\\s\\S]*?>[\\s\\S]*?Selesaikan Pekerjaan[\\s\\S]*?</button>\\s*) : \\(';

const replacement = `{currIdx === 4 ? (
            <button
              disabled={!isAllowedToUpdate}
              onClick={() => {
                setConfirmDialog({ 
                  message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini? Sistem akan mengirim notifikasi ke PREPARATOR bahwa WO ini telah selesai.", 
                  onConfirm: async () => {
                    setConfirmDialog(null);
                    const target = LINEAR_STATES[5];
                    await saveTrackingDirectly(target.step, target.value);
                    setIsTrackingMode(false);
                  }
                });
              }}
              className="flex-1 px-4 py-3 bg-green-500 text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selesaikan Pekerjaan
            </button>
          ) : (`;

code = code.replace(new RegExp(searchStr), replacement);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
