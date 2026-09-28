const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const targetAddHist = `    hist.push({
      status: val,
      tanggal: trackingData[timeKey] || fallbackTime,`;

const replacementAddHist = `    const tsKey = "TS_" + val.toUpperCase();
    const tsTime = trackingData.lampiranSteps?.[\`CL_\${step}\`]?.[tsKey];
    
    hist.push({
      status: val,
      tanggal: tsTime || trackingData[timeKey] || fallbackTime,`;

code = code.replace(targetAddHist, replacementAddHist);

const targetSort = `    // Otherwise fallback to chronological
    const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    if (timeDiff === 0) return a.index - b.index;
    return timeDiff;`;

const replacementSort = `    // Otherwise fallback to chronological
    const parseCustomDate = (dStr) => {
      if (!dStr) return 0;
      if (typeof dStr === 'string' && dStr.includes('/')) {
        const parts = dStr.split(/[ \\/:]/);
        if (parts.length >= 5) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4])).getTime();
        }
      }
      return new Date(dStr).getTime();
    };
    
    const timeDiff = parseCustomDate(a.tanggal) - parseCustomDate(b.tanggal);
    if (timeDiff === 0 || isNaN(timeDiff)) return a.index - b.index;
    return timeDiff;`;

code = code.replace(targetSort, replacementSort);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
console.log("Successfully patched WorkPlan.tsx for TS_ tracking.");
