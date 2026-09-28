const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const useEffectToInsert = `
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
  }, [trackingData, TRACKING_STEPS]);
`;

// Insert the useEffect after trackingData state definition
code = code.replace(
  /const \[trackingData, setTrackingData\] = useState<any>\(\{\}\);/,
  `const [trackingData, setTrackingData] = useState<any>({});\n${useEffectToInsert}`
);

// Remove the manual iterations from loadTracking to avoid duplication
const loadTrackingRegex = /const loadTracking = async \([\s\S]*?const loadDetail = async/m;
const loadTrackingOriginal = code.match(loadTrackingRegex)[0];

const loadTrackingModified = loadTrackingOriginal
  .replace(/let targetIndex = 0;\s*for \(let i = 0; i < TRACKING_STEPS\.length; i\+\+\) \{[\s\S]*?\}\s*setActiveTrackingStepIndex\(targetIndex\);/g, '')
  .replace(/setActiveTrackingStepIndex\(0\);/g, '');

code = code.replace(loadTrackingOriginal, loadTrackingModified);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
