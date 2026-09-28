-- ============================================================================
-- SQL DDL: 5 Dedicated Tables for WAREHOUSE Submenus
-- Sesuai Struktur Spreadsheet + Kolom Mutasi Terintegrasi
-- ============================================================================

-- 1. PERALATAN KERJA
CREATE TABLE IF NOT EXISTS public.warehouse_peralatan_kerja (
    id SERIAL PRIMARY KEY,
    no TEXT,
    gambar TEXT,
    qr_code TEXT,
    nama_peralatan TEXT NOT NULL,
    kode TEXT UNIQUE NOT NULL,
    merk TEXT,
    kondisi TEXT DEFAULT 'BAIK',
    tgl_uji TEXT,
    status TEXT DEFAULT 'TERSEDIA',
    jenis TEXT,
    stok_gudang NUMERIC(12,2) DEFAULT 0,
    stok_mobil NUMERIC(12,2) DEFAULT 0,
    total_stok NUMERIC(12,2) DEFAULT 0,
    link_qr_code TEXT,
    link_gambar TEXT,
    link_gdrive TEXT,
    
    -- Kolom Mutasi Terintegrasi
    mutasi_terakhir_tgl TEXT,
    mutasi_jenis TEXT,
    mutasi_jumlah NUMERIC(10,2) DEFAULT 0,
    mutasi_pic TEXT,
    mutasi_keterangan TEXT,
    riwayat_mutasi JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_pk_kode ON public.warehouse_peralatan_kerja(kode);
CREATE INDEX IF NOT EXISTS idx_wh_pk_kondisi ON public.warehouse_peralatan_kerja(kondisi);

-- 2. PERALATAN K2/K3
CREATE TABLE IF NOT EXISTS public.warehouse_peralatan_k2k3 (
    id SERIAL PRIMARY KEY,
    no TEXT,
    gambar TEXT,
    qr_code TEXT,
    nama_peralatan TEXT NOT NULL,
    kode TEXT UNIQUE NOT NULL,
    merk TEXT,
    kondisi TEXT DEFAULT 'BAIK',
    tgl_uji TEXT,
    status TEXT DEFAULT 'TERSEDIA',
    jenis TEXT,
    stok_gudang NUMERIC(12,2) DEFAULT 0,
    stok_mobil NUMERIC(12,2) DEFAULT 0,
    total_stok NUMERIC(12,2) DEFAULT 0,
    link_qr_code TEXT,
    link_gambar TEXT,
    link_gdrive TEXT,
    
    -- Kolom Mutasi Terintegrasi
    mutasi_terakhir_tgl TEXT,
    mutasi_jenis TEXT,
    mutasi_jumlah NUMERIC(10,2) DEFAULT 0,
    mutasi_pic TEXT,
    mutasi_keterangan TEXT,
    riwayat_mutasi JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_k2k3_kode ON public.warehouse_peralatan_k2k3(kode);
CREATE INDEX IF NOT EXISTS idx_wh_k2k3_kondisi ON public.warehouse_peralatan_k2k3(kondisi);

-- 3. MATERIAL
CREATE TABLE IF NOT EXISTS public.warehouse_material (
    id SERIAL PRIMARY KEY,
    no TEXT,
    gambar TEXT,
    qr_code TEXT,
    nama_jenis TEXT NOT NULL,
    kode TEXT UNIQUE NOT NULL,
    merk TEXT,
    stok_gudang NUMERIC(12,2) DEFAULT 0,
    stok_mobil NUMERIC(12,2) DEFAULT 0,
    total_stok NUMERIC(12,2) DEFAULT 0,
    link_qr_code TEXT,
    link_gambar TEXT,
    link_gdrive TEXT,
    
    -- Kolom Mutasi Terintegrasi
    mutasi_terakhir_tgl TEXT,
    mutasi_jenis TEXT,
    mutasi_jumlah NUMERIC(10,2) DEFAULT 0,
    mutasi_pic TEXT,
    mutasi_keterangan TEXT,
    riwayat_mutasi JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_material_kode ON public.warehouse_material(kode);

-- 4. KENDARAAN
CREATE TABLE IF NOT EXISTS public.warehouse_kendaraan (
    id SERIAL PRIMARY KEY,
    nama_kendaraan TEXT NOT NULL,
    plat_kendaraan TEXT UNIQUE NOT NULL,
    expire_plat TEXT,
    merk_tipe TEXT,
    no_rangka TEXT,
    no_mesin TEXT,
    status_pajak_tahunan TEXT DEFAULT 'AKTIF',
    status_pajak_5_tahunan TEXT DEFAULT 'AKTIF',
    status_bbm TEXT DEFAULT 'FULL',
    kondisi TEXT DEFAULT 'BAIK',
    keterangan TEXT,
    foto_kendaraan TEXT,
    link_gdrive_kendaraan TEXT,
    link_foto_stnk TEXT,
    link_gdrive_stnk TEXT,
    
    -- Kolom Mutasi Terintegrasi
    mutasi_terakhir_tgl TEXT,
    mutasi_jenis TEXT,
    mutasi_odometer_km NUMERIC(12,2) DEFAULT 0,
    mutasi_driver TEXT,
    mutasi_tujuan_wo TEXT,
    mutasi_keterangan TEXT,
    riwayat_mutasi JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_kendaraan_plat ON public.warehouse_kendaraan(plat_kendaraan);

-- 5. INVENTARIS KANTOR
CREATE TABLE IF NOT EXISTS public.warehouse_inventaris_kantor (
    id SERIAL PRIMARY KEY,
    no TEXT,
    kode TEXT UNIQUE NOT NULL,
    nama_barang TEXT NOT NULL,
    merk_tipe TEXT,
    jumlah NUMERIC(10,2) DEFAULT 1,
    kondisi TEXT DEFAULT 'BAIK',
    lokasi_ruangan TEXT DEFAULT 'Kantor PDKB',
    penanggung_jawab TEXT,
    keterangan TEXT,
    link_gambar TEXT,
    link_qr_code TEXT,
    
    -- Kolom Mutasi Terintegrasi
    mutasi_terakhir_tgl TEXT,
    mutasi_jenis TEXT,
    mutasi_jumlah NUMERIC(10,2) DEFAULT 0,
    mutasi_pic TEXT,
    mutasi_keterangan TEXT,
    riwayat_mutasi JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wh_inv_kode ON public.warehouse_inventaris_kantor(kode);

-- RLS
ALTER TABLE public.warehouse_peralatan_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_peralatan_k2k3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_kendaraan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventaris_kantor ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access warehouse_peralatan_kerja" ON public.warehouse_peralatan_kerja;
    CREATE POLICY "Public access warehouse_peralatan_kerja" ON public.warehouse_peralatan_kerja FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access warehouse_peralatan_k2k3" ON public.warehouse_peralatan_k2k3;
    CREATE POLICY "Public access warehouse_peralatan_k2k3" ON public.warehouse_peralatan_k2k3 FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access warehouse_material" ON public.warehouse_material;
    CREATE POLICY "Public access warehouse_material" ON public.warehouse_material FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access warehouse_kendaraan" ON public.warehouse_kendaraan;
    CREATE POLICY "Public access warehouse_kendaraan" ON public.warehouse_kendaraan FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access warehouse_inventaris_kantor" ON public.warehouse_inventaris_kantor;
    CREATE POLICY "Public access warehouse_inventaris_kantor" ON public.warehouse_inventaris_kantor FOR ALL USING (true) WITH CHECK (true);
END $$;
