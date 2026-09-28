import fs from 'fs';
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const regex = /\s*\{\/\* Realisasi Modal \*\/\}.*?(?=\{\/\* Berkas Action Modal \*\/\})/s;
if (regex.test(code)) {
    code = code.replace(regex, '\n      ');
    fs.writeFileSync('src/pages/WorkPlan.tsx', code);
    console.log("Patched Realisasi Modal");
} else {
    console.log("Not found.");
}
