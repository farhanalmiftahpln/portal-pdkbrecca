const { formatDate } = require('./src/lib/utils.js') || {};

// Mock formatDate if we can't import it easily (it's in TS, so we just copy it)
function mockFormatDate(dateInput) {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string') {
    const partsM1 = dateInput.split('/');
    if (partsM1.length === 3 && partsM1[2].length === 4) return dateInput;
    const partsM2 = dateInput.split('-');
    if (partsM2.length === 3 && partsM2[2].length === 4) return `${partsM2[0]}/${partsM2[1]}/${partsM2[2]}`;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '-'; 
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const wos = [
  { noWo: 1363, tanggalRencanakan: '2026-07-15T16:00:00.000Z' },
  { noWo: 1362, tanggalRencanakan: '2026-07-15T16:00:00.000Z' }
];

const dateFilter = '2026-07-15'; 
const [yyyy, mm, dd] = dateFilter.split('-');
const targetDateStr = `${dd}/${mm}/${yyyy}`;

const filtered = wos.filter(wo => {
  return mockFormatDate(wo.tanggalRencanakan) === targetDateStr;
});

console.log("targetDateStr:", targetDateStr);
console.log("Filtered count:", filtered.length);
console.log("What it displays:", mockFormatDate(wos[0].tanggalRencanakan));

