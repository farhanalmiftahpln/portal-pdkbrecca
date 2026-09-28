const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

const formatDateTimeCode = `
export function formatDateTime(dateInput: any): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '-';
  
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return \`\${day} \${month} \${year}, \${hours}:\${minutes}\`;
}
`;

code += formatDateTimeCode;
fs.writeFileSync('src/lib/utils.ts', code);
