const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const closingBlock = `                        {/* CLOSING */}
                        {activeTrackingStepIndex === TRACKING_STEPS.length && (
                          <div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Verifikasi Penyelesaian
                            </h3>
                            <div className="space-y-4">
                              <p className="text-xs text-gray-400 leading-relaxed">
                                Pastikan semua tahapan pekerjaan telah dilakukan sesuai SOP dan IK. Dengan menyelesaikan pekerjaan ini, maka WO akan berpindah status menjadi SELESAI.
                              </p>
                              {isAllowedToUpdate && (
                                <button
                                  onClick={async () => {
                                    setConfirmDialog({ message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini?", onConfirm: async () => {
                                    setConfirmDialog(null);
                                    setLoadingDetail(true);
                                    try {
                                      const res = await gasService.post("updateTracking", {
                                        noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
                                        stepName: "CLOSING",
                                        stepValue: "SELESAI",
                                        keterangan: "Pekerjaan dinyatakan selesai.",
                                      });
                                      if (res.success) {
                                        alert("Pekerjaan berhasil diselesaikan!");
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
                                  disabled={loadingDetail}
                                  className="px-6 py-3 bg-green-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
                                >
                                  {loadingDetail ? "Memproses..." : "Selesaikan Pekerjaan"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}`;

const replacementClosing = `                        {/* EVALUASI */}
                        {activeTrackingStepIndex === TRACKING_STEPS.length - 1 && renderEvaluasi()}`;

if (code.includes('Verifikasi Penyelesaian')) {
  // we will just do a string replace of the exact block
  code = code.replace(closingBlock, replacementClosing);
  fs.writeFileSync('src/pages/WorkPlan.tsx', code);
  console.log("Successfully replaced CLOSING block with EVALUASI.");
} else {
  console.log("CLOSING block not found.");
}
