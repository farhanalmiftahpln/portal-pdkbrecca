import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://iswgycclurbdxrnrxbvz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd2d5Y2NsdXJiZHhybnJ4YnZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkyMDMwNiwiZXhwIjoyMDk2NDk2MzA2fQ.mzX3UK9WASOrxoil0InLlZYfq5oViP3LYPMeUbtYfs8';
const GAS_URL = process.env.VITE_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseDate(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'null') return null;
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const y = parts[2];
    if (p0 > 12) {
      return `${y}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function parseDateTime(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'null') return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();
  return null;
}

function parseNumber(val: any, defaultVal: number | null = null): number | null {
  if (val === undefined || val === null || val === '') return defaultVal;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? defaultVal : n;
}

async function fetchGas(action: string, payload: any = {}): Promise<any> {
  console.log(`[GAS] Fetching ${action}...`);
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  if (!response.ok) {
    throw new Error(`GAS request failed (${response.status}): ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}

// Batch helper to prevent payload limits
async function batchUpsert(table: string, records: any[], onConflict?: string, batchSize = 100) {
  if (!records || records.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    const query = onConflict
      ? supabase.from(table).upsert(chunk, { onConflict })
      : supabase.from(table).insert(chunk);
    const { error } = await query;
    if (error) {
      console.error(`Error inserting into ${table} chunk [${i}..${i + chunk.length}]:`, error.message);
      // Try item by item to pinpoint problem
      for (const item of chunk) {
        const singleQuery = onConflict
          ? supabase.from(table).upsert(item, { onConflict })
          : supabase.from(table).insert(item);
        const { error: sErr } = await singleQuery;
        if (sErr) {
          console.error(`  Item failed in ${table}:`, sErr.message, JSON.stringify(item).slice(0, 150));
        } else {
          inserted++;
        }
      }
    } else {
      inserted += chunk.length;
    }
  }
  return inserted;
}

