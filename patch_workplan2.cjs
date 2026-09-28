const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const injectionTarget = `        {isAllowedToUpdate && (
          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="w-full max-w-sm px-4 py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-primary/90 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Update Status
          </button>
        )}`;

const injectedCode = `        {isAllowedToUpdate && (
          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="w-full max-w-sm px-4 py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-primary/90 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Update Status
          </button>
        )}
        
        {latest?.status?.toUpperCase() === "PEKERJAAN DILAKSANAKAN" && isAllowedToUpdate && (
          <div className="flex flex-col gap-4 mt-6 w-full max-w-sm bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest border-b border-white/10 pb-2 flex items-center justify-center gap-2">
              <Camera className="w-3 h-3" /> Upload Eviden Pelaksanaan
            </h4>
            
            {/* Foto Sebelum */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Sebelum
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoSebelum?.base64 ? (
                  <>
                    <img src={stepInputFotoSebelum.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoSebelum({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>

            {/* Foto Proses 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Proses 1
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoProses1?.base64 ? (
                  <>
                    <img src={stepInputFotoProses1.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoProses1({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>

            {/* Foto Proses 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Proses 2
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoProses2?.base64 ? (
                  <>
                    <img src={stepInputFotoProses2.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoProses2({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>
            
            <button
              onClick={async () => {
                if (!stepInputFotoSebelum && !stepInputFotoProses1 && !stepInputFotoProses2) {
                   alert("Pilih minimal satu foto untuk diupload!");
                   return;
                }
                setSavingTracking(true);
                const payload = {
                  noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
                  fotoSebelumBase64: stepInputFotoSebelum?.base64,
                  fotoSebelumMime: stepInputFotoSebelum?.mime,
                  fotoProses1Base64: stepInputFotoProses1?.base64,
                  fotoProses1Mime: stepInputFotoProses1?.mime,
                  fotoProses2Base64: stepInputFotoProses2?.base64,
                  fotoProses2Mime: stepInputFotoProses2?.mime,
                };
                
                const res = await gasService.post("uploadEvidenPelaksanaan", payload);
                if (res.success) {
                  alert("Eviden berhasil disimpan!");
                  setStepInputFotoSebelum(null);
                  setStepInputFotoProses1(null);
                  setStepInputFotoProses2(null);
                  // refresh tracking
                  fetchWorkPlans();
                } else {
                  alert("Gagal menyimpan eviden: " + (res.message || "Unknown error"));
                }
                setSavingTracking(false);
              }}
              disabled={savingTracking}
              className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50"
            >
              {savingTracking ? "Menyimpan..." : "Simpan Eviden"}
            </button>
          </div>
        )}`;

code = code.replace(injectionTarget, injectedCode);

// Add missing icon Camera if it's not imported
if (!code.includes("Camera,")) {
  code = code.replace(/import \{([^}]+)\} from "lucide-react";/, (match, group1) => {
    return `import { ${group1.trim()}, Camera } from "lucide-react";`;
  });
}

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
