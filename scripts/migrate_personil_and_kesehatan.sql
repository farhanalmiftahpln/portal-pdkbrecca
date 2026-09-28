-- ==============================================================================
-- MIGRASI SKEMA DATABASE SUPABASE: PERSONIL & LOG KESEHATAN
-- Eksekusi skrip ini di SQL Editor pada Dashboard Supabase Anda (https://supabase.com/dashboard)
-- Skrip ini idempotent (dapat dijalankan berulang kali dengan aman)
-- ==============================================================================

-- 1. Tambahkan kolom status PDKB dan legalitas sertifikat per level ke tabel personil
ALTER TABLE public.personil 
  ADD COLUMN IF NOT EXISTS status_pdkb VARCHAR(50) DEFAULT 'AKTIF',
  ADD COLUMN IF NOT EXISTS no_serkom_lv_2 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS no_regist_serkom_lv_2 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_issuance_lv_2 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS expire_date_lv_2 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS no_serkom_lv_3 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS no_regist_serkom_lv_3 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_issuance_lv_3 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS expire_date_lv_3 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS no_serkom_lv_4 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS no_regist_serkom_lv_4 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_issuance_lv_4 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS expire_date_lv_4 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS legalitas_detail JSONB DEFAULT '{}'::jsonb;

-- 2. Pastikan tabel pemeriksaan_kesehatan memiliki kolom checklist_items
CREATE TABLE IF NOT EXISTS public.pemeriksaan_kesehatan (
  id BIGSERIAL PRIMARY KEY,
  nip VARCHAR(50) REFERENCES public.personil(nip) ON DELETE CASCADE ON UPDATE CASCADE,
  nama VARCHAR(255) NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE,
  sistole NUMERIC,
  diastole NUMERIC,
  nadi NUMERIC,
  suhu NUMERIC,
  status_fisik VARCHAR(50) DEFAULT 'SEHAT',
  status_mental VARCHAR(50) DEFAULT 'SEHAT',
  keterangan TEXT,
  checklist_items JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pemeriksaan_kesehatan
  ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '{}'::jsonb;

-- 3. Indeks untuk performa query
CREATE INDEX IF NOT EXISTS idx_personil_status_pdkb ON public.personil(status_pdkb);
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_kesehatan_nip ON public.pemeriksaan_kesehatan(nip);
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_kesehatan_tanggal ON public.pemeriksaan_kesehatan(tanggal DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.personil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pemeriksaan_kesehatan ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Kebijakan baca tabel personil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personil' AND policyname = 'Allow public read personil') THEN
    CREATE POLICY "Allow public read personil" ON public.personil FOR SELECT USING (true);
  END IF;

  -- Kebijakan tulis tabel personil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personil' AND policyname = 'Allow public write personil') THEN
    CREATE POLICY "Allow public write personil" ON public.personil FOR ALL USING (true);
  END IF;

  -- Kebijakan baca pemeriksaan_kesehatan
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemeriksaan_kesehatan' AND policyname = 'Allow public read pemeriksaan_kesehatan') THEN
    CREATE POLICY "Allow public read pemeriksaan_kesehatan" ON public.pemeriksaan_kesehatan FOR SELECT USING (true);
  END IF;

  -- Kebijakan tulis pemeriksaan_kesehatan
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemeriksaan_kesehatan' AND policyname = 'Allow public write pemeriksaan_kesehatan') THEN
    CREATE POLICY "Allow public write pemeriksaan_kesehatan" ON public.pemeriksaan_kesehatan FOR ALL USING (true);
  END IF;
END $$;

COMMENT ON COLUMN public.personil.status_pdkb IS 'Status keanggotaan PDKB: AKTIF, MUTASI, TIDAK AKTIF';
COMMENT ON TABLE public.pemeriksaan_kesehatan IS 'Riwayat log hasil pemeriksaan kesehatan fisik & mental personil PDKB';
