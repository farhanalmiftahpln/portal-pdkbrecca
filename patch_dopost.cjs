const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const newAction = `
      case "uploadEvidenPelaksanaan":
        result = uploadEvidenPelaksanaan(payload);
        break;`;

if (!code.includes('case "uploadEvidenPelaksanaan":')) {
  code = code.replace(/case "getKesehatanChartData":\s*result = handleGetKesehatanChartData\(payload\);\s*break;/g, (match) => {
    return match + newAction;
  });
}

fs.writeFileSync('gas-backend.js', code);
