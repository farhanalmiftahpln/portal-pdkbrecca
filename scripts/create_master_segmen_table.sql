-- ==============================================================================
-- MIGRASI TABEL MASTER_SEGMEN (SUPABASE / POSTGRESQL)
-- Eksekusi script SQL ini di Supabase SQL Editor (Dashboard Supabase)
-- Tabel ini menyimpan master referensi segmen jaringan JTM PLN UP3 Watampone:
-- Beban (A), Pelanggan Padam, Total Gardu, Durasi Rujukan, Tarif Rp/kWh, dan Total Pelanggan Unit
-- Sumber: Sheet 'DATA SEGMEN', 'KODE SEGMEN', 'DATA UNIT', dan 'DATA SEGMEN INPUT' (Spreadsheet LIST_REALISASI)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.master_segmen (
  id BIGSERIAL PRIMARY KEY,
  segmen TEXT UNIQUE NOT NULL,
  ulp TEXT,
  gardu_induk TEXT,
  penyulang TEXT,
  kode TEXT,
  total_gardu INTEGER DEFAULT 0,
  pelanggan_padam NUMERIC DEFAULT 0,
  beban_a NUMERIC DEFAULT 0,
  durasi NUMERIC DEFAULT 1.8,
  rp_per_kwh NUMERIC DEFAULT 1120,
  jumlah_pelanggan NUMERIC DEFAULT 390182,
  source TEXT DEFAULT 'SPREADSHEET',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index percepat pencarian berdasarkan nama segmen dan penyulang
CREATE INDEX IF NOT EXISTS idx_master_segmen_segmen ON public.master_segmen(segmen);
CREATE INDEX IF NOT EXISTS idx_master_segmen_penyulang ON public.master_segmen(penyulang);

-- Enable Row Level Security (RLS)
ALTER TABLE public.master_segmen ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'master_segmen' AND policyname = 'Allow public read master_segmen'
  ) THEN
    CREATE POLICY "Allow public read master_segmen" ON public.master_segmen FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'master_segmen' AND policyname = 'Allow all write master_segmen'
  ) THEN
    CREATE POLICY "Allow all write master_segmen" ON public.master_segmen FOR ALL USING (true);
  END IF;
END $$;
