const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Find where trackingData is defined
const trackingDataRegex = /const \[trackingData, setTrackingData\] = useState<any>\(\{\}\);/;
const useEffectCode = `
  useEffect(() => {
    if (Object.keys(trackingData).length > 0) {
      let targetIndex = 0;
      for (let i = 0; i < TRACKING_STEPS.length; i++) {
        const step = TRACKING_STEPS[i];
        const val = trackingData[step];
        targetIndex = i;
        if (!val || ![
            "ON SITE",
            "SIAP DIMULAI",
            "PEKERJAAN SELESAI",
            "SELESAI",
            "DIBATALKAN",
            "PEKERJAAN DIHENTIKAN",
            "TIBA DI LOKASI",
            "GELAR PERALATAN & BRIEFING"
          ].includes(val.trim().toUpperCase())) {
          break; // Stop at the first uncompleted step
        }
      }
      setActiveTrackingStepIndex(targetIndex);
    }
  }, [trackingData]);
`;

if(code.match(trackingDataRegex)){
  console.log("Found trackingData declaration.");
} else {
  console.log("Not found.");
}
