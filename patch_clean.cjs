const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

// Remove the second setupPermissions
code = code.replace(/function setupPermissions\(\) {\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*try {\s*SlidesApp\.openById\([^)]+\);\s*DriveApp\.getRootFolder\(\);\s*} catch\(e\) {}\s*}\n/g, '');

fs.writeFileSync('gas-backend.js', code);
