const fs = require('fs');
let code = fs.readFileSync('src/pages/Guild.tsx', 'utf8');

// Replace min-h-screen with h-screen overflow-hidden
code = code.replace(
  /<div className="min-h-screen bg-\[#0a0f12\] text-gray-200 font-sans flex flex-row">/,
  '<div className="h-screen overflow-hidden bg-[#0a0f12] text-gray-200 font-sans flex flex-row">'
);

// Replace main content
const startIndex = code.indexOf('{/* Main Content Area */}');
const endIndex = code.lastIndexOf('</div>');

const replacement = `{/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden bg-gradient-to-br from-[#0a0f12] to-[#0d1418] flex flex-col h-full">
        <div className="md:hidden flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0">
           Guild / <span className="text-white">{menuItems.find(m => m.id === activeTab)?.label}</span>
        </div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex-1 flex flex-col min-h-0"
        >
          {activeTab === 'dashboard' ? (
            <div 
              className="grid gap-4 w-full h-full min-h-0"
              style={{
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gridTemplateRows: 'min-content 3fr 2.5fr'
              }}
            >
              {/* Grid 1 (Top Right) */}
              <div className="col-start-2 col-span-3 row-start-1 bg-[#111c22]/80 rounded-2xl border border-white/5 p-3 flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm min-h-0">
                <div className="absolute -top-2 right-3 text-white/5 font-black text-6xl md:text-7xl pointer-events-none select-none">1</div>
                <h3 className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-2 relative z-10 shrink-0">
                  Pencapaian Kinerja
                </h3>
                <div className="grid grid-cols-4 gap-2 flex-1 relative z-10 min-h-0">
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">JUMLAH TITIK</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-white leading-none mt-auto">124 <span className="text-[8px] sm:text-[10px] text-gray-500 font-normal">/ 150</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">SAVING KWH</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-primary leading-none mt-auto">45.2K <span className="text-[8px] sm:text-[10px] text-primary/50 font-normal">/ 50K</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">SAVING RP</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-green-500 leading-none mt-auto">1.2M <span className="text-[8px] sm:text-[10px] text-green-500/50 font-normal">/ 1.5M</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">SAIDI / SAIFI</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block">Pencapaian</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-blue-500 flex items-baseline gap-1 leading-none mt-auto truncate">
                      0.45 
                      <span className="text-[8px] sm:text-[10px] text-blue-500/50 font-normal shrink-0">/ 0.60</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2 (Left) */}
              <div className="col-start-1 col-span-1 row-start-2 bg-[#111c22]/80 rounded-2xl border border-white/5 flex items-center justify-center text-gray-500 font-bold text-xl shadow-lg relative overflow-hidden backdrop-blur-sm min-h-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="text-8xl md:text-9xl font-black">2</div>
                </div>
                <span className="relative z-10">Grid 2</span>
              </div>

              {/* Grid 3 (Center) */}
              <div className="col-start-2 col-span-2 row-start-2 bg-[#111c22]/80 rounded-2xl border border-white/5 flex items-center justify-center text-gray-500 font-bold text-xl shadow-lg relative overflow-hidden backdrop-blur-sm min-h-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="text-8xl md:text-9xl font-black">3</div>
                </div>
                <span className="relative z-10">Grid 3</span>
              </div>

              {/* Grid 4 (Right) */}
              <div className="col-start-4 col-span-1 row-start-2 row-span-2 bg-[#111c22]/80 rounded-2xl border border-white/5 flex items-center justify-center text-gray-500 font-bold text-xl shadow-lg relative overflow-hidden backdrop-blur-sm min-h-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="text-8xl md:text-9xl font-black">4</div>
                </div>
                <span className="relative z-10">Grid 4</span>
              </div>

              {/* Grid 5 (Bottom) */}
              <div className="col-start-1 col-span-3 row-start-3 bg-[#111c22]/80 rounded-2xl border border-white/5 flex items-center justify-center text-gray-500 font-bold text-xl shadow-lg relative overflow-hidden backdrop-blur-sm min-h-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="text-8xl md:text-9xl font-black">5</div>
                </div>
                <span className="relative z-10">Grid 5</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#111c22]/50 border border-white/5 rounded-2xl p-6 md:p-12 h-full flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
              </div>
              
              <div className="relative z-10">
                {React.createElement(menuItems.find(m => m.id === activeTab)?.icon || LayoutDashboard, {
                  className: "w-16 h-16 md:w-20 md:h-20 text-primary/40 mb-6 mx-auto"
                })}
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
                  {menuItems.find(m => m.id === activeTab)?.label}
                </h2>
                <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                  Modul <span className="text-white font-bold">{menuItems.find(m => m.id === activeTab)?.label}</span> sedang dalam tahap sinkronisasi dengan workspace GUILD Bakti PDKB.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    `;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + '\n    </div>\n  );\n};\n';
  fs.writeFileSync('src/pages/Guild.tsx', code);
  console.log("Updated Guild layout.");
} else {
  console.log("Failed to find main content block.");
}
