import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://iswgycclurbdxrnrxbvz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd2d5Y2NsdXJiZHhybnJ4YnZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkyMDMwNiwiZXhwIjoyMDk2NDk2MzA2fQ.mzX3UK9WASOrxoil0InLlZYfq5oViP3LYPMeUbtYfs8';
const SPREADSHEET_ID = '1YXFGPcpoK-mcpcQNyg1BeupyVeIql9z3L8byvtLCFws';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseIndoNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface MasterSegmenItem {
  id?: number;
  segmen: string;
  ulp: string;
  gardu_induk: string;
  penyulang: string;
  kode?: string;
  total_gardu?: number;
  pelanggan_padam: number;
  beban_a: number;
  durasi: number;
  rp_per_kwh: number;
  jumlah_pelanggan: number;
  source: string;
}

export async function migrateMasterSegmen() {
  console.log('=== MEMULAI MIGRASI MASTER SEGMEN DARI SPREADSHEET "LIST_REALISASI" ===\n');

  // 1. Fetch DATA UNIT untuk mendapatkan tarif Rp/kWh dan total pelanggan terbaru
  console.log('1. Mengambil data dari sheet DATA UNIT...');
  let latestRpPerKwh = 1120;
  let latestJumlahPelanggan = 390182;
  try {
    const unitUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('DATA UNIT')}`;
    const unitRes = await fetch(unitUrl);
    if (unitRes.ok) {
      const unitText = await unitRes.text();
      const unitLines = unitText.trim().split('\n');
      for (let i = unitLines.length - 1; i >= 1; i--) {
        const [tgl, rp, tot] = parseCSVLine(unitLines[i]);
        const numRp = parseIndoNumber(rp);
        const numTot = parseIndoNumber(tot);
        if (numRp > 0) latestRpPerKwh = numRp;
        if (numTot > 0) latestJumlahPelanggan = numTot;
        if (numRp > 0 && numTot > 0) break;
      }
    }
    console.log(`   Konstanta Unit: Rp/kWh = ${latestRpPerKwh}, Total Pelanggan = ${latestJumlahPelanggan}`);
  } catch (err: any) {
    console.warn('   Peringatan: Gagal mengambil DATA UNIT, menggunakan default:', err.message);
  }

  const masterMap = new Map<string, MasterSegmenItem>();

  // 2. Fetch DATA SEGMEN
  console.log('\n2. Mengambil data dari sheet DATA SEGMEN...');
  try {
    const dsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('DATA SEGMEN')}`;
    const dsRes = await fetch(dsUrl);
    if (dsRes.ok) {
      const dsText = await dsRes.text();
      const dsLines = dsText.trim().split('\n');
      for (let i = 1; i < dsLines.length; i++) {
        const [ulp, gi, penyulang, segmen, padam, beban] = parseCSVLine(dsLines[i]);
        if (!segmen || segmen.trim() === '') continue;
        const key = segmen.trim().toUpperCase();
        masterMap.set(key, {
          segmen: segmen.trim(),
          ulp: ulp || '',
          gardu_induk: gi || '',
          penyulang: penyulang || '',
          pelanggan_padam: parseIndoNumber(padam),
          beban_a: parseIndoNumber(beban),
          durasi: 1.8,
          rp_per_kwh: latestRpPerKwh,
          jumlah_pelanggan: latestJumlahPelanggan,
          source: 'SHEET_DATA_SEGMEN'
        });
      }
      console.log(`   Berhasil memuat ${masterMap.size} segmen dari DATA SEGMEN.`);
    }
  } catch (err: any) {
    console.error('   Gagal mengambil DATA SEGMEN:', err.message);
  }

  // 3. Fetch KODE SEGMEN untuk memperkaya total gardu, kode, beban fix, dan segmen tambahan
  console.log('\n3. Mengambil data dari sheet KODE SEGMEN...');
  try {
    const ksUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('KODE SEGMEN')}`;
    const ksRes = await fetch(ksUrl);
    if (ksRes.ok) {
      const ksText = await ksRes.text();
      const ksLines = ksText.trim().split('\n');
      let curUlp = '', curGi = '', curPenyulang = '';
      let addedFromKS = 0;
      for (let i = 1; i < ksLines.length; i++) {
        const cols = parseCSVLine(ksLines[i]);
        const [no, ulp, gi, penyulang, bebanPenyulang, segmen, blank, totalGardu, persenPadam, padam, padamFix, bebanSiangMax, bebanSiangFix, kode] = cols;
        if (ulp) curUlp = ulp;
        if (gi) curGi = gi;
        if (penyulang) curPenyulang = penyulang;
        if (!segmen || segmen.trim() === '') continue;

        const key = segmen.trim().toUpperCase();
        const existing = masterMap.get(key);
        const parsedBeban = parseIndoNumber(bebanSiangFix) || parseIndoNumber(bebanSiangMax) || (existing?.beban_a ?? 0);
        const parsedPadam = parseIndoNumber(padamFix) || parseIndoNumber(padam) || (existing?.pelanggan_padam ?? 0);
        const parsedGardu = totalGardu ? parseInt(totalGardu, 10) : (existing?.total_gardu ?? 0);

        if (existing) {
          existing.kode = kode || existing.kode;
          if (parsedGardu > 0) existing.total_gardu = parsedGardu;
          if (parsedBeban > 0 && existing.beban_a === 0) existing.beban_a = parsedBeban;
          if (parsedPadam > 0 && existing.pelanggan_padam === 0) existing.pelanggan_padam = parsedPadam;
          existing.source = 'SHEET_DATA_SEGMEN+KODE_SEGMEN';
        } else {
          masterMap.set(key, {
            segmen: segmen.trim(),
            ulp: curUlp,
            gardu_induk: curGi,
            penyulang: curPenyulang,
            kode: kode || '',
            total_gardu: parsedGardu || 0,
            pelanggan_padam: parsedPadam,
            beban_a: parsedBeban,
            durasi: 1.8,
            rp_per_kwh: latestRpPerKwh,
            jumlah_pelanggan: latestJumlahPelanggan,
            source: 'SHEET_KODE_SEGMEN'
          });
          addedFromKS++;
        }
      }
      console.log(`   Berhasil memperkaya data KODE SEGMEN (ditambahkan segmen baru: ${addedFromKS}). Total saat ini: ${masterMap.size}`);
    }
  } catch (err: any) {
    console.error('   Gagal mengambil KODE SEGMEN:', err.message);
  }

  // 4. Enrich dengan data historis dari tabel realisasi (untuk menjamin keselarasan 100% dengan riwayat lama)
  console.log('\n4. Menyelaraskan dengan data historis tabel realisasi Supabase...');
  try {
    const { data: realisasiData } = await supabase
      .from('realisasi')
      .select('segmen, ulp, gardu_induk, penyulang, beban_a, durasi, pelanggan_padam, jumlah_pelanggan, rp_per_kwh')
      .not('beban_a', 'is', null);

    if (realisasiData && realisasiData.length > 0) {
      let enrichedCount = 0;
      for (const r of realisasiData) {
        if (!r.segmen) continue;
        const key = r.segmen.trim().toUpperCase();
        const existing = masterMap.get(key);
        if (!existing) {
          masterMap.set(key, {
            segmen: r.segmen.trim(),
            ulp: r.ulp || '',
            gardu_induk: r.gardu_induk || '',
            penyulang: r.penyulang || '',
            pelanggan_padam: Number(r.pelanggan_padam) || 0,
            beban_a: Number(r.beban_a) || 0,
            durasi: Number(r.durasi) || 1.8,
            rp_per_kwh: Number(r.rp_per_kwh) || latestRpPerKwh,
            jumlah_pelanggan: Number(r.jumlah_pelanggan) || latestJumlahPelanggan,
            source: 'HISTORICAL_REALISASI'
          });
          enrichedCount++;
        } else {
          if (r.durasi && Number(r.durasi) > 0) existing.durasi = Number(r.durasi);
          if (r.rp_per_kwh && Number(r.rp_per_kwh) > 0) existing.rp_per_kwh = Number(r.rp_per_kwh);
          if (r.jumlah_pelanggan && Number(r.jumlah_pelanggan) > 0) existing.jumlah_pelanggan = Number(r.jumlah_pelanggan);
          if (existing.beban_a === 0 && Number(r.beban_a) > 0) existing.beban_a = Number(r.beban_a);
          if (existing.pelanggan_padam === 0 && Number(r.pelanggan_padam) > 0) existing.pelanggan_padam = Number(r.pelanggan_padam);
        }
      }
      console.log(`   Berhasil memperkaya data historis (tambahan segmen historis: ${enrichedCount}). Total Master Segmen: ${masterMap.size}`);
    }
  } catch (err: any) {
    console.warn('   Peringatan saat sinkronisasi realisasi:', err.message);
  }

  // 5. Simpan ke local persistent cache JSON
  const allItems = Array.from(masterMap.values());
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const targetFile = path.join(dataDir, 'master_segmen.json');
  fs.writeFileSync(targetFile, JSON.stringify(allItems, null, 2), 'utf-8');
  console.log(`\n✅ Berhasil menyimpan ${allItems.length} Master Segmen ke: ${targetFile}`);

  // 6. Coba sinkronisasi ke tabel master_segmen di Supabase jika ada
  try {
    const { error: checkTableErr } = await supabase.from('master_segmen').select('id').limit(1);
    if (!checkTableErr) {
      console.log('Tabel master_segmen ditemukan di Supabase, memulai batch upsert...');
      const BATCH = 50;
      for (let i = 0; i < allItems.length; i += BATCH) {
        const chunk = allItems.slice(i, i + BATCH).map(item => ({
          segmen: item.segmen,
          ulp: item.ulp,
          gardu_induk: item.gardu_induk,
          penyulang: item.penyulang,
          kode: item.kode || null,
          total_gardu: item.total_gardu || 0,
          pelanggan_padam: item.pelanggan_padam,
          beban_a: item.beban_a,
          durasi: item.durasi,
          rp_per_kwh: item.rp_per_kwh,
          jumlah_pelanggan: item.jumlah_pelanggan,
          source: item.source,
          updated_at: new Date().toISOString()
        }));
        await supabase.from('master_segmen').upsert(chunk, { onConflict: 'segmen' });
      }
      console.log('✅ Batch upsert ke tabel master_segmen di Supabase selesai!');
    } else {
      console.log('ℹ️ Catatan: Tabel Supabase public.master_segmen belum dibuat (cache lokal JSON aktif dan siap digunakan secara penuh).');
    }
  } catch (err: any) {
    console.warn('ℹ️ Catatan sinkronisasi tabel Supabase:', err.message);
  }

  return { success: true, count: allItems.length };
}

if (process.argv[1]?.includes('migrate_master_segmen')) {
  migrateMasterSegmen()
    .then(res => {
      console.log('\n=== MIGRASI SELESAI SUKSES! ===');
    })
    .catch(err => {
      console.error('\n❌ Migrasi Gagal:', err);
    });
}

