const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const backfillSnippet = `
      // Auto-progress Backfill for LINEAR_STATES
      const currState = LINEAR_STATES.find(s => s.step === stepName && s.value === stepValue);
      if (currState && currState.backfill) {
        await gasService.post("updateTracking", {
          noWo: payload.noWo,
          stepName: currState.backfill.step,
          stepValue: currState.backfill.value,
          keterangan: ""
        });
      }
`;

// Replace in saveTrackingDirectly
code = code.replace(
  'alert("Progres berhasil diperbarui");\n      // Auto-progress',
  'alert("Progres berhasil diperbarui");\n' + backfillSnippet + '\n      // Auto-progress'
);

// Replace in saveTracking
code = code.replace(
  'setStepInputFotoProses2(null);\n      \n      // Auto-progress',
  'setStepInputFotoProses2(null);\n      \n' + backfillSnippet + '\n      // Auto-progress'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
