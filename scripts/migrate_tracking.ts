import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://iswgycclurbdxrnrxbvz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd2d5Y2NsdXJiZHhybnJ4YnZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkyMDMwNiwiZXhwIjoyMDk2NDk2MzA2fQ.mzX3UK9WASOrxoil0InLlZYfq5oViP3LYPMeUbtYfs8';
const GAS_URL = process.env.VITE_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchGas(action: string, payload: any = {}): Promise<any> {
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

export async function migrateTrackingData() {
  console.log('=== MEMULAI MIGRASI DATA TRACKING DARI GOOGLE SHEETS KE SUPABASE ===\n');

  // 1. Cek apakah tabel tracking sudah ada di Supabase
  const { error: checkErr } = await supabase.from('tracking').select('id').limit(1);
  if (checkErr && checkErr.message.includes('Could not find the table')) {
    console.error('❌ Tabel public.tracking belum ditemukan di Supabase!');
    console.error('👉 Silakan jalankan script SQL di /scripts/create_tracking_table.sql pada Supabase SQL Editor terlebih dahulu.\n');
    return false;
  }

  // 2. Ambil seluruh no_wo dari tabel work_plans di Supabase
  console.log('Mengambil daftar Work Plan dari Supabase...');
  const { data: workPlans, error: wpErr } = await supabase
    .from('work_plans')
    .select('no_wo, progres')
    .not('no_wo', 'is', null)
    .order('no_wo', { ascending: false });

  if (wpErr || !workPlans || workPlans.length === 0) {
    console.error('❌ Gagal mengambil work_plans atau data kosong:', wpErr?.message);
    return false;
  }

  console.log(`Ditemukan ${workPlans.length} Work Plan. Memulai penarikan data tracking dari Google Sheets...\n`);

  const BATCH_SIZE = 25;
  let totalSuccess = 0;
  let totalProcessed = 0;

  for (let i = 0; i < workPlans.length; i += BATCH_SIZE) {
    const chunk = workPlans.slice(i, i + BATCH_SIZE);
    
    const trackingRows: any[] = [];

    await Promise.all(
      chunk.map(async (wp) => {
        const noWo = String(wp.no_wo).trim();
        if (!noWo) return;

        try {
          const trackData = await fetchGas('getTracking', { noWo });
          if (trackData) {
            const row = {
              no_wo: noWo,
              start: trackData['START'] || 'Waiting',
              persiapan: trackData['PERSIAPAN'] || 'Waiting',
              pelaksanaan: trackData['PELAKSANAAN'] || 'Waiting',
              closing: trackData['CLOSING'] || (trackData['PROGRES'] === 'SELESAI' ? 'SELESAI' : 'Waiting'),
              progres: trackData['PROGRES'] || wp.progres || 'PLANNING',
              swa: trackData['SWA'] || '',
              status_swa: trackData['STATUS SWA'] || '',
              keterangan_start: trackData['Keterangan START'] || '',
              keterangan_persiapan: trackData['Keterangan PERSIAPAN'] || '',
              keterangan_pelaksanaan: trackData['Keterangan PELAKSANAAN'] || '',
              keterangan_swa: trackData['Keterangan SWA'] || '',
              ts_menuju_lokasi: trackData['TS_MENUJU LOKASI'] || null,
              ts_tiba_di_lokasi: trackData['TS_TIBA DI LOKASI'] || null,
              ts_gelar_peralatan_briefing: trackData['TS_GELAR PERALATAN & BRIEFING'] || null,
              ts_siap_dimulai: trackData['TS_SIAP DIMULAI'] || null,
              ts_pekerjaan_dilaksanakan: trackData['TS_PEKERJAAN DILAKSANAKAN'] || null,
              ts_pekerjaan_selesai: trackData['TS_PEKERJAAN SELESAI'] || null,
              ts_swa: trackData['TS_SWA'] || null,
              ts_swa_cleared: trackData['TS_SWA_CLEARED_TIME'] || trackData['SWA_CLEARED_TIME'] || null,
              start_start_time: trackData['START_START_TIME'] || null,
              start_end_time: trackData['START_END_TIME'] || null,
              persiapan_start_time: trackData['PERSIAPAN_START_TIME'] || null,
              persiapan_end_time: trackData['PERSIAPAN_END_TIME'] || null,
              pelaksanaan_start_time: trackData['PELAKSANAAN_START_TIME'] || null,
              pelaksanaan_end_time: trackData['PELAKSANAAN_END_TIME'] || null,
              foto_sebelum: trackData.lampiranPelaksanaan?.fotoSebelum || null,
              foto_proses1: trackData.lampiranPelaksanaan?.fotoProses1 || null,
              foto_proses2: trackData.lampiranPelaksanaan?.fotoProses2 || null,
              foto_selesai: trackData.lampiranPelaksanaan?.fotoSelesai || null,
              lampiran_steps: trackData.lampiranSteps || {},
              raw_data: trackData,
              updated_at: new Date().toISOString()
            };
            trackingRows.push(row);
          }
        } catch (err: any) {
          // Silent continue
        }
      })
    );

    if (trackingRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('tracking')
        .upsert(trackingRows, { onConflict: 'no_wo' });

      if (upsertErr) {
        console.error(`  Error batch upsert [${i}..${i + chunk.length}]:`, upsertErr.message);
      } else {
        totalSuccess += trackingRows.length;
      }
    }

    totalProcessed += chunk.length;
    console.log(`[Progress] Diproses: ${totalProcessed}/${workPlans.length} | Berhasil migrasi: ${totalSuccess}`);
  }

  console.log(`\n✅ MIGRASI SELESAI: Berhasil memigrasi ${totalSuccess} data tracking ke Supabase.`);
  return true;
}

if (process.argv[1]?.includes('migrate_tracking')) {
  migrateTrackingData().catch(console.error);
}
