const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// We need to replace `generateCollage` and `renderEvaluasi`.
// I will use regex to extract the block between `const generateCollage = async () => {` and the end of `renderEvaluasi = () => { ... }`

const startIndex = code.indexOf('const generateCollage = async () => {');
if (startIndex === -1) {
  console.log("generateCollage not found!");
  process.exit(1);
}

// Find the end of renderEvaluasi. It ends with:
//           )}
//         </div>
//       </div>
//     );
//   };
// We can find the string `  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);` which comes shortly after.
// Actually, I can just look for the end of the `renderEvaluasi` function.
const endIndexSearchStr = `        </div>
      </div>
    );
  };`;
const endIndex = code.indexOf(endIndexSearchStr, startIndex) + endIndexSearchStr.length;

if (endIndex <= startIndex) {
  console.log("End of renderEvaluasi not found!");
  process.exit(1);
}

const replacement = `
  const renderEvaluasi = () => {
    const sebelumUrl = trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Sebelum"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SEBELUM"] || "";
    const sesudahUrl = trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Selesai"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SELESAI"] || "";
    const proses1Url = trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 1"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 1"] || "";
    const proses2Url = trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 2"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 2"] || "";

    return (
      <div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 mt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Evaluasi & Hasil Realisasi
        </h3>
        
        <CollageEditor 
          sebelum={sebelumUrl}
          sesudah={sesudahUrl}
          proses1={proses1Url}
          proses2={proses2Url}
          onGridReady={setCollageBase64}
        />

        <div className="space-y-4 mt-6">
          <p className="text-xs text-gray-400 leading-relaxed border-t border-white/10 pt-4">
            Pastikan semua tahapan pekerjaan telah dilakukan sesuai SOP dan IK. Dengan mengklik Selesaikan Pekerjaan, sistem akan menyimpan grid Foto Realisasi di atas dan menutup Work Order ini.
          </p>
          {isAllowedToUpdate && (
            <button
              onClick={async () => {
                setConfirmDialog({ message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini dan mengirim notifikasi?", onConfirm: async () => {
                  setConfirmDialog(null);
                  setLoadingDetail(true);
                  try {
                    const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
                    const res = await gasService.post("selesaikanPekerjaan", {
                      noWo,
                      isCanceled: false,
                      collageBase64: collageBase64,
                      collageName: noWo + " - REALISASI.jpg"
                    });
                    if (res.success) {
                      alert("Pekerjaan berhasil diselesaikan dan notifikasi terkirim!");
                      gasService.clearCache("getWorkPlans");
                      gasService.clearCache("getTracking");
                      await fetchWorkPlans();
                    } else {
                      alert("Gagal: " + (res.message || res.error || JSON.stringify(res)));
                    }
                  } catch (err: any) {
                    alert("Error: " + err.message);
                  } finally {
                    setLoadingDetail(false);
                  }
                }});
              }}
              disabled={loadingDetail || !collageBase64}
              className="w-full py-3 bg-green-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {loadingDetail ? "Menyiapkan Laporan..." : "Selesaikan Pekerjaan"}
            </button>
          )}
        </div>
      </div>
    );
  };
`;

code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync('src/pages/WorkPlan.tsx', code);
console.log("Successfully patched renderEvaluasi to use CollageEditor!");
