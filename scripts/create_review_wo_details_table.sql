-- ==============================================================================
-- MIGRASI TABEL REVIEW_WO_DETAILS (SUPABASE / POSTGRESQL)
-- Eksekusi script SQL ini di Supabase SQL Editor (Dashboard Supabase)
-- Tabel ini menyimpan detail komprehensif formulir Review Work Order:
-- Pekerjaan (SOP, IK), Material (Multi-baris JSONB), Kondisi Sekitar/Area, 
-- Kondisi Konstruksi, Hazard K3 (Multi-baris JSONB), dan Approval Preparator.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.review_wo_details (
  id BIGSERIAL PRIMARY KEY,
  no_wo TEXT UNIQUE NOT NULL REFERENCES public.work_orders(no_wo) ON DELETE CASCADE ON UPDATE CASCADE,
  pekerjaan JSONB DEFAULT '{}'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  area JSONB DEFAULT '{}'::jsonb,
  konstruksi JSONB DEFAULT '{}'::jsonb,
  hazards JSONB DEFAULT '[]'::jsonb,
  approval JSONB DEFAULT '{}'::jsonb,
  approval_preparator TEXT DEFAULT 'Menunggu Approval',
  ket_preparator TEXT DEFAULT '',
  tanggal_direncanakan TEXT,
  pelaksana_pdkb TEXT,
  pic_unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index percepat pencarian berdasarkan no_wo
CREATE INDEX IF NOT EXISTS idx_review_wo_details_no_wo ON public.review_wo_details(no_wo);

-- Enable Row Level Security (RLS)
ALTER TABLE public.review_wo_details ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_wo_details' AND policyname = 'Allow public read review_wo_details'
  ) THEN
    CREATE POLICY "Allow public read review_wo_details" ON public.review_wo_details FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_wo_details' AND policyname = 'Allow all write review_wo_details'
  ) THEN
    CREATE POLICY "Allow all write review_wo_details" ON public.review_wo_details FOR ALL USING (true);
  END IF;
END $$;

COMMENT ON TABLE public.review_wo_details IS 'Menyimpan rincian hasil Review WO PDKB (Pekerjaan, Material, Area, Konstruksi, Hazard K3, Approval)';
