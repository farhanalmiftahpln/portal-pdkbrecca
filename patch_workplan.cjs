const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// 1. Update TRACKING_STEPS
code = code.replace(
  'const TRACKING_STEPS = ["START", "PERSIAPAN", "PELAKSANAAN"];',
  'const TRACKING_STEPS = ["START", "PERSIAPAN", "PELAKSANAAN", "EVALUASI"];'
);

// 2. Add collage generator and render logic inside the component.
// We'll place it right before the "return (" of WorkPlan
const renderEvaluasiStr = `
  const generateCollage = async () => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      const w = 800;
      const h = 800;
      const halfW = w / 2;
      const halfH = h / 2;
      canvas.width = w;
      canvas.height = h;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      const areas = [
        { url: trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Sebelum"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SEBELUM"], label: "FOTO SEBELUM", x: 0, y: 0 },
        { url: trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Selesai"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SELESAI"], label: "FOTO SELESAI", x: halfW, y: 0 },
        { url: trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 1"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 1"], label: "FOTO PROSES 1", x: 0, y: halfH },
        { url: trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 2"] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 2"], label: "FOTO PROSES 2", x: halfW, y: halfH },
      ];

      const drawImagePromise = (area: any) => {
        return new Promise<void>((res) => {
          if (!area.url) {
            ctx.fillStyle = "#e5e7eb";
            ctx.fillRect(area.x, area.y, halfW, halfH);
            ctx.fillStyle = "#374151";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("TIDAK ADA FOTO", area.x + halfW/2, area.y + halfH/2);
            ctx.fillStyle = "#000000";
            ctx.fillRect(area.x, area.y + halfH - 40, halfW, 40);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(area.label, area.x + halfW/2, area.y + halfH - 15);
            res();
            return;
          }

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            // Fill background and draw image covering the area
            ctx.fillStyle = "#000";
            ctx.fillRect(area.x, area.y, halfW, halfH);
            const scale = Math.max(halfW / img.width, halfH / img.height);
            const dx = area.x + (halfW - img.width * scale) / 2;
            const dy = area.y + (halfH - img.height * scale) / 2;
            ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
            
            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.7;
            ctx.fillRect(area.x, area.y + halfH - 40, halfW, 40);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(area.label, area.x + halfW/2, area.y + halfH - 15);
            res();
          };
          img.onerror = () => {
            ctx.fillStyle = "#e5e7eb";
            ctx.fillRect(area.x, area.y, halfW, halfH);
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("GAGAL MUAT", area.x + halfW/2, area.y + halfH/2);
            res();
          };
          img.src = area.url;
        });
      };

      Promise.all(areas.map(drawImagePromise)).then(() => {
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      });
    });
  };

  const renderEvaluasi = () => {
    return (
      <div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 mt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Evaluasi & Hasil Realisasi
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "FOTO SEBELUM", key: "Foto Sebelum", key2: "FOTO SEBELUM" },
            { label: "FOTO SELESAI", key: "Foto Selesai", key2: "FOTO SELESAI" },
            { label: "FOTO PROSES 1", key: "Foto Proses 1", key2: "FOTO PROSES 1" },
            { label: "FOTO PROSES 2", key: "Foto Proses 2", key2: "FOTO PROSES 2" }
          ].map((item, i) => {
            const url = trackingData?.lampiranSteps?.CL_PELAKSANAAN?.[item.key] || trackingData?.lampiranSteps?.CL_PELAKSANAAN?.[item.key2];
            return (
              <div key={i} className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 font-bold tracking-widest">{item.label}</span>
                <div className="h-24 bg-black/40 rounded-lg overflow-hidden relative">
                  {url ? <img src={url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600">KOSONG</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed border-t border-white/10 pt-4">
            Pastikan semua tahapan pekerjaan telah dilakukan sesuai SOP dan IK. Dengan mengklik Selesaikan Pekerjaan, sistem akan membuat grid Foto Realisasi dan menutup Work Order ini.
          </p>
          {isAllowedToUpdate && (
            <button
              onClick={async () => {
                setConfirmDialog({ message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini dan mengirim notifikasi?", onConfirm: async () => {
                  setConfirmDialog(null);
                  setLoadingDetail(true);
                  try {
                    const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
                    const b64 = await generateCollage();
                    const res = await gasService.post("selesaikanPekerjaan", {
                      noWo,
                      isCanceled: false,
                      collageBase64: b64,
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
              disabled={loadingDetail}
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

const returnIndex = code.indexOf('return (');
code = code.slice(0, returnIndex) + renderEvaluasiStr + '\n  ' + code.slice(returnIndex);

// 3. Replace the CLOSING block
const closingRegex = /\{\/\*\s*CLOSING\s*\*\/\}.*?\{\/\*\s*END OF TRACKING VIEW\s*\*\/\}/s;
const replacementClosing = `{/* EVALUASI */}
                        {activeTrackingStepIndex === TRACKING_STEPS.length - 1 && renderEvaluasi()}
                      </div>
                    </div>
                    {/* END OF TRACKING VIEW */}`;
code = code.replace(closingRegex, replacementClosing);

// In case the old closing block is not matching properly due to spaces, let's also remove the extra stuff.
// Or wait, "CLOSING" might be at activeTrackingStepIndex === TRACKING_STEPS.length
// Let's do a strict replace
const closingStrictRegex = /\{\/\*\s*CLOSING\s*\*\/\}.*?\{activeTrackingStepIndex === TRACKING_STEPS\.length && \([^]*?\}\)\}/;
code = code.replace(closingStrictRegex, `{/* EVALUASI */}
                        {activeTrackingStepIndex === TRACKING_STEPS.length - 1 && renderEvaluasi()}`);

// One more place: in the modal where it says "Semua tahapan pekerjaan telah selesai."
code = code.replace(
  'if (activeTrackingStepIndex >= TRACKING_STEPS.length) {',
  'if (activeTrackingStepIndex >= TRACKING_STEPS.length - 1) {' // Evaluasi is the last step, no manual status update for it
);
code = code.replace(
  'return <p className="text-xs text-gray-500 italic">Semua tahapan pekerjaan telah selesai. Silakan lakukan Verifikasi Penyelesaian.</p>;',
  'return <p className="text-xs text-gray-500 italic">Tahapan eksekusi telah selesai. Silakan lakukan Evaluasi.</p>;'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
