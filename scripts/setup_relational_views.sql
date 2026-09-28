-- ==============================================================================
-- SKRIP STRUKTUR DATA & RELASI SUPABASE (SETARA XLOOKUP & QUERY DI GOOGLE SHEETS)
-- ==============================================================================
-- Skrip ini dapat dijalankan langsung di Menu "SQL Editor" pada Dashboard Supabase Anda.
-- Tujuannya:
-- 1. Menghubungkan tabel Master (work_orders) dengan Rencana Kerja (work_plans),
--    Tracking (tracking), dan Realisasi (realisasi) via Foreign Key.
-- 2. Membuat VIEW Database (v_work_plan_detail) yang secara otomatis melakukan "XLOOKUP"
--    dari tabel master sehingga foto temuan, lokasi, dan detail selalu sinkron.
-- 3. Menambahkan pengurutan numerik agar urutan data selalu rapi seperti di spreadsheet.
-- ==============================================================================

-- 1. Pastikan kolom no_wo pada work_orders memiliki indeks unik sebagai Master ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_no_wo ON work_orders(no_wo);

-- 2. Tambahkan kolom urutan numerik (Stored Computed Column) agar data di Supabase Table Editor
--    dapat di-sort berurutan secara numerik (1, 2, 3 ... 1487, 1488) bukan alfabetis.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'wo_order_num'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN wo_order_num INTEGER 
      GENERATED ALWAYS AS (NULLIF(regexp_replace(no_wo, '\D', '', 'g'), '')::integer) STORED;
    CREATE INDEX idx_work_orders_wo_order_num ON work_orders(wo_order_num DESC);
  END IF;
END $$;

-- 3. Relasi Foreign Key (Opsional / Recommended)
-- Menghubungkan work_plans ke work_orders berdasarkan no_wo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_work_plans_no_wo'
  ) THEN
    -- Hanya ditambahkan jika semua no_wo di work_plans valid
    BEGIN
      ALTER TABLE work_plans 
        ADD CONSTRAINT fk_work_plans_no_wo 
        FOREIGN KEY (no_wo) REFERENCES work_orders(no_wo) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint Foreign Key dilewati jika ada no_wo lama yang belum terdaftar di work_orders.';
    END;
  END IF;
END $$;

-- 4. DATABASE VIEW: v_work_plan_detail
-- Setara fungsi =XLOOKUP(...) dan =QUERY(...) di Google Sheets!
-- Menggabungkan Rencana Kerja + Master Work Order + Tracking Lapangan
CREATE OR REPLACE VIEW v_work_plan_detail AS
SELECT 
  wp.id AS plan_id,
  wp.no_wo,
  wp.tanggal_direncanakan,
  wp.progres,
  -- Otomatis XLOOKUP dari master work_orders jika kolom di work_plans kosong/null:
  COALESCE(wp.surveyor, wo.surveyor) AS surveyor,
  COALESCE(wp.ulp, wo.ulp) AS ulp,
  COALESCE(wp.gardu_induk, wo.gardu_induk) AS gardu_induk,
  COALESCE(wp.penyulang, wo.penyulang) AS penyulang,
  COALESCE(wp.segmen, wo.segmen) AS segmen,
  COALESCE(wp.temuan, wo.temuan) AS temuan,
  COALESCE(wp.alamat, wo.alamat) AS alamat,
  COALESCE(wp.titik_koordinat, wo.koordinat) AS koordinat,
  COALESCE(wp.foto_temuan, wo.foto) AS foto_temuan,
  COALESCE(wp.skala_prioritas, wo.skala_prioritas) AS skala_prioritas,
  COALESCE(wp.jenis_tiang, wo.jenis_tiang) AS jenis_tiang,
  COALESCE(wp.ukuran_tiang, wo.ukuran_tiang) AS ukuran_tiang,
  COALESCE(wp.jenis_konduktor, wo.jenis_konduktor) AS jenis_konduktor,
  COALESCE(wp.ukuran_konduktor, wo.ukuran_konduktor) AS ukuran_konduktor,
  COALESCE(wp.keypoint, wo.keypoint) AS keypoint,
  COALESCE(wp.keterangan, wo.keterangan) AS keterangan,
  -- Kelengkapan Berkas K3
  wp.sop_pekerjaan,
  wp.instruksi_kerja,
  wp.detail_pekerjaan,
  wp.wp,
  wp.ibppr,
  wp.jsa,
  wp.sp2b,
  wp.sp3b,
  wp.tailgate_session,
  wp.status_berkas,
  wp.tanggal_realisasi,
  wp.konfirmasi,
  -- Tracking Progress Lapangan
  tr.start AS tracking_start,
  tr.persiapan AS tracking_persiapan,
  tr.pelaksanaan AS tracking_pelaksanaan,
  tr.closing AS tracking_closing,
  tr.status_swa AS tracking_status_swa,
  tr.foto_start,
  tr.foto_persiapan,
  tr.foto_pelaksanaan,
  wp.created_at,
  wp.updated_at
FROM work_plans wp
LEFT JOIN work_orders wo ON wp.no_wo = wo.no_wo
LEFT JOIN tracking tr ON wp.no_wo = tr.no_wo;

-- 5. Berikan izin baca pada View untuk authenticated & anon role
GRANT SELECT ON v_work_plan_detail TO anon, authenticated, service_role;
