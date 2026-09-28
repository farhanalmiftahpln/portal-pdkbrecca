const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The issue with "Status Terakhir" is that the history doesn't just need to be sorted chronologically,
// we want the absolute "latest" based on the linear step order if times are identical.
// Or we could just use the current step state directly for the status.

