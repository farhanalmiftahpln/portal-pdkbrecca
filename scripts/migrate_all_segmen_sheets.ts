import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = '1YXFGPcpoK-mcpcQNyg1BeupyVeIql9z3L8byvtLCFws';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let curLine: string[] = [];
  let curVal = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      if (inQuotes && content[i + 1] === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curLine.push(curVal.trim());
      curVal = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && content[i + 1] === '\n') i++;
      curLine.push(curVal.trim());
      if (curLine.some(x => x !== '')) lines.push(curLine);
      curLine = [];
      curVal = '';
    } else {
      curVal += c;
    }
  }
  if (curVal || curLine.length > 0) {
    curLine.push(curVal.trim());
    if (curLine.some(x => x !== '')) lines.push(curLine);
  }
  return lines;
}

function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const s = String(val).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// 1. MIGRATE DATA UNIT
export async function migrateDataUnit() {
  console.log('[MIGRATE] Fetching DATA UNIT sheet...');
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('DATA UNIT')}`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = parseCSV(text);

  const list: any[] = [];
  // Row 0 is header: "TANGGAL UPDATE","RP/kWh","PELANGGAN TOTAL"
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const tanggal_update = (row[0] || '').trim();
    if (!tanggal_update) continue;

    const rp_per_kwh = parseNumber(row[1]) || 1120;
    const pelanggan_total = parseNumber(row[2]) || 390182;

    list.push({
      id: i,
      tanggal_update,
      rp_per_kwh,
      pelanggan_total
    });
  }

  const filePath = path.join(DATA_DIR, 'data_unit.json');
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`[MIGRATE] DATA UNIT: ${list.length} rows saved to ${filePath}`);

  if (supabase) {
    try {
      const { error } = await supabase.from('data_unit').upsert(list, { onConflict: 'id' });
      if (!error) console.log(`[MIGRATE] DATA UNIT successfully upserted to Supabase table 'data_unit'`);
    } catch (e: any) {
      // Table might not exist yet, local file is primary fallback
    }
  }

  return list;
}

// 2. MIGRATE KODE SEGMEN
export async function migrateKodeSegmen() {
  console.log('[MIGRATE] Fetching KODE SEGMEN sheet...');
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('KODE SEGMEN')}`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = parseCSV(text);

  const list: any[] = [];
  let currentUlp = '';
  let currentGi = '';
  let currentPenyulang = '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ulpRaw = (row[1] || '').trim();
    const giRaw = (row[2] || '').trim();
    const penyulangRaw = (row[3] || '').trim();
    const segmen = (row[5] || '').trim();

    if (ulpRaw) currentUlp = ulpRaw;
    if (giRaw) currentGi = giRaw;
    if (penyulangRaw) currentPenyulang = penyulangRaw;

    if (!segmen) continue;

    const total_gardu = parseNumber(row[7]);
    const pelanggan_padam = parseNumber(row[9]);
    const pelanggan_padam_fix = parseNumber(row[10]);
    const beban_siang_max = parseNumber(row[11]);
    
    // Check if row[12] is valid number or date formatted artifact (row 1 case)
    let beban_siang_fix = 0;
    const rawBebanFix = (row[12] || '').trim();
    if (rawBebanFix.includes('/')) {
      beban_siang_fix = 0; // line 1 PMT LASONRONG
    } else {
      beban_siang_fix = parseNumber(rawBebanFix);
    }

    const kode = (row[13] || '').trim();

    list.push({
      id: list.length + 1,
      no: parseNumber(row[0]) || (list.length + 1),
      ulp: currentUlp,
      gardu_induk: currentGi,
      penyulang: currentPenyulang,
      segmen,
      total_gardu,
      pelanggan_padam,
      pelanggan_padam_fix, // KEY FIX FIELD
      beban_siang_max,
      beban_siang_fix,     // KEY FIX FIELD
      kode
    });
  }

  const filePath = path.join(DATA_DIR, 'kode_segmen.json');
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`[MIGRATE] KODE SEGMEN: ${list.length} rows saved to ${filePath}`);

  if (supabase) {
    try {
      const { error } = await supabase.from('kode_segmen').upsert(list, { onConflict: 'id' });
      if (!error) console.log(`[MIGRATE] KODE SEGMEN successfully upserted to Supabase table 'kode_segmen'`);
    } catch (e: any) {
      // Table might not exist yet, local file is primary fallback
    }
  }

  return list;
}

