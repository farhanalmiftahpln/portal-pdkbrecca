const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

code = code.replace(
  /\{trackingData\?\\.\["SWA"\] \? "Ubah SWA" : "Laporkan SWA"\}/g,
  `{trackingData?.["SWA"] && trackingData?.["STATUS SWA"] !== "PEKERJAAN DILANJUTKAN" ? "Ubah SWA" : "Laporkan SWA"}`
);

code = code.replace(
  /\{trackingData\?\.SWA && trackingData\.SWA\.toUpperCase\(\) \!\=\= "DIBATALKAN" && \(/g,
  `{trackingData?.SWA && trackingData.SWA.toUpperCase() !== "DIBATALKAN" && trackingData?.["STATUS SWA"] !== "PEKERJAAN DILANJUTKAN" && (`
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