async function runMigration() {
  console.log('=== MEMULAI MIGRASI DATA DARI GOOGLE SHEETS KE SUPABASE ===\n');

  // 1. MIGRASI PERSONIL
  try {
    const rawPersonil = await fetchGas('getAllPersonil');
    if (Array.isArray(rawPersonil) && rawPersonil.length > 0) {
      console.log(`Menyiapkan ${rawPersonil.length} data personil...`);
      const personilRows = rawPersonil
        .filter((p: any) => p.NIP || p.Nama)
        .map((p: any) => ({
          nip: String(p.NIP || p.nip || `P-${Math.random()}`).trim(),
          nama: String(p.Nama || p.nama || '').trim(),
          jabatan: p.Jabatan || p.jabatan || null,
          grade: p.Grade || p.grade || null,
          lv_2: p['Lv. 2'] || null,
          lv_3: p['Lv. 3'] || null,
          lv_4: p['Lv. 4'] || null,
          kesehatan_fisik: p['Kesehatan Fisik'] || 'SEHAT',
          kesehatan_mental: p['Kesehatan Mental'] || 'SEHAT',
          foto: p.Foto || p.foto || null,
          url_gdrive: p['URL GDRIVE'] || null,
          email: p.EMAIL || p.email || null,
          password: p.PASSWORD || p.password || null
        }));
      const count = await batchUpsert('personil', personilRows, 'nip');
      console.log(`✅ Berhasil menyalin ${count}/${personilRows.length} Personil ke Supabase.\n`);
    }
  } catch (e: any) {
    console.error('❌ Gagal migrasi Personil:', e.message);
  }

  // 2. MIGRASI WORK ORDERS (+ REVIEW STATUS)
  try {
    const [rawWOs, rawReviews] = await Promise.all([
      fetchGas('getWorkOrders'),
      fetchGas('getReviewedWOs').catch(() => [])
    ]);

    const reviewMap = new Map<string, any>();
    if (Array.isArray(rawReviews)) {
      rawReviews.forEach((r: any) => {
        const no = String(r.noWo || '').trim();
        if (no) reviewMap.set(no, r);
      });
    }

    if (Array.isArray(rawWOs) && rawWOs.length > 0) {
      console.log(`Menyiapkan ${rawWOs.length} data Work Orders...`);
      const woRows = rawWOs
        .filter((w: any) => w.noWo || w.id || w.rowIndex)
        .map((w: any, idx: number) => {
          const noWoStr = String(w.noWo || w.id || idx + 1).trim();
          const rev = reviewMap.get(noWoStr) || {};
          const idStr = String(w.id || `WO-${noWoStr}`).trim();

          return {
            id: idStr,
            no_wo: noWoStr,
            tanggal: parseDate(w.tanggal),
            surveyor: w.surveyor || null,
            ulp: w.ulp || null,
            gardu_induk: w.garduInduk || w.gi || rev.gi || null,
            penyulang: w.penyulang || rev.penyulang || null,
            segmen: w.segmen || rev.segmen || null,
            temuan: w.temuan || rev.temuan || null,
            status: w.status || rev.statusWo || 'Menunggu Approval',
            alamat: w.alamat || rev.alamat || null,
            koordinat: w.koordinat || null,
            skala_prioritas: w.skalaPrioritas || null,
            jenis_tiang: w.jenisTiang || null,
            ukuran_tiang: w.ukuranTiang || null,
            jenis_konduktor: w.jenisKonduktor || null,
            ukuran_konduktor: w.ukuranKonduktor || null,
            keypoint: w.keypoint || null,
            keterangan: w.keterangan || null,
            foto: w.foto || rev.foto || null,
            approval_asman: w.approvalAsman || null,
            ket_asman: w.ketAsman || null,
            approval_tl: w.approvalTl || null,
            ket_tl: w.ketTl || null,
            approval_preparator: rev.approvalPreparator || w.approvalPreparator || null,
            ket_preparator: rev.ketPreparator || w.ketPreparator || null,
            tanggal_rencanakan: parseDateTime(rev.tanggalRencanakan || w.tanggalRencanakan)
          };
        });

      // Avoid duplicate no_wo by deduplicating
      const uniqueWOs = new Map<string, any>();
      woRows.forEach(row => {
        if (!uniqueWOs.has(row.no_wo)) {
          uniqueWOs.set(row.no_wo, row);
        }
      });
      const deduplicatedWOs = Array.from(uniqueWOs.values());

      const count = await batchUpsert('work_orders', deduplicatedWOs, 'no_wo', 200);
      console.log(`✅ Berhasil menyalin ${count}/${deduplicatedWOs.length} Work Orders ke Supabase.\n`);
    }
  } catch (e: any) {
    console.error('❌ Gagal migrasi Work Orders:', e.message);
  }

  // 3. MIGRASI WORK PLANS (RENCANA KERJA)
  try {
    const rawWorkPlans = await fetchGas('getWorkPlans');
    if (Array.isArray(rawWorkPlans) && rawWorkPlans.length > 0) {
      console.log(`Menyiapkan ${rawWorkPlans.length} data Work Plans...`);
      const wpRows = rawWorkPlans
        .filter((wp: any) => wp['NO. WO'] || wp['TEMUAN'] || wp['TANGGAL DIRENCANAKAN'])
        .map((wp: any) => ({
          no_wo: String(wp['NO. WO'] || '').trim() || null,
          tanggal_direncanakan: parseDate(wp['TANGGAL DIRENCANAKAN'] || wp.tanggalRencanakan),
          surveyor: wp['SURVEYOR'] || null,
          ulp: wp['ULP'] || null,
          gardu_induk: wp['GARDU INDUK'] || null,
          penyulang: wp['PENYULANG'] || null,
          segmen: wp['SEGMEN'] || null,
          temuan: wp['TEMUAN'] || null,
          alamat: wp['ALAMAT'] || null,
          kategori: wp['KATEGORI'] || null,
          skala_prioritas: wp['SKALA PRORITAS'] || wp['SKALA PRIORITAS'] || null,
          titik_koordinat: wp['TITIK KOORDINAT'] || null,
          jenis_tiang: wp['JENIS TIANG'] || null,
          ukuran_tiang: wp['UKURAN TIANG'] || null,
          jenis_konduktor: wp['JENIS KONDUKTOR'] || null,
          ukuran_konduktor: wp['UKURAN KONDUKTOR'] || null,
          keypoint: wp['KEYPOINT'] || null,
          keterangan: wp['KETERANGAN'] || null,
          foto_temuan: wp['FOTO TEMUAN'] || null,
          sop_pekerjaan: wp['SOP PEKERJAAN'] || null,
          instruksi_kerja: wp['INSTRUKSI KERJA'] || null,
          detail_pekerjaan: wp['DETAIL PEKERJAAN'] || null,
          wp: wp['WP'] || 'BELUM',
          ibppr: wp['IBPPR'] || 'BELUM',
          jsa: wp['JSA'] || 'BELUM',
          sp2b: wp['SP2B'] || 'BELUM',
          sp3b: wp['SP3B'] || 'BELUM',
          tailgate_session: wp['TAILGATE SESSION'] || 'BELUM',
          status_berkas: wp['STATUS BERKAS'] || 'BELUM LENGKAP',
          progres: wp['PROGRES'] || 'PLANNING',
          tanggal_realisasi: parseDate(wp['TANGGAL REALISASI']),
          konfirmasi: wp['KONFIRMASI'] || null
        }));

      const count = await batchUpsert('work_plans', wpRows, undefined, 200);
      console.log(`✅ Berhasil menyalin ${count}/${wpRows.length} Work Plans ke Supabase.\n`);
    }
  } catch (e: any) {
    console.error('❌ Gagal migrasi Work Plans:', e.message);
  }

  // 4. MIGRASI GUDANG (MATERIAL, PERALATAN KERJA, PERALATAN K2/K3, KENDARAAN)
  try {
    const categories = ['MATERIAL', 'PERALATAN KERJA', 'PERALATAN K2/K3', 'KENDARAAN'];
    for (const cat of categories) {
      try {
        const rawItems = await fetchGas('getWarehouseData', { sheetName: cat });
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          console.log(`Menyiapkan ${rawItems.length} item ${cat}...`);
          const itemRows = rawItems
            .filter((item: any) => item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['KODE'])
            .map((item: any) => {
              const nama = item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || 'Item';
              const kode = item['KODE'] || item['PLAT KENDARAAN'] || null;
              const jumlah = parseNumber(item['TOTAL STOK'] || item['STOK GUDANG'] || item['JUMLAH'], 1);
              const merk = item['MERK'] || item['MERK / TIPE'] || null;
              const kondisi = item['KONDISI'] || 'BAIK';
              const status = item['STATUS'] || 'MASUK';
              const gambar = item['LINK GAMBAR'] || item['FOTO KENDARAAN'] || item['GAMBAR'] || null;
              const qrcode = item['LINK QR CODE'] || item['QR CODE'] || null;

              return {
                kode,
                kategori: cat,
                nama_alat: nama,
                merk_type: merk,
                satuan: cat === 'MATERIAL' ? 'Pcs' : 'Unit',
                jumlah,
                kondisi,
                lokasi_penyimpanan: 'Gudang PDKB UP3 Watampone',
                status,
                link_gambar: gambar,
                link_qrcode: qrcode
              };
            });

          const count = await batchUpsert('warehouse_items', itemRows, undefined, 200);
          console.log(`✅ Berhasil menyalin ${count}/${itemRows.length} item ${cat} ke Supabase.`);
        }
      } catch (err: any) {
        console.error(`  Gagal memproses kategori ${cat}:`, err.message);
      }
    }
    console.log();
  } catch (e: any) {
    console.error('❌ Gagal migrasi Warehouse:', e.message);
  }

  // 5. MIGRASI REALISASI KERJA
  try {
    const rawRealisasi = await fetchGas('getRealisasiList');
    if (Array.isArray(rawRealisasi) && rawRealisasi.length > 0) {
      console.log(`Menyiapkan data Realisasi Kerja...`);
      const validRows = rawRealisasi
        .filter((r: any) => (r['NO. WO'] && String(r['NO. WO']).trim() !== '') || (r['TEMUAN'] && String(r['TEMUAN']).trim() !== ''))
        .map((r: any) => ({
          no_wo: String(r['NO. WO'] || '').trim() || null,
          tanggal_direncanakan: parseDate(r['TANGGAL DIRENCANAKAN']),
          tanggal_realisasi: parseDate(r['TANGGAL REALISASI']),
          surveyor: r['SURVEYOR'] || null,
          ulp: r['ULP'] || null,
          gardu_induk: r['GARDU INDUK'] || null,
          penyulang: r['PENYULANG'] || null,
          segmen: r['SEGMEN'] || null,
          temuan: r['TEMUAN'] || null,
          alamat: r['ALAMAT'] || null,
          detail_pekerjaan: r['DETAIL PEKERJAAN'] || null,
          material_terpakai: r['MATERIAL TERPAKAI'] ? { raw: r['MATERIAL TERPAKAI'] } : null,
          beban_a: parseNumber(r['BEBAN (A)']),
          pelanggan_padam: r['PELANGGAN PADAM'] || null,
          jumlah_pelanggan: parseNumber(r['JUMLAH PELANGGAN']),
          durasi: parseNumber(r['DURASI']),
          rp_per_kwh: parseNumber(r['Rp/KWh'], 1444.7),
          kwh_diselamatkan: parseNumber(r['KWH DISELAMATKAN']),
          rupiah_diselamatkan: parseNumber(r['RUPIAH DISELAMATKAN']),
          saidi: parseNumber(r['SAIDI']),
          saifi: parseNumber(r['SAIFI']),
          konfirmasi: r['KONFIRMASI'] || null,
          foto_sebelum: r['FOTO SEBELUM'] || null,
          foto_realisasi: r['FOTO REALISASI'] || null
        }));

      if (validRows.length > 0) {
        const count = await batchUpsert('realisasi', validRows, undefined, 100);
        console.log(`✅ Berhasil menyalin ${count}/${validRows.length} data Realisasi ke Supabase.\n`);
      } else {
        console.log(`ℹ️ Tidak ada data realisasi yang valid untuk disalin.\n`);
      }
    }
  } catch (e: any) {
    console.error('❌ Gagal migrasi Realisasi:', e.message);
  }

  // 6. MIGRASI LLC RECORDS
  try {
    const rawLlc = await fetchGas('getLlcList');
    if (Array.isArray(rawLlc) && rawLlc.length > 0) {
      console.log(`Menyiapkan data LLC records...`);
      const validLlc = rawLlc
        .filter((l: any) => (l['NO. WO'] && String(l['NO. WO']).trim() !== '') || (l['TEMUAN'] && String(l['TEMUAN']).trim() !== ''))
        .map((l: any) => ({
          no_wo: String(l['NO. WO'] || '').trim() || null,
          tanggal_realisasi: parseDate(l['TANGGAL REALISASI']),
          ulp: l['ULP'] || null,
          gardu_induk: l['GARDU INDUK'] || null,
          penyulang: l['PENYULANG'] || null,
          segmen: l['SEGMEN'] || null,
          alamat: l['ALAMAT'] || null,
          titik_koordinat: l['TITIK KOORDINAT'] || null,
          temuan_sebelumnya: l['TEMUAN SEBELUMNYA'] || l['TEMUAN'] || null,
          sop_pekerjaan: l['SOP PEKERJAAN'] || null,
          jadwal_pemeliharaan: parseDate(l['JADWAL PEMELIHARAAN']),
          status_pemeliharaan: l['STATUS PEMELIHARAAN'] || 'Belum Terjadwal'
        }));

      if (validLlc.length > 0) {
        const count = await batchUpsert('llc_records', validLlc, undefined, 100);
        console.log(`✅ Berhasil menyalin ${count}/${validLlc.length} LLC Records ke Supabase.\n`);
      }
    }
  } catch (e: any) {
    console.error('❌ Gagal migrasi LLC Records:', e.message);
  }

  console.log('=== MIGRASI DATA KE SUPABASE SELESAI ===');
}

runMigration().catch(console.error);
