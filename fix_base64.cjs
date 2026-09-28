const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

const base64Helper = `
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
`;

if (!code.includes('const convertFileToBase64')) {
  // Insert right after the imports
  code = code.replace(/import .*?;\n\n/m, (match) => {
    return match + base64Helper + '\n';
  });
  // Fallback if the regex doesn't hit perfectly
  if (!code.includes('const convertFileToBase64')) {
     const splitIndex = code.indexOf('export default function WorkPlan()');
     code = code.substring(0, splitIndex) + base64Helper + '\n' + code.substring(splitIndex);
  }
  fs.writeFileSync('src/pages/WorkPlan.tsx', code);
}
