/**
 * API Integration Service for Google Apps Script (GAS) Backend
 * 
 * To use this service, you need to deploy a Google Apps Script as a Web App (doGet / doPost).
 * Example implementation of the GAS backend:
 * 
 * function doPost(e) {
 *   let data = JSON.parse(e.postData.contents);
 *   let action = data.action;
 *   // handle action...
 *   return ContentService.createTextOutput(JSON.stringify({status: 'success', data: result})).setMimeType(ContentService.MimeType.JSON);
 * }
 */

// Gunakan fallback URL langsung dari input pengguna agar lebih aman
const FALLBACK_URL =
  "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";
const RAW_URL = import.meta.env.VITE_GAS_WEB_APP_URL && import.meta.env.VITE_GAS_WEB_APP_URL.length > 5 
  ? import.meta.env.VITE_GAS_WEB_APP_URL 
  : FALLBACK_URL;

const formatUrl = (url: string) => {
  let formatted = url.trim();
  if (formatted.startsWith('http://')) {
    formatted = 'https://' + formatted.slice(7);
  }
  if (formatted.endsWith('/')) formatted = formatted.slice(0, -1);
  if (!formatted.endsWith('/exec') && !formatted.endsWith('/dev') && formatted.includes('script.google.com')) {
    formatted += '/exec';
  }
  return formatted;
};

