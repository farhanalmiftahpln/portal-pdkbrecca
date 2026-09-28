const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const errStr = "const { ilike } = require('drizzle-orm');";
code = code.replace(errStr, "");

if (!code.includes("import { eq, ilike } from 'drizzle-orm';")) {
  code = code.replace("import { eq } from 'drizzle-orm';", "import { eq, ilike } from 'drizzle-orm';");
}

fs.writeFileSync('server.ts', code);
