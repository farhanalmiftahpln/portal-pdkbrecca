const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const target1 = `{/* Update Status WO */}
<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 text-center shadow-xl">`;

const replacement1 = `{/* Update Status WO */}
{activeTrackingStepIndex < TRACKING_STEPS.length - 1 && (
<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 text-center shadow-xl">`;

const target2 = `        {latest?.status?.toUpperCase() === "PEKERJAAN DILAKSANAKAN" && isAllowedToUpdate && (
          <div className="flex flex-col gap-4 mt-6 w-full max-w-sm bg-black/20 p-4 rounded-xl border border-white/5">`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  // find the end of this div which is right before `{/* History */}`
  code = code.replace(`  })()}
</div>

{/* History */}`, `  })()}
</div>
)}

{/* History */}`);

  fs.writeFileSync('src/pages/WorkPlan.tsx', code);
  console.log("Successfully patched hide update status.");
} else {
  console.log("Target 1 not found");
}