const GAS_BACKEND_URL = '/api/gas'; // Routing all calls to local backend first

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  overview?: any;
  mutasi?: any;
  originalHeaders?: any;
}

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export const gasService = {
  /**
   * Check cache synchronously
   */
  getCached(action: string, payload: any = {}) {
    const cacheKey = `gas_cache_${action}_${JSON.stringify(payload)}`;
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return cached.data;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

  /**
   * Generic POST request to the Google Apps Script Web App
   * @param action The specific action the GAS backend should handle (e.g., 'login', 'getDashboardStats')
   * @param payload Additional data to send to the backend
   * @param useCache Whether to use caching for this request (default false)
   * @param bypassCache Whether to bypass both client and server cache to fetch fresh data (default false)
   * @returns Promise<ApiResponse>
   */
  async post<T = any>(action: string, payload: any = {}, useCache: boolean = false, bypassCache: boolean = false): Promise<ApiResponse<T>> {
    const cacheKey = `gas_cache_${action}_${JSON.stringify(payload)}`;
    
    // Auto-enable cache for GET-like requests unless explicitly bypassed
    const isRead = action.startsWith("get");
    const shouldCache = (useCache || isRead) && !bypassCache;

    if (shouldCache) {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
          }
        }
      } catch (e) {
        // ignore storage errors
      }
    }

    try {
      // For local development without a real GAS endpoint, we simulate the requests
      if (GAS_BACKEND_URL.includes('YOUR_SCRIPT_ID')) {
        return this.mockBackendResponse(action, payload);
      }

      const requestPayload = bypassCache ? { ...(payload || {}), bypassCache: true } : payload;

      const response = await fetch('/api/gas', {
        method: 'POST',
        redirect: 'follow',
        // credentials: 'omit' can sometimes cause bugs in Safari when following cross-domain redirects
        referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          action,
          payload: requestPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 50)}...`);
      }
      
      if (result.success) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
        } catch (e) {
           // ignore storage errors (quota exceeded)
        }
      }

      // If it's a mutation (not a get), clear cache so data isn't stale
      if (!isRead && result.success) {
        this.clearCache();
      }

      return result as ApiResponse<T>;
    } catch (error: any) {
      console.error(`[GAS Service Error] Action '${action}':`, error);
      return {
        success: false,
        error: error.message || 'An error occurred while communicating with the server.',
      };
    }
  },

  /**
   * Clear cache for a specific action or all actions
   */
  clearCache(action?: string) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gas_cache_')) {
          if (action) {
            if (key.startsWith(`gas_cache_${action}`)) {
               keysToRemove.push(key);
            }
          } else {
             keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  },

  /**
   * Helper function to get dropdown options from GAS backend
   */
  async getOptions(): Promise<ApiResponse> {
    return this.post('getOptions');
  },

  /**
   * Master Sheets & Unit Services
   */
  async getDataUnitList(bypassCache = false): Promise<ApiResponse> {
    return this.post('getDataUnitList', {}, true, bypassCache);
  },

  async getKodeSegmenList(bypassCache = false): Promise<ApiResponse> {
    return this.post('getKodeSegmenList', {}, true, bypassCache);
  },

  async getDataSegmenList(bypassCache = false): Promise<ApiResponse> {
    return this.post('getDataSegmenList', {}, true, bypassCache);
  },

  async getDataSegmenInputList(bypassCache = false): Promise<ApiResponse> {
    return this.post('getDataSegmenInputList', {}, true, bypassCache);
  },

  async syncWorkOrders(): Promise<ApiResponse> {
    return this.post('syncWorkOrders', {}, false, true);
  },

  async syncWorkPlans(): Promise<ApiResponse> {
    return this.post('syncWorkPlans', {}, false, true);
  },

  async syncRealisasiKerja(): Promise<ApiResponse> {
    return this.post('syncRealisasiKerja', {}, false, true);
  },

  async syncAllMasterSheets(): Promise<ApiResponse> {
    return this.post('syncAllMasterSheets', {}, false, true);
  },

  async updateDataUnit(payload: { tanggal_update?: string; rp_per_kwh: number; pelanggan_total: number }): Promise<ApiResponse> {
    return this.post('updateDataUnit', payload, false, true);
  },

  async updateKodeSegmen(payload: any): Promise<ApiResponse> {
    return this.post('updateKodeSegmen', payload, false, true);
  },

  /**
   * Warehouse 5-Submenus Services
   */
  async getWarehouseOverview(bypassCache = false): Promise<ApiResponse> {
    return this.post('getWarehouseOverview', {}, true, bypassCache);
  },

  async getWarehouseSubmenuData(submenu: string, bypassCache = false): Promise<ApiResponse> {
    return this.post('getWarehouseSubmenuData', { submenu }, true, bypassCache);
  },

  async saveWarehouseSubmenuItem(submenu: string, itemData: any): Promise<ApiResponse> {
    return this.post('saveWarehouseSubmenuItem', { submenu, ...itemData }, false, true);
  },

  async recordWarehouseSubmenuMutasi(submenu: string, mutasiData: any): Promise<ApiResponse> {
    return this.post('recordWarehouseSubmenuMutasi', { submenu, ...mutasiData }, false, true);
  },

  async syncAllWarehouseSubmenus(): Promise<ApiResponse> {
    return this.post('syncAllWarehouseSubmenus', {}, false, true);
  },

  /**
   * Mock implementations for initial UI development before the backend is fully connected
   */
  mockBackendResponse(action: string, payload: any): Promise<ApiResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (action) {
          case 'login':
            if (payload.nip === '12345678' && payload.password === 'password') {
              resolve({
                success: true,
                data: {
                  nip: '12345678',
                  name: 'Farhan Al Miftah',
                  role: 'PREPARATOR',
                  jabatan: 'Staff Preparator',
                  bidang: 'PDKB',
                  unit: 'ULP Panakkukang'
                }
              });
            } else {
              resolve({ success: false, message: 'NIP atau Password salah.' });
            }
            break;
            
          case 'getDashboardStats':
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
            break;

          case 'getWorkOrders':
            resolve({
              success: true,
              data: [
                { id: 'WO-24-001', noWo: 'WO/UP3/2026/001', tanggal: '2026-05-01', surveyor: 'Andi', ulp: 'Makassar', garduInduk: 'Tello', penyulang: 'BTP', status: 'Menunggu Approval' },
                { id: 'WO-24-002', noWo: 'WO/UP3/2026/002', tanggal: '2026-05-03', surveyor: 'Budi', ulp: 'Panakkukang', garduInduk: 'Panakkukang', penyulang: 'Borong', status: 'Disetujui' }
              ]
            })
            break;

          case 'getReviewedWOs':
             resolve({
               success: true,
               data: [
                 { noWo: 'WO/UP3/2026/001', approvalPreparator: 'Layak', ulp: 'Makassar', gi: 'Tello', penyulang: 'BTP', segmen: 'A', alamat: 'Jl. Urip Sumoharjo', foto: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=400&q=80' },
                 { noWo: 'WO/UP3/2026/002', approvalPreparator: 'Tidak Layak', ulp: 'Panakkukang', gi: 'Panakkukang', penyulang: 'Borong', segmen: 'B', alamat: 'Jl. Toddopuli', foto: 'https://images.unsplash.com/photo-1544716031-64c8d5040d85?auto=format&fit=crop&w=400&q=80' }
               ]
             })
             break;
            
          case 'getWarehouseData':
            // Mock response for WAREHOUSE
            resolve({
               success: true,
               data: [
                 {
                   NO: "1",
                   KODE: "AL-100",
                   "NAMA ALAT": "Alat Pemeliharaan",
                   "MERK / TYPE": "Merk X",
                   "SATUAN": "Set",
                   "JUMLAH": "10",
                   "KONDISI": "BAIK",
                   "LOKASI PENYIMPANAN": "Gudang A",
                   "STATUS": "MASUK",
                   "LINK GAMBAR": "https://via.placeholder.com/150",
                   "LINK QR CODE": "https://via.placeholder.com/150/0000FF",
                 },
                 {
                   NO: "2",
                   KODE: "AL-200",
                   "NAMA ALAT": "Alat Keselamatan",
                   "MERK / TYPE": "Merk Y",
                   "SATUAN": "Buah",
                   "JUMLAH": "5",
                   "KONDISI": "RUSAK",
                   "LOKASI PENYIMPANAN": "Gudang B",
                   "STATUS": "KELUAR",
                   "LINK GAMBAR": "https://via.placeholder.com/150",
                   "LINK QR CODE": "https://via.placeholder.com/150/0000FF",
                 }
               ],
               overview: { baik: 1, rusak: 1, masuk: 1, keluar: 1 }
            });
            break;
            
          case 'getAllPersonil':
            resolve({
              success: true,
              data: [
                {
                  "NAMA": "ANDI ASNAM IRFAN",
                  "JABATAN": "KEPALA REGU",
                  "FOTO": "https://i.pravatar.cc/150?u=andi",
                  "Legalitas_Lv.2": "AKTIF HINGGA 12/10/2026",
                  "Legalitas_Lv.3": "AKTIF HINGGA 05/01/2027",
                  "Legalitas_Lv.4": "EXPIRE",
                  "Sertifikat Kompetensi": "Berlaku (12/10/2026)",
                  "Sertifikat K3": "Berlaku (05/01/2027)",
                  "Surat Penunjukan": "Nomor 123/UP3/2023",
                  "Id Badge": "Aktif",
                  "Medical Checkup": "Fit (01/02/2024)",
                  "Dokumen Lain": "-"
                },
                {
                  "NAMA": "BUDIYANTO",
                  "JABATAN": "PELAKSANA",
                  "FOTO": "https://i.pravatar.cc/150?u=budi",
                  "Legalitas_Lv.2": "AKTIF HINGGA 11/11/2025",
                  "Legalitas_Lv.3": "TIDAK ADA",
                  "Legalitas_Lv.4": "TIDAK ADA",
                  "Sertifikat Kompetensi": "Berlaku (11/11/2025)",
                  "Sertifikat K3": "Berlaku (03/03/2026)",
                  "Surat Penunjukan": "Nomor 124/UP3/2023",
                  "Id Badge": "Aktif",
                  "Medical Checkup": "Fit (01/02/2024)",
                  "Dokumen Lain": "-"
                }
              ]
            });
            break;
            
          case 'getPersonilDetail':
            resolve({
              success: true,
              data: {
                "Sertifikat Kompetensi": "Berlaku (12/10/2026)",
                "Sertifikat K3": "Berlaku (05/01/2027)",
                "Surat Penunjukan": "Nomor 123/UP3/2023",
                "Id Badge": "Aktif",
                "Medical Checkup": "Fit (01/02/2024)",
                "Dokumen Lain": "-"
              }
            });
            break;

          case 'getKesehatanForm':
            resolve({
              success: true,
              data: {
                items: [
                  "Tekanan Darah Normal",
                  "Suhu Tubuh Normal",
                  "Gula Darah Normal",
                  "Tidak Sedang Sakit",
                  "Tidur Cukup (Minimal 6 Jam)"
                ],
                fisikItems: [
                  "Tekanan Darah Normal",
                  "Suhu Tubuh Normal",
                  "Gula Darah Normal",
                ],
                mentalItems: [
                  "Tidak Sedang Sakit",
                  "Tidur Cukup (Minimal 6 Jam)"
                ],
                personil: [
                  "Andi", "Budi", "Cakra", "Deni", "Erwin", "Fahmi", "Gilang", "Heri"
                ]
              }
            });
            break;
            
          case 'submitKesehatan':
            resolve({
              success: true,
              message: 'Update Kesehatan berhasil disimpan.'
            });
            break;
            
          default:
            resolve({
              success: true,
              data: { message: `Mock response for ${action} successful.` },
            });
        }
      }, 800); // simulate network delay
    });
  }
};
