import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const GAS_URL = process.env.VITE_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const s = String(val).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export async function fetchGasWarehouseData(sheetName: string): Promise<any[]> {
  console.log(`[WAREHOUSE MIGRATE] Fetching sheet: ${sheetName}...`);
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getWarehouseData', payload: { sheetName } })
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err: any) {
    console.error(`[WAREHOUSE MIGRATE] Error fetching ${sheetName}:`, err.message);
  }
  return [];
}

export async function migrateAllWarehouseSubmenus() {
  console.log('=== STARTING WAREHOUSE SUBMENUS MIGRATION ===');

  // 1. PERALATAN KERJA
  const pkRaw = await fetchGasWarehouseData('PERALATAN KERJA');
  const pkList = pkRaw.map((row, idx) => ({
    id: idx + 1,
    no: row['NO'] || String(idx + 1),
    gambar: row['GAMBAR'] || '',
    qr_code: row['QR CODE'] || '',
    nama_peralatan: row['NAMA PERALATAN'] || '',
    kode: row['KODE'] || `PK-${idx + 1}`,
    merk: row['MERK'] || '',
    kondisi: (row['KONDISI'] || 'BAIK').toUpperCase(),
    tgl_uji: row['TGL UJI'] || '-',
    status: (row['STATUS'] || 'TERSEDIA').toUpperCase(),
    jenis: row['JENIS'] || 'ISOLASI',
    link_qr_code: row['LINK QR CODE'] || '',
    link_gambar: row['LINK GAMBAR'] || '',
    link_gdrive: row['LINK GDRIVE'] || '',
    mutasi_terakhir_tgl: '',
    mutasi_jenis: '',
    mutasi_jumlah: 0,
    mutasi_pic: '',
    mutasi_keterangan: '',
    riwayat_mutasi: []
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'warehouse_peralatan_kerja.json'), JSON.stringify(pkList, null, 2), 'utf-8');
  console.log(`[MIGRATE] Peralatan Kerja: ${pkList.length} items saved.`);

  // 2. PERALATAN K2/K3
  const k2k3Raw = await fetchGasWarehouseData('PERALATAN K2/K3');
  const k2k3List = k2k3Raw.map((row, idx) => ({
    id: idx + 1,
    no: row['NO'] || String(idx + 1),
    gambar: row['GAMBAR'] || '',
    qr_code: row['QR CODE'] || '',
    nama_peralatan: row['NAMA PERALATAN'] || '',
    kode: row['KODE'] || `K2-${idx + 1}`,
    merk: row['MERK'] || '',
    kondisi: (row['KONDISI'] || 'BAIK').toUpperCase(),
    tgl_uji: row['TGL UJI'] || '-',
    status: (row['STATUS'] || 'TERSEDIA').toUpperCase(),
    jenis: row['JENIS'] || 'APD',
    link_qr_code: row['LINK QR CODE'] || '',
    link_gambar: row['LINK GAMBAR'] || '',
    link_gdrive: row['LINK GDRIVE'] || '',
    mutasi_terakhir_tgl: '',
    mutasi_jenis: '',
    mutasi_jumlah: 0,
    mutasi_pic: '',
    mutasi_keterangan: '',
    riwayat_mutasi: []
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'warehouse_peralatan_k2k3.json'), JSON.stringify(k2k3List, null, 2), 'utf-8');
  console.log(`[MIGRATE] Peralatan K2/K3: ${k2k3List.length} items saved.`);

  // 3. MATERIAL
  const matRaw = await fetchGasWarehouseData('MATERIAL');
  const matList = matRaw.map((row, idx) => {
    const stokGudang = parseNumber(row['STOK GUDANG']);
    const stokMobil = parseNumber(row['STOK MOBIL']);
    const totalStok = parseNumber(row['TOTAL STOK']) || (stokGudang + stokMobil);
    return {
      id: idx + 1,
      no: row['NO'] || String(idx + 1),
      gambar: row['GAMBAR'] || '',
      qr_code: row['QR CODE'] || '',
      nama_jenis: row['NAMA - JENIS'] || '',
      kode: row['KODE'] || `MAT-${idx + 1}`,
      merk: row['MERK'] || '',
      stok_gudang: stokGudang,
      stok_mobil: stokMobil,
      total_stok: totalStok,
      link_qr_code: row['LINK QR CODE'] || '',
      link_gambar: row['LINK GAMBAR'] || '',
      link_gdrive: row['LINK GDRIVE'] || '',
      mutasi_terakhir_tgl: '',
      mutasi_jenis: '',
      mutasi_jumlah: 0,
      mutasi_pic: '',
      mutasi_keterangan: '',
      riwayat_mutasi: []
    };
  });
  fs.writeFileSync(path.join(DATA_DIR, 'warehouse_material.json'), JSON.stringify(matList, null, 2), 'utf-8');
  console.log(`[MIGRATE] Material: ${matList.length} items saved.`);

  // 4. KENDARAAN
  const kndRaw = await fetchGasWarehouseData('KENDARAAN');
  const kndList = kndRaw.map((row, idx) => ({
    id: idx + 1,
    nama_kendaraan: row['NAMA KENDARAAN'] || 'Kendaraan Operasional',
    plat_kendaraan: row['PLAT KENDARAAN'] || `DD-${idx + 1}`,
    expire_plat: row['EXPIRE PLAT'] || '-',
    merk_tipe: row['MERK / TIPE'] || '',
    no_rangka: row['NO. RANGKA'] || '',
    no_mesin: row['NO. MESIN'] || '',
    status_pajak_tahunan: row['STATUS PAJAK TAHUNAN'] || 'AKTIF',
    status_pajak_5_tahunan: row['STATUS PAJAK 5 TAHUNAN'] || 'AKTIF',
    status_bbm: row['STATUS BBM'] || 'FULL',
    kondisi: (row['KONDISI'] || 'BAIK').toUpperCase(),
    keterangan: row['KETERANGAN'] || '',
    foto_kendaraan: row['FOTO KENDARAAN'] || '',
    link_gdrive_kendaraan: row['LINK GDRIVE KENDARAAN'] || '',
    link_foto_stnk: row['LINK FOTO STNK'] || '',
    link_gdrive_stnk: row['LINK GDRIVE STNK'] || '',
    mutasi_terakhir_tgl: '',
    mutasi_jenis: '',
    mutasi_odometer_km: 0,
    mutasi_driver: '',
    mutasi_tujuan_wo: '',
    mutasi_keterangan: '',
    riwayat_mutasi: []
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'warehouse_kendaraan.json'), JSON.stringify(kndList, null, 2), 'utf-8');
  console.log(`[MIGRATE] Kendaraan: ${kndList.length} items saved.`);

  // 5. INVENTARIS KANTOR
  // Check if existing data exists in file, otherwise provide initial realistic PDKB office inventory
  const invFilePath = path.join(DATA_DIR, 'warehouse_inventaris_kantor.json');
  let invList: any[] = [];
  if (fs.existsSync(invFilePath)) {
    try {
      invList = JSON.parse(fs.readFileSync(invFilePath, 'utf-8'));
    } catch (e) {}
  }
  if (!invList || invList.length === 0) {
    invList = [
      {
        id: 1,
        no: '1',
        kode: 'INV-001',
        nama_barang: 'Laptop Asus ExpertBook Preparator',
        merk_tipe: 'ASUS / Core i7 16GB',
        jumlah: 2,
        kondisi: 'BAIK',
        lokasi_ruangan: 'Ruang Staff PDKB',
        penanggung_jawab: 'Staff Preparator',
        keterangan: 'Operasional perencanaan & work order PDKB',
        link_gambar: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        link_qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-001',
        mutasi_terakhir_tgl: '',
        mutasi_jenis: '',
        mutasi_jumlah: 0,
        mutasi_pic: '',
        mutasi_keterangan: '',
        riwayat_mutasi: []
      },
      {
        id: 2,
        no: '2',
        kode: 'INV-002',
        nama_barang: 'Printer Epson L3210 Multifungsi',
        merk_tipe: 'Epson / L3210 All-in-One',
        jumlah: 1,
        kondisi: 'BAIK',
        lokasi_ruangan: 'Ruang Administrasi PDKB',
        penanggung_jawab: 'Admin Gudang',
        keterangan: 'Cetak SOP, Form Manuver, dan Berita Acara',
        link_gambar: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500',
        link_qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-002',
        mutasi_terakhir_tgl: '',
        mutasi_jenis: '',
        mutasi_jumlah: 0,
        mutasi_pic: '',
        mutasi_keterangan: '',
        riwayat_mutasi: []
      },
      {
        id: 3,
        no: '3',
        kode: 'INV-003',
        nama_barang: 'Meja Kerja Teknisi & Preparator',
        merk_tipe: 'Informa / Wooden Metal Desk',
        jumlah: 6,
        kondisi: 'BAIK',
        lokasi_ruangan: 'Ruang Staff PDKB',
        penanggung_jawab: 'Koordinator PDKB',
        keterangan: 'Meja kerja tim PDKB',
        link_gambar: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
        link_qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-003',
        mutasi_terakhir_tgl: '',
        mutasi_jenis: '',
        mutasi_jumlah: 0,
        mutasi_pic: '',
        mutasi_keterangan: '',
        riwayat_mutasi: []
      },
      {
        id: 4,
        no: '4',
        kode: 'INV-004',
        nama_barang: 'Whiteboard Briefing PDKB (120x240cm)',
        merk_tipe: 'Sakana / Magnetic Whiteboard',
        jumlah: 1,
        kondisi: 'BAIK',
        lokasi_ruangan: 'Ruang Briefing & K3',
        penanggung_jawab: 'Pengawas K3',
        keterangan: 'Media safety briefing harian & pembagian tugas',
        link_gambar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=500',
        link_qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-004',
        mutasi_terakhir_tgl: '',
        mutasi_jenis: '',
        mutasi_jumlah: 0,
        mutasi_pic: '',
        mutasi_keterangan: '',
        riwayat_mutasi: []
      },
      {
        id: 5,
        no: '5',
        kode: 'INV-005',
        nama_barang: 'Lemari Arsip Dokumen PDKB & K2/K3',
        merk_tipe: 'Lion / 2 Pintu Kaca',
        jumlah: 2,
        kondisi: 'BAIK',
        lokasi_ruangan: 'Ruang Arsip PDKB',
        penanggung_jawab: 'Staff K3L',
        keterangan: 'Penyimpanan sertifikat uji alat, SOP, IK, dan laporan',
        link_gambar: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500',
        link_qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-005',
        mutasi_terakhir_tgl: '',
        mutasi_jenis: '',
        mutasi_jumlah: 0,
        mutasi_pic: '',
        mutasi_keterangan: '',
        riwayat_mutasi: []
      }
    ];
  }
  fs.writeFileSync(invFilePath, JSON.stringify(invList, null, 2), 'utf-8');
  console.log(`[MIGRATE] Inventaris Kantor: ${invList.length} items saved.`);

  // Attempt Supabase Upserts if tables exist
  if (supabase) {
    try {
      await supabase.from('warehouse_peralatan_kerja').upsert(pkList.slice(0, 100), { onConflict: 'id' });
      await supabase.from('warehouse_peralatan_k2k3').upsert(k2k3List.slice(0, 100), { onConflict: 'id' });
      await supabase.from('warehouse_material').upsert(matList, { onConflict: 'id' });
      await supabase.from('warehouse_kendaraan').upsert(kndList, { onConflict: 'id' });
      await supabase.from('warehouse_inventaris_kantor').upsert(invList, { onConflict: 'id' });
      console.log('[MIGRATE] Supabase tables upsert attempted.');
    } catch (e: any) {
      console.log('[MIGRATE] Supabase tables not yet created or skipped:', e.message);
    }
  }

  console.log('=== WAREHOUSE SUBMENUS MIGRATION COMPLETED ===');
  return {
    peralatanKerjaCount: pkList.length,
    peralatanK2k3Count: k2k3List.length,
    materialCount: matList.length,
    kendaraanCount: kndList.length,
    inventarisKantorCount: invList.length
  };
}

if (process.argv[1]?.includes('migrate_warehouse_submenus')) {
  migrateAllWarehouseSubmenus()
    .then(r => console.log('Result:', r))
    .catch(e => console.error(e));
}
