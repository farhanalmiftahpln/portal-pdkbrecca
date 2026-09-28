const fs = require('fs');
let code = fs.readFileSync('src/pages/Guild.tsx', 'utf8');

code = code.replace(/isMobile \? '256\.025px' : 'auto'/g, "isMobile ? '261.025px' : 'auto'");

fs.writeFileSync('src/pages/Guild.tsx', code);
console.log("Updated height to 261.025px");
