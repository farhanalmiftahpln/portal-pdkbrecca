const fs = require('fs');
let code = fs.readFileSync('src/services/gasService.ts', 'utf8');

const OLD_URL = "https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec";
const NEW_URL = "https://script.google.com/macros/s/AKfycbzINGjdMHHl2gHQfQV1gbybIRHuMPUXoONsA6rOiDaTVDuUKvo4xDTk2o0TKEjFJsTz/exec";

code = code.replace(OLD_URL, NEW_URL);

fs.writeFileSync('src/services/gasService.ts', code);
