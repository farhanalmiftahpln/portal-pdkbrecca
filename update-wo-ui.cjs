const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkOrder.tsx', 'utf-8');

// Add useRef
code = code.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// Add states
code = code.replace(
  "const [showLlcConfirm, setShowLlcConfirm] = useState(false);",
  "const [showLlcConfirm, setShowLlcConfirm] = useState(false);\n  const [showFotoLlc, setShowFotoLlc] = useState<string | null>(null);\n  const longPressTimer = useRef<NodeJS.Timeout | null>(null);\n  const [isLongPress, setIsLongPress] = useState(false);"
);

// Update handleLlcConfirm
code = code.replace(
  "const handleLlcConfirm = () => {",
  "const handleLlcConfirm = async () => {"
);
code = code.replace(
  /setSelectedLlcItem\(null\);\n    }\n  };/g,
  `setSelectedLlcItem(null);\n      \n      try {\n        await gasService.post('updateLlcStatus', { rowIndex: selectedLlcItem._rowIndex, status: 'SUDAH DIRENCAKAN' });\n        setLlcData(prev => prev.map(item => item._rowIndex === selectedLlcItem._rowIndex ? { ...item, 'STATUS PEMELIHARAAN': 'SUDAH DIRENCAKAN' } : item));\n      } catch(e) {}\n    }\n  };`
);

// Replace LLC List Item UI
const oldItemUI = `<div 
                      key={idx} 
                      className="bg-[#1a252b] border border-white/5 p-3 rounded hover:border-primary/50 cursor-pointer transition"
                      onClick={() => { setSelectedLlcItem(item); setShowLlcConfirm(true); }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-white">{item['PENYULANG']} - {item['SEGMEN/ZONA']}</div>
                        <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{item['STATUS PEMELIHARAAN']}</div>
                      </div>
                      <div className="text-xs text-yellow-400/90 mb-1 font-medium">{item['TEMUAN SEBELUMNYA']}</div>
                      <div className="text-xs text-gray-400 mb-1">{item['ALAMAT']}</div>
                      <div className="flex gap-4 text-[10px] text-gray-500">
                        <span>GI: {item['GARDU INDUK']}</span>
                        <span>Jadwal: {item['JADWAL PEMELIHARAAN']}</span>
                        <span>Koordinat: {item['TITIK KOORDINAT']}</span>
                      </div>
                    </div>`;

const newItemUI = `<div 
                      key={idx} 
                      className="bg-[#1a252b] border border-white/5 p-3 rounded hover:border-primary/50 cursor-pointer transition"
                      onPointerDown={() => {
                        setIsLongPress(false);
                        longPressTimer.current = setTimeout(() => {
                          setIsLongPress(true);
                          if (item['FOTO SESUDAH']) setShowFotoLlc(item['FOTO SESUDAH']);
                        }, 500);
                      }}
                      onPointerUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                      onPointerLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                      onClick={(e) => { 
                        if (isLongPress) { e.preventDefault(); return; }
                        setSelectedLlcItem(item); 
                        setShowLlcConfirm(true); 
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-white">[{item['PENYULANG']}] - [{item['SEGMEN/ZONA']}]</div>
                        <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{item['STATUS PEMELIHARAAN']}</div>
                      </div>
                      <div className="text-xs text-yellow-400/90 mb-1 font-medium">{item['TEMUAN SEBELUMNYA']}</div>
                      <div className="text-xs text-gray-400 mb-1">{item['ALAMAT']}</div>
                      <div className="flex gap-4 text-[10px] text-gray-500">
                        <span>GI: {item['GARDU INDUK']}</span>
                        <span>Jadwal: {item['JADWAL PEMELIHARAAN']}</span>
                        <span>Koordinat: {item['TITIK KOORDINAT'] ? (
                          <a 
                            href={\`https://www.google.com/maps/search/?api=1&query=\${item['TITIK KOORDINAT']}\`} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >{item['TITIK KOORDINAT']}</a>
                        ) : '-'}</span>
                      </div>
                    </div>`;

code = code.replace(oldItemUI, newItemUI);

const fotoModal = `
      {/* LLC Foto Modal */}
      {showFotoLlc && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowFotoLlc(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <img src={showFotoLlc} alt="Foto LLC" className="w-full h-full object-contain" />
            <button 
              onClick={() => setShowFotoLlc(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>
      )}
`;

const lines = code.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('{/* Confirmation Modal */}')) {
    lines.splice(i, 0, fotoModal);
    break;
  }
}
code = lines.join('\n');

fs.writeFileSync('src/pages/WorkOrder.tsx', code);
console.log('Update applied successfully.');
