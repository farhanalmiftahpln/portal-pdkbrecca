-- ==============================================================================
-- MIGRASI SKEMA DATABASE SUPABASE: TABEL APP_USERS & SINKRONISASI DATA AUTH
-- Eksekusi skrip ini di SQL Editor pada Dashboard Supabase Anda (https://supabase.com/dashboard)
-- Skrip ini idempotent (dapat dijalankan berulang kali dengan aman)
-- ==============================================================================

-- 1. Buat tabel app_users jika belum ada
CREATE TABLE IF NOT EXISTS public.app_users (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  user_unit VARCHAR(100),
  user_bidang VARCHAR(100),
  user_pin VARCHAR(20) DEFAULT '123456',
  status VARCHAR(50) DEFAULT 'Izinkan',
  jabatan VARCHAR(100),
  foto TEXT,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indeks untuk kecepatan pencarian login
CREATE INDEX IF NOT EXISTS idx_app_users_user_id ON public.app_users(user_id);
CREATE INDEX IF NOT EXISTS idx_app_users_user_role ON public.app_users(user_role);
CREATE INDEX IF NOT EXISTS idx_app_users_user_unit ON public.app_users(user_unit);
CREATE INDEX IF NOT EXISTS idx_app_users_user_bidang ON public.app_users(user_bidang);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON public.app_users(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'Allow public read app_users') THEN
    CREATE POLICY "Allow public read app_users" ON public.app_users FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_users' AND policyname = 'Allow public write app_users') THEN
    CREATE POLICY "Allow public write app_users" ON public.app_users FOR ALL USING (true);
  END IF;
END $$;

-- 4. Masukkan seluruh data pengguna dari Spreadsheet USERS / Auth
INSERT INTO public.app_users (user_id, password, user_name, user_role, user_unit, user_bidang, user_pin, status)
VALUES
  ('Admin', 'adminP2KB', 'ADMIN SISTEM', 'ADMIN', 'ERANGEL', 'SISTEM', '123456', 'Izinkan'),
  ('1', '123', 'ADE ARRANG MANTIRI', 'MUP UP3', 'WATAMPONE', 'MANAJER UP3', '123456', 'Izinkan'),
  ('7802009F', '123', 'BAKHTIAR', 'ASMAN', 'WATAMPONE', 'ASMAN RING DAN KONS DIST', '123456', 'Pending'),
  ('2', '123', 'AGUSTIAN', 'SPV K3L', 'WATAMPONE', 'K3L DAN KAM', '123456', 'Pending'),
  ('9115793ZY', '123', 'MOCHAMAD RAMADHAN LERRICK', 'MUL ULP', 'HASANUDDIN', 'MANAJER ULP', '123456', 'Pending'),
  ('4', '123', 'KUKUH RIAN PRASETIO', 'MUL ULP', 'SENGKANG', 'MANAJER ULP', '123456', 'Pending'),
  ('5', '123', 'IRA INDIRA SARI', 'MUL ULP', 'PATANGKAI', 'MANAJER ULP', '123456', 'Pending'),
  ('8610591Z', '123', 'YUSUF TRIADI', 'MUL ULP', 'PARIA', 'MANAJER ULP', '123456', 'Pending'),
  ('89151436ZY', '123', 'YULIANTO DWI PUTRA', 'MUL ULP', 'TELLU BOCCOE', 'MANAJER ULP', '123456', 'Pending'),
  ('8914046ZY', '123', 'NUR HASAN', 'MUL ULP', 'ULOE', 'MANAJER ULP', '123456', 'Pending'),
  ('9110048F', '123', 'ISHARULMUHRAB. B', 'TL PDKB', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9716067FY', '123', 'FARHAN ALBAR MIFTAHULHUDA', 'PELAKSANA', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9817009FBY', '123', 'AKMAL FADIL', 'PREPARATOR', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9817016FBY', '123', 'ANDI ARLANGGA BUSPADI', 'PELAKSANA', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9718076FBY', '123', 'ANDI ASNAM IRFAN', 'PENGAWAS K3', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9618015FBY', '123', 'ANDI FADLI', 'PELAKSANA', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9818133FBY', '123', 'BOBY ALFIYANTO', 'PELAKSANA', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9717071FBY', '123', 'MUHAMMAD ANDRI LAODE', 'KEPALA REGU', 'WATAMPONE', 'PDKB', '123456', 'Izinkan'),
  ('9212073FY', '123', 'ALIM BAMULY', 'SURVEYOR', 'ULOE', 'TL TEKNIK', '123456', 'Izinkan'),
  ('9213020FY', '123', 'ANDI NURDIN', 'SURVEYOR', 'PATANGKAI', 'TL TEKNIK', '123456', 'Izinkan'),
  ('9419966ZY', '123', 'SABRIAL', 'SURVEYOR', 'PARIA', 'TL TEKNIK', '123456', 'Izinkan'),
  ('9413106FY', '123', 'MARDHAN AMRAN', 'SURVEYOR', 'SENGKANG', 'TL TEKNIK', '123456', 'Izinkan'),
  ('9413116FY', '123', 'ASWAR', 'SURVEYOR', 'TELLU BOCCOE', 'TL TEKNIK', '123456', 'Izinkan'),
  ('0021305ZY', '123', 'ROLLAND JONATHAN KOROMPIS', 'SURVEYOR', 'HASANUDDIN', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('0022202ZY', '123', 'JEREMY WARANEY WAURAN', 'SURVEYOR', 'ULOE', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('9718098FBY', '123', 'HAERIL MUSFAR', 'SURVEYOR', 'PATANGKAI', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('9921292ZY', '123', 'MUH NUR ADLU SYIFA', 'SURVEYOR', 'SENGKANG', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('9718090FBY', '123', 'ANDI MUH. ADE ISMAIL BAHAR', 'SURVEYOR', 'TELLU BOCCOE', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('9718103FBY', '123', 'KURNIAWAN PAHSAR RADITYA', 'SURVEYOR', 'HASANUDDIN', 'STAFF TEKNIK', '123456', 'Izinkan'),
  ('ROAMER', '123', 'ROAMER PDKB RECCA', 'INISIATOR', 'WATAMPONE', 'ROAMER', '123456', 'Izinkan'),
  ('MS', '2026', 'PDKB MAKASSAR SELATAN', 'PESERTA BAKTI', 'MAKASSAR SELATAN', 'BAKTI', '123456', 'Izinkan'),
  ('MU', '2026', 'PDKB MAKASSAR UTARA', 'PESERTA BAKTI', 'MAKASSAR UTARA', 'BAKTI', '123456', 'Izinkan'),
  ('KDI', '2026', 'PDKB KENDARI', 'PESERTA BAKTI', 'KENDARI', 'BAKTI', '123456', 'Izinkan'),
  ('MMJ', '2026', 'PDKB MAMUJU', 'PESERTA BAKTI', 'MAMUJU', 'BAKTI', '123456', 'Izinkan'),
  ('PRE', '2026', 'PDKB PAREPARE', 'PESERTA BAKTI', 'PAREPARE', 'BAKTI', '123456', 'Izinkan'),
  ('PLP', '2026', 'PDKB PALOPO', 'PESERTA BAKTI', 'PALOPO', 'BAKTI', '123456', 'Izinkan'),
  ('WTP', '2026', 'PDKB WATAMPONE', 'PESERTA BAKTI', 'WATAMPONE', 'BAKTI', '123456', 'Izinkan'),
  ('BBU', '2026', 'PDKB BAUBAU', 'PESERTA BAKTI', 'BAUBAU', 'BAKTI', '123456', 'Izinkan'),
  ('PRG', '2026', 'PDKB PINRANG', 'PESERTA BAKTI', 'PINRANG', 'BAKTI', '123456', 'Izinkan'),
  ('SSTB', '2026', 'PDKB SULSELRABAR', 'MANAJEMEN', 'SULSELRABAR', 'BAKTI', '123456', 'Izinkan')
ON CONFLICT (user_id) DO UPDATE SET
  password = EXCLUDED.password,
  user_name = EXCLUDED.user_name,
  user_role = EXCLUDED.user_role,
  user_unit = EXCLUDED.user_unit,
  user_bidang = EXCLUDED.user_bidang,
  user_pin = EXCLUDED.user_pin,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. Komentar Tabel
COMMENT ON TABLE public.app_users IS 'Tabel otentikasi & kredensial pengguna aplikasi PLN UP3 Watampone disinkronkan dari Spreadsheet USERS/Auth';
