-- =============================================================
-- DompetKu - Database Schema untuk Supabase
-- Jalankan seluruh skrip ini di: Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. ENUM untuk tipe transaksi (opsional, tapi menjaga data tetap konsisten)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('income', 'expense');
    END IF;
END
$$;

-- 2. Tabel utama transaksi
CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,                       -- id dari frontend (mis. "_a1b2c3d4")
    type        transaction_type NOT NULL,              -- 'income' atau 'expense'
    description TEXT            NOT NULL,               -- keterangan transaksi
    amount      NUMERIC(18, 2)  NOT NULL CHECK (amount > 0),  -- nominal, selalu positif
    category    TEXT            NOT NULL,               -- nama kategori (dari dropdown)
    date        DATE            NOT NULL,               -- tanggal transaksi (format YYYY-MM-DD)
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(), -- kapan baris dibuat
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(), -- kapan baris diubah
    user_id     UUID            DEFAULT auth.uid()      -- pemilik (Supabase Auth); NULL jika anon
);

-- 3. Index untuk mempercepat filter & pengurutan yang dipakai di frontend
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);

-- 4. Auto-update `updated_at` setiap kali baris diubah
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 5. Row Level Security (RLS) - wajib agar anon key aman dipakai di browser
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (mencegah error saat skrip di-run ulang)
DROP POLICY IF EXISTS "Users can view own transactions"    ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions"   ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions"   ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions"   ON transactions;

-- Mode demo: siapa saja bisa baca (tanpa login).
-- Ganti `USING (true)` menjadi `USING (user_id = auth.uid())` saat autentikasi sudah aktif.
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Mode demo: siapa saja bisa menambah data.
-- Ganti `WITH CHECK (true)` menjadi `WITH CHECK (user_id = auth.uid())` saat autentikasi sudah aktif.
CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Mode demo: siapa saja bisa mengubah data.
-- Ganti kedua `true` menjadi `user_id = auth.uid()` saat autentikasi sudah aktif.
CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Mode demo: siapa saja bisa menghapus data.
-- Ganti `USING (true)` menjadi `USING (user_id = auth.uid())` saat autentikasi sudah aktif.
CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    TO anon, authenticated
    USING (true);

-- =============================================================
-- SEED DATA (opsional) - hapus bagian ini untuk produksi
-- Memberi contoh data agar grafik & dashboard tidak kosong
-- saat pertama kali dibuka.
-- =============================================================
INSERT INTO transactions (id, type, description, amount, category, date) VALUES
    ('_seed01', 'income',  'Gaji Bulan Ini',       8500000, 'Gaji',                  '2026-10-01'),
    ('_seed02', 'income',  'Proyek Freelance Web', 2500000, 'Freelance / Proyek',    '2026-10-05'),
    ('_seed03', 'expense', 'Belanja Bulanan',      1200000, 'Belanja',               '2026-10-03'),
    ('_seed04', 'expense', 'Bayar Sewa Kos',       1500000, 'Tempat Tinggal / Sewa', '2026-10-02'),
    ('_seed05', 'expense', 'Makan di Restoran',      75000, 'Makanan & Minuman',     '2026-10-06'),
    ('_seed06', 'expense', 'Token Listrik',         200000, 'Listrik & Utilitas',    '2026-10-04'),
    ('_seed07', 'expense', 'Bensin Motor',          150000, 'Transportasi',          '2026-10-07'),
    ('_seed08', 'expense', 'Tiket Bioskop',          50000, 'Hiburan',               '2026-10-08')
ON CONFLICT (id) DO NOTHING;
