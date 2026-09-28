const fs = require('fs');
let content = fs.readFileSync('src/services/gasService.ts', 'utf8');

const targetContent = `          case 'getDashboardStats':
            resolve({
              success: true,
              data: {
                realisasiTitik: 124,
                savingKwh: 45020.5,
                savingRp: 67500000,
                saidi: 1.2,
                saifi: 0.8,
                chartUlp: [
                  { name: 'ULP A', value: 45 },
                  { name: 'ULP B', value: 30 },
                  { name: 'ULP C', value: 49 },
                ],
                recentWOs: [
                  { id: 'WO-2023-001', tanggal: '2023-10-25', status: 'Selesai', ulp: 'ULP A' },
                  { id: 'WO-2023-002', tanggal: '2023-10-26', status: 'Approval', ulp: 'ULP B' },
                ]
              }
            });
            break;`;

const newContent = `          case 'getDashboardStats':
            resolve({
              success: true,
              data: {
                targetTitik: 150,
                realisasiTitik: 124,
                targetKwh: 50000,
                savingKwh: 45020.5,
                targetRp: 80000000,
                savingRp: 67500000,
                saidi: 1.2,
                saifi: 0.8,
                chartSOP: [
                  { name: 'SOP A', value: 40, fill: '#0ea5e9' },
                  { name: 'SOP B', value: 30, fill: '#f59e0b' },
                  { name: 'SOP C', value: 20, fill: '#10b981' },
                  { name: 'SOP D', value: 15, fill: '#8b5cf6' }
                ],
                chartKategori: [
                  { name: 'Pencegahan', value: 45, fill: '#0ea5e9' },
                  { name: 'Perbaikan', value: 30, fill: '#f59e0b' },
                  { name: 'Inspeksi', value: 25, fill: '#10b981' }
                ],
                chartPenyulang: [
                  { name: 'Pyl. 1', value: 25, fill: '#ef4444' },
                  { name: 'Pyl. 2', value: 20, fill: '#f97316' },
                  { name: 'Pyl. 3', value: 15, fill: '#eab308' },
                  { name: 'Pyl. 4', value: 10, fill: '#84cc16' }
                ],
                mapData: [
                  { id: 'WO-1', lat: -5.1476, lng: 119.4327, status: 'PLANNING' },
                  { id: 'WO-2', lat: -5.1500, lng: 119.4400, status: 'PROSES EKSEKUSI' },
                  { id: 'WO-3', lat: -5.1400, lng: 119.4200, status: 'SWA' },
                  { id: 'WO-4', lat: -5.1550, lng: 119.4500, status: 'SELESAI' }
                ],
                rencanaHarian: {
                  titik: 10,
                  personil: 24,
                  kwh: 12500,
                  rp: 15000000
                },
                workPlans: [
                  { noWo: 'WO/2026/001', detail: 'Pemeliharaan Trafo 1', status: 'PLANNING' },
                  { noWo: 'WO/2026/002', detail: 'Penggantian Isolator', status: 'PROSES EKSEKUSI' },
                  { noWo: 'WO/2026/003', detail: 'Tarik Kabel JTM', status: 'SWA' },
                  { noWo: 'WO/2026/004', detail: 'Perbaikan Tiang', status: 'SELESAI' },
                  { noWo: 'WO/2026/005', detail: 'Inspeksi Jaringan', status: 'SELESAI' },
                  { noWo: 'WO/2026/006', detail: 'Pemeliharaan Trafo 2', status: 'PLANNING' },
                  { noWo: 'WO/2026/007', detail: 'Ganti Trafo', status: 'PLANNING' }
                ],
                kondisiHarian: [
                  { label: 'Personil', status: 'FIT 100%' },
                  { label: 'Cuaca', status: 'Cerah' },
                  { label: 'Kendaraan', status: 'Aman' },
                  { label: 'Peralatan', status: 'Lengkap' },
                  { label: 'APD', status: 'Lengkap' }
                ]
              }
            });
            break;`;

if (content.includes(targetContent)) {
   content = content.replace(targetContent, newContent);
   fs.writeFileSync('src/services/gasService.ts', content);
   console.log('Mock data updated successfully.');
} else {
   console.error('Target content not found! Content exists: ' + content.includes('case \'getDashboardStats\':'));
}
