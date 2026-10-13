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
const SUPABASE_URL = "https://cqmsrzacumarftampzdu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbXNyemFjdW1hcmZ0YW1wemR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU2NjMsImV4cCI6MjEwNzQ2MTY2M30.J0Rvqn_H5-5l2v8kveOrxxDsNILYwntHZ9m7jLszhaQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbXNyemFjdW1hcmZ0YW1wemR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU2NjMsImV4cCI6MjEwNzQ2MTY2M30.J0Rvqn_H5-5l2v8kveOrxxDsNILYwntHZ9m7jLszhaQ_ANON_PUBLIC_KEY";
const SUPABASE_TABLE_NAME = "transactions";
// ------------------------------------------------------------

// Initialize the Supabase client (available globally as `supabase`)
let supabase = null;

try {
    if (SUPABASE_URL.includes("YOUR_PROJECT_REF") || SUPABASE_ANON_KEY.includes("YOUR_ANON")) {
        console.warn(
            "[DompetKu] Supabase belum dikonfigurasi.\n" +
            "Isi SUPABASE_URL dan SUPABASE_ANON_KEY di supabase.js.\n" +
            "Aplikasi tetap berjalan menggunakan localStorage (mode offline)."
        );
    } else if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    if (!supabase) return [];
    const { data, error } = await supabase
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
    if (!supabase) return null;
    const { data, error } = await supabase
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
    if (!supabase) return false;
    const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .delete()
        .eq("id", id);
    if (error) {
        console.error("[DompetKu] Gagal menghapus transaksi:", error.message);
        return false;
    }
    return true;
}

// Hapus semua transaksi milik user yang sedang login
async function clearAllTransactions() {
    if (!supabase) return false;
    const { error } = await supabase
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
    return supabase !== null;
}
