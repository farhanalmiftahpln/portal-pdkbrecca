const fs = require('fs');
let code = fs.readFileSync('src/services/gasService.ts', 'utf8');

const OLD_URL = "https://script.google.com/macros/s/AKfycbzINGjdMHHl2gHQfQV1gbybIRHuMPUXoONsA6rOiDaTVDuUKvo4xDTk2o0TKEjFJsTz/exec";
const NEW_URL = "https://script.google.com/macros/s/AKfycbyY8Ll2Getp9qeCghrlkoBA67NoNLBS-va7sTI-iYxesrEGfO0Ik4DEX5wn4Xf_e2CY/exec";

code = code.replace(OLD_URL, NEW_URL);

// Fallback replace just in case the previous one wasn't what we thought
code = code.replace(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g, NEW_URL);

fs.writeFileSync('src/services/gasService.ts', code);
