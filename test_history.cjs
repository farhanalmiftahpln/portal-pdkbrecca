const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The history sorting is wrong because the dates can be weirdly close and index isn't enough if they're grouped logically.
// We should sort them exactly according to the logical flow!
// Here is the logical flow of statuses:
const absoluteOrder = [
  "MENUJU LOKASI",
  "TIBA DI LOKASI",
  "GELAR PERALATAN & BRIEFING",
  "SIAP DIMULAI",
  "PEKERJAAN DILAKSANAKAN",
  "PEKERJAAN SELESAI",
  "PEKERJAAN DIHENTIKAN"
];

// So in getGeneratedHistory, we can do:
/*
  hist.sort((a, b) => {
    // try to get logical index
    const indexA = absoluteOrder.indexOf(a.status.toUpperCase());
    const indexB = absoluteOrder.indexOf(b.status.toUpperCase());
    
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) return indexA - indexB;
    }
    
    const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    if (timeDiff === 0) return a.index - b.index;
    return timeDiff;
  });
*/

// Let's patch getGeneratedHistory sorting.
