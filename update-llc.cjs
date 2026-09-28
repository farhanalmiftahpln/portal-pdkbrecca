const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkOrder.tsx', 'utf-8');

// Update getUniqueValues
code = code.replace(
  'const getUniqueValues = (key: string) => {\n    return Array.from(new Set(llcData.map(item => item[key]).filter(Boolean)));\n  };',
  `const getUniqueValues = (key: string, condition?: Record<string, string>) => {
    return Array.from(new Set(llcData.filter(item => {
      if (!condition) return true;
      for (const k in condition) {
        if (condition[k] && item[k] !== condition[k]) return false;
      }
      return true;
    }).map(item => item[key]).filter(Boolean)));
  };`
);

// Replace the filters JSX
const oldFilters = `<select value={llcFilters.ulp} onChange={e => setLlcFilters(prev => ({ ...prev, ulp: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua ULP</option>
                {getUniqueValues('ULP').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.garduInduk} onChange={e => setLlcFilters(prev => ({ ...prev, garduInduk: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua GI</option>
                {getUniqueValues('GARDU INDUK').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.penyulang} onChange={e => setLlcFilters(prev => ({ ...prev, penyulang: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Penyulang</option>
                {getUniqueValues('PENYULANG').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.segmen} onChange={e => setLlcFilters(prev => ({ ...prev, segmen: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Segmen</option>
                {getUniqueValues('SEGMEN/ZONA').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>`;

const newFilters = `<select value={llcFilters.ulp} onChange={e => setLlcFilters(prev => ({ ...prev, ulp: e.target.value, garduInduk: '', penyulang: '', segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua ULP</option>
                {getUniqueValues('ULP').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.garduInduk} onChange={e => setLlcFilters(prev => ({ ...prev, garduInduk: e.target.value, penyulang: '', segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua GI</option>
                {getUniqueValues('GARDU INDUK', { 'ULP': llcFilters.ulp }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.penyulang} onChange={e => setLlcFilters(prev => ({ ...prev, penyulang: e.target.value, segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Penyulang</option>
                {getUniqueValues('PENYULANG', { 'ULP': llcFilters.ulp, 'GARDU INDUK': llcFilters.garduInduk }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.segmen} onChange={e => setLlcFilters(prev => ({ ...prev, segmen: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Segmen</option>
                {getUniqueValues('SEGMEN/ZONA', { 'ULP': llcFilters.ulp, 'GARDU INDUK': llcFilters.garduInduk, 'PENYULANG': llcFilters.penyulang }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>`;
              
code = code.replace(oldFilters, newFilters);

// Replace the list item UI
const oldItemUI = `<div className="text-xs text-gray-400 mb-1">{item['ALAMAT']}</div>
                      <div className="flex gap-4 text-[10px] text-gray-500">
                        <span>GI: {item['GARDU INDUK']}</span>
                        <span>Prioritas: {item['SKALA PRIORITAS']}</span>
                        <span>Koordinat: {item['TITIK KOORDINAT']}</span>
                      </div>`;

const newItemUI = `<div className="text-xs text-yellow-400/90 mb-1 font-medium">{item['TEMUAN SEBELUMNYA']}</div>
                      <div className="text-xs text-gray-400 mb-1">{item['ALAMAT']}</div>
                      <div className="flex gap-4 text-[10px] text-gray-500">
                        <span>GI: {item['GARDU INDUK']}</span>
                        <span>Jadwal: {item['JADWAL PEMELIHARAAN']}</span>
                        <span>Koordinat: {item['TITIK KOORDINAT']}</span>
                      </div>`;

code = code.replace(oldItemUI, newItemUI);

fs.writeFileSync('src/pages/WorkOrder.tsx', code);
console.log('Update applied successfully.');
