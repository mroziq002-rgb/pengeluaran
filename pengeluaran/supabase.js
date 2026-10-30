// =============================================================
// Supabase Configuration - DompetKu
// =============================================================
// HOW TO USE:
// 1. Create a free project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your "Project URL" and "anon public" key below
// 4. Run schema.sql in the Supabase SQL Editor
// 5. Load this file BEFORE script.js in index.html:
//
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//    <script src="supabase.js"></script>
//    <script src="script.js"></script>
//
// NOTE: The anon key is safe to expose in the browser - it only
// grants access allowed by your Row Level Security (RLS) policies.
// Never put the "service_role" key in frontend code.
// =============================================================

// --- REPLACE THESE PLACEHOLDERS WITH YOUR OWN CREDENTIALS ---
const SUPABASE_URL = "https://vbjunpxriamqqpxmwpxv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rKpdr_jaisSwTPfZKVlFtQ_5ShKckDR";
const SUPABASE_TABLE_NAME = "transactions";
// ------------------------------------------------------------

// Initialize the Supabase client (available globally as `supabase`)
let dompetKuSupabaseClient = null;

try {
    const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL);
    const validKey = SUPABASE_ANON_KEY.startsWith("eyJ") ||
        SUPABASE_ANON_KEY.startsWith("sb_publishable_");

    if (!validUrl || !validKey) {
        console.warn(
            "[DompetKu] Supabase belum dikonfigurasi dengan publishable/anon key yang valid.\n" +
            "Ganti SUPABASE_ANON_KEY di supabase.js, lalu muat ulang halaman.\n" +
            "Aplikasi tetap berjalan menggunakan localStorage (mode offline)."
        );
    } else if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
        dompetKuSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("[DompetKu] Supabase client berhasil diinisialisasi.");
    } else {
        console.warn("[DompetKu] Library @supabase/supabase-js tidak ditemukan. Pastikan CDN dimuat di index.html.");
    }
} catch (error) {
    console.error("[DompetKu] Gagal menginisialisasi Supabase:", error);
}

// =============================================================
// Database Helpers - CRUD untuk tabel `transactions`
// =============================================================

// Ambil semua transaksi (urut tanggal terbaru)
async function fetchTransactions() {
    if (!dompetKuSupabaseClient) return [];
    const { data, error } = await dompetKuSupabaseClient
        .from(SUPABASE_TABLE_NAME)
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
    if (error) {
        console.error("[DompetKu] Gagal mengambil transaksi:", error.message);
        return [];
    }
    return data || [];
}

// Tambah satu transaksi
// Shape harus sama dengan model di script.js:
// { id, type: 'income'|'expense', description, amount, category, date }
async function insertTransaction(transaction) {
    if (!dompetKuSupabaseClient) return null;
    const { data, error } = await dompetKuSupabaseClient
        .from(SUPABASE_TABLE_NAME)
        .insert([transaction])
        .select()
        .single();
    if (error) {
        console.error("[DompetKu] Gagal menambah transaksi:", error.message);
        return null;
    }
    return data;
}

// Hapus satu transaksi berdasarkan id
async function deleteTransactionById(id) {
    if (!dompetKuSupabaseClient) return false;
    const { error } = await dompetKuSupabaseClient
        .from(SUPABASE_TABLE_NAME)
        .delete()
        .eq("id", id);
    if (error) {
        console.error("[DompetKu] Gagal menghapus transaksi:", error.message);
        return false;
    }
    return true;
}

// Hapus semua transaksi
async function clearAllTransactions() {
    if (!dompetKuSupabaseClient) return false;
    const { error } = await dompetKuSupabaseClient
        .from(SUPABASE_TABLE_NAME)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // hapus semua baris
    if (error) {
        console.error("[DompetKu] Gagal menghapus semua transaksi:", error.message);
        return false;
    }
    return true;
}

// Cek apakah Supabase aktif (digunakan script.js untuk memilih online/offline)
function isSupabaseReady() {
    return dompetKuSupabaseClient !== null;
}
