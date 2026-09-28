const fs = require('fs');
let code = fs.readFileSync('src/services/gasService.ts', 'utf8');

const NEW_URL = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";

code = code.replace(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g, NEW_URL);

fs.writeFileSync('src/services/gasService.ts', code);
