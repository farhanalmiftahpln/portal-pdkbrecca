-- ==============================================================================
-- MIGRASI TABEL TRACKING (RELASI KE TABEL WORK_PLANS)
-- Eksekusi script SQL ini di Supabase SQL Editor (Dashboard Supabase)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tracking (
  id BIGSERIAL PRIMARY KEY,
  no_wo TEXT UNIQUE NOT NULL REFERENCES public.work_plans(no_wo) ON DELETE CASCADE ON UPDATE CASCADE,
  start TEXT DEFAULT 'Waiting',
  persiapan TEXT DEFAULT 'Waiting',
  pelaksanaan TEXT DEFAULT 'Waiting',
  closing TEXT DEFAULT 'Waiting',
  progres TEXT DEFAULT 'PLANNING',
  swa TEXT DEFAULT '',
  status_swa TEXT DEFAULT '',
  keterangan_start TEXT,
  keterangan_persiapan TEXT,
  keterangan_pelaksanaan TEXT,
  keterangan_swa TEXT,
  ts_menuju_lokasi TEXT,
  ts_tiba_di_lokasi TEXT,
  ts_gelar_peralatan_briefing TEXT,
  ts_siap_dimulai TEXT,
  ts_pekerjaan_dilaksanakan TEXT,
  ts_pekerjaan_selesai TEXT,
  ts_swa TEXT,
  ts_swa_cleared TEXT,
  start_start_time TEXT,
  start_end_time TEXT,
  persiapan_start_time TEXT,
  persiapan_end_time TEXT,
  pelaksanaan_start_time TEXT,
  pelaksanaan_end_time TEXT,
  foto_sebelum TEXT,
  foto_proses1 TEXT,
  foto_proses2 TEXT,
  foto_selesai TEXT,
  foto_start TEXT,
  foto_persiapan TEXT,
  foto_pelaksanaan TEXT,
  foto_swa TEXT,
  lampiran_steps JSONB DEFAULT '{}'::jsonb,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk percepat query by no_wo
CREATE INDEX IF NOT EXISTS idx_tracking_no_wo ON public.tracking(no_wo);

-- Row Level Security (RLS)
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tracking' AND policyname = 'Allow public read tracking'
  ) THEN
    CREATE POLICY "Allow public read tracking" ON public.tracking FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tracking' AND policyname = 'Allow public write tracking'
  ) THEN
    CREATE POLICY "Allow public write tracking" ON public.tracking FOR ALL USING (true);
  END IF;
END $$;