// 3. MIGRATE DATA SEGMEN
export async function migrateDataSegmen() {
  console.log('[MIGRATE] Fetching DATA SEGMEN sheet...');
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('DATA SEGMEN')}`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = parseCSV(text);

  const list: any[] = [];
  // Row 0 header: "ULP","GARDU INDUK","PENYULANG","SEGMENT","PELANGGAN PADAM","BEBAN (AMPERE)"
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ulp = (row[0] || '').trim();
    const gardu_induk = (row[1] || '').trim();
    const penyulang = (row[2] || '').trim();
    const segmen = (row[3] || '').trim();
    if (!segmen) continue;

    const pelanggan_padam = parseNumber(row[4]);
    const beban_a = parseNumber(row[5]);

    list.push({
      id: i,
      ulp,
      gardu_induk,
      penyulang,
      segmen,
      pelanggan_padam,
      beban_a
    });
  }

  const filePath = path.join(DATA_DIR, 'data_segmen.json');
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`[MIGRATE] DATA SEGMEN: ${list.length} rows saved to ${filePath}`);

  if (supabase) {
    try {
      const { error } = await supabase.from('data_segmen').upsert(list, { onConflict: 'id' });
      if (!error) console.log(`[MIGRATE] DATA SEGMEN successfully upserted to Supabase table 'data_segmen'`);
    } catch (e: any) {
      // Table might not exist yet, local file is primary fallback
    }
  }

  return list;
}

// 4. MIGRATE DATA SEGMEN INPUT
export async function migrateDataSegmenInput() {
  console.log('[MIGRATE] Fetching DATA SEGMEN INPUT sheet...');
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('DATA SEGMEN INPUT')}`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = parseCSV(text);

  const list: any[] = [];
  if (rows.length === 0) return list;

  const headers = rows[0].map(h => (h || '').trim());
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const no = parseNumber(row[0]) || i;
    const tanggal = (row[1] || '').trim();
    if (!tanggal) continue;

    const beban_penyulang: Record<string, number> = {};
    let total_pelanggan = 0;

    for (let c = 2; c < row.length; c++) {
      const colName = headers[c];
      if (!colName) continue;
      if (colName.toUpperCase().includes('TOTAL PELANGGAN')) {
        total_pelanggan = parseNumber(row[c]);
      } else {
        beban_penyulang[colName] = parseNumber(row[c]);
      }
    }

    list.push({
      id: i,
      no,
      tanggal,
      beban_penyulang,
      total_pelanggan
    });
  }

  const filePath = path.join(DATA_DIR, 'data_segmen_input.json');
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`[MIGRATE] DATA SEGMEN INPUT: ${list.length} rows saved to ${filePath}`);

  if (supabase) {
    try {
      const { error } = await supabase.from('data_segmen_input').upsert(list, { onConflict: 'id' });
      if (!error) console.log(`[MIGRATE] DATA SEGMEN INPUT successfully upserted to Supabase table 'data_segmen_input'`);
    } catch (e: any) {
      // Table might not exist yet, local file is primary fallback
    }
  }

  return list;
}

export async function migrateAllMasterSheets() {
  console.log('=== STARTING 4-SHEET ISOLATED MIGRATION ===');
  const [dataUnit, kodeSegmen, dataSegmen, dataSegmenInput] = await Promise.all([
    migrateDataUnit(),
    migrateKodeSegmen(),
    migrateDataSegmen(),
    migrateDataSegmenInput()
  ]);

  console.log('=== MIGRATION COMPLETE ===');
  return {
    dataUnitCount: dataUnit.length,
    kodeSegmenCount: kodeSegmen.length,
    dataSegmenCount: dataSegmen.length,
    dataSegmenInputCount: dataSegmenInput.length
  };
}

// Auto run if executed directly
if (process.argv[1]?.includes('migrate_all_segmen_sheets')) {
  migrateAllMasterSheets()
    .then(r => console.log('Result:', r))
    .catch(e => console.error('Migration error:', e));
}
