-- ============================================================================
-- SQL DDL: 4 Dedicated Tables for Segmen, Feeder Load, and Unit Parameters
-- Sesuai Struktur Sheet: DATA UNIT, KODE SEGMEN, DATA SEGMEN, DATA SEGMEN INPUT
-- ============================================================================

-- 1. TABEL DATA UNIT
-- Menyimpan parameter tarif (Rp/kWh) dan jumlah total pelanggan per update
CREATE TABLE IF NOT EXISTS public.data_unit (
    id SERIAL PRIMARY KEY,
    tanggal_update TEXT NOT NULL,
    rp_per_kwh NUMERIC(12, 2) NOT NULL DEFAULT 1120,
    pelanggan_total NUMERIC(12, 2) NOT NULL DEFAULT 390182,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KODE SEGMEN (MASTER UTAMA DENGAN NILAI FIX TERKALIBRASI)
-- Kolom kunci: beban_siang_fix & pelanggan_padam_fix
CREATE TABLE IF NOT EXISTS public.kode_segmen (
    id SERIAL PRIMARY KEY,
    no INT,
    ulp TEXT,
    gardu_induk TEXT,
    penyulang TEXT,
    segmen TEXT NOT NULL,
    total_gardu NUMERIC(10, 2) DEFAULT 0,
    pelanggan_padam NUMERIC(12, 4) DEFAULT 0,
    pelanggan_padam_fix NUMERIC(12, 2) NOT NULL DEFAULT 0,
    beban_siang_max NUMERIC(12, 4) DEFAULT 0,
    beban_siang_fix NUMERIC(12, 2) NOT NULL DEFAULT 0,
    kode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kode_segmen_segmen ON public.kode_segmen(segmen);
CREATE INDEX IF NOT EXISTS idx_kode_segmen_penyulang ON public.kode_segmen(penyulang);

-- 3. TABEL DATA SEGMEN (DATA REFERENSI DASAR / FALLBACK)
CREATE TABLE IF NOT EXISTS public.data_segmen (
    id SERIAL PRIMARY KEY,
    ulp TEXT,
    gardu_induk TEXT,
    penyulang TEXT,
    segmen TEXT NOT NULL,
    pelanggan_padam NUMERIC(12, 4) DEFAULT 0,
    beban_a NUMERIC(12, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_segmen_segmen ON public.data_segmen(segmen);

-- 4. TABEL DATA SEGMEN INPUT (RIWAYAT PENGUKURAN BEBAN PENYULANG)
CREATE TABLE IF NOT EXISTS public.data_segmen_input (
    id SERIAL PRIMARY KEY,
    no INT,
    tanggal TEXT NOT NULL,
    beban_penyulang JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_pelanggan NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_segmen_input_tanggal ON public.data_segmen_input(tanggal);

-- Enable RLS and create public access policies
ALTER TABLE public.data_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kode_segmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segmen_input ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access data_unit" ON public.data_unit;
    CREATE POLICY "Public access data_unit" ON public.data_unit FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access kode_segmen" ON public.kode_segmen;
    CREATE POLICY "Public access kode_segmen" ON public.kode_segmen FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access data_segmen" ON public.data_segmen;
    CREATE POLICY "Public access data_segmen" ON public.data_segmen FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access data_segmen_input" ON public.data_segmen_input;
    CREATE POLICY "Public access data_segmen_input" ON public.data_segmen_input FOR ALL USING (true) WITH CHECK (true);
END $$;
