const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// The issue might be related to CORS or payload size when uploading 3 base64 images.
// Or it might just be the backend url mismatch if they forgot to update it in their local env.

code = code.replace(
  /const payload = {\s*noWo:[^}]+};/m,
  (match) => {
    return match;
  }
);

