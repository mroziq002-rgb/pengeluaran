// Definisi Kategori
const categories = {
    expense: [
        { name: 'Makanan & Minuman', icon: 'fa-utensils' },
        { name: 'Tempat Tinggal / Sewa', icon: 'fa-house' },
        { name: 'Listrik & Utilitas', icon: 'fa-bolt' },
        { name: 'Transportasi', icon: 'fa-car' },
        { name: 'Hiburan', icon: 'fa-film' },
        { name: 'Belanja', icon: 'fa-bag-shopping' },
        { name: 'Kesehatan', icon: 'fa-heart-pulse' },
        { name: 'Lainnya (Pengeluaran)', icon: 'fa-receipt' }
    ],
    income: [
        { name: 'Gaji', icon: 'fa-briefcase' },
        { name: 'Freelance / Proyek', icon: 'fa-laptop-code' },
        { name: 'Investasi', icon: 'fa-chart-line' },
        { name: 'Hadiah / Bonus', icon: 'fa-gift' },
        { name: 'Lainnya (Pemasukan)', icon: 'fa-sack-dollar' }
    ]
};

// State Aplikasi
let state = {
    transactions: JSON.parse(localStorage.getItem('budget_transactions')) || [],
    currentType: 'expense', // 'expense' atau 'income'
    filter: 'all',          // 'all', 'income', 'expense'
    searchQuery: '',
    sortBy: 'date-desc'
};

let expenseChartInstance = null;

// Elemen DOM
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const typeExpenseBtn = document.getElementById('typeExpenseBtn');
const typeIncomeBtn = document.getElementById('typeIncomeBtn');
const transactionListEl = document.getElementById('transactionList');
const emptyStateEl = document.getElementById('emptyState');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const filterAllBtn = document.getElementById('filterAll');
const filterIncomeBtn = document.getElementById('filterIncome');
const filterExpenseBtn = document.getElementById('filterExpense');
const searchInput = document.getElementById('searchInput');
const sortBySelect = document.getElementById('sortBy');
const clearDataBtn = document.getElementById('clearDataBtn');
const noChartDataEl = document.getElementById('noChartData');

// Inisialisasi Aplikasi
function init() {
    // Set default tanggal ke hari ini
    dateInput.valueAsDate = new Date();
    updateCategoryDropdown();
    setupEventListeners();
    render();
}

// Memperbarui Pilihan Kategori berdasarkan tipe (expense/income)
function updateCategoryDropdown() {
    categorySelect.innerHTML = '';
    const list = categories[state.currentType];
    list.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

// Pengaturan Event Listeners
function setupEventListeners() {
    // Tombol Tipe: Pengeluaran
    typeExpenseBtn.addEventListener('click', () => {
        state.currentType = 'expense';
        typeExpenseBtn.className = "py-2 rounded-lg bg-white text-slate-800 shadow-sm transition-all cursor-pointer";
        typeIncomeBtn.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer";
        updateCategoryDropdown();
    });

    // Tombol Tipe: Pemasukan
    typeIncomeBtn.addEventListener('click', () => {
        state.currentType = 'income';
        typeIncomeBtn.className = "py-2 rounded-lg bg-white text-slate-800 shadow-sm transition-all cursor-pointer";
        typeExpenseBtn.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer";
        updateCategoryDropdown();
    });

    // Form Submit
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        const date = dateInput.value;

        console.log("Data input:", { description, amount, category, date, type: state.currentType });

        if (!description || isNaN(amount) || amount <= 0 || !date) {
            alert("Mohon isi semua data dengan benar!");
            return;
        }

        const newTransaction = {
            id: '_' + Math.random().toString(36).substr(2, 9),
            type: state.currentType,
            description,
            amount,
            category,
            date
        };

        state.transactions.push(newTransaction);
        saveAndRender();

        // Reset input
        descriptionInput.value = '';
        amountInput.value = '';
        dateInput.valueAsDate = new Date();
        descriptionInput.focus();
    });

    // Filter Kategori
    filterAllBtn.addEventListener('click', () => setFilter('all', filterAllBtn));
    filterIncomeBtn.addEventListener('click', () => setFilter('income', filterIncomeBtn));
    filterExpenseBtn.addEventListener('click', () => setFilter('expense', filterExpenseBtn));

    // Pencarian
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderTransactions();
    });

    // Urutan
    sortBySelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderTransactions();
    });

    // Reset Semua Data
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat transaksi?')) {
            state.transactions = [];
            saveAndRender();
        }
    });
}

function setFilter(filterType, activeBtn) {
    state.filter = filterType;
    [filterAllBtn, filterIncomeBtn, filterExpenseBtn].forEach(btn => {
        btn.className = "px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex-1";
    });
    activeBtn.className = "px-3 py-1.5 rounded-lg bg-white text-slate-800 shadow-sm transition-all cursor-pointer flex-1";
    renderTransactions();
}

function saveAndRender() {
    localStorage.setItem('budget_transactions', JSON.stringify(state.transactions));
    render();
}

// Render Utama
function render() {
    renderSummary();
    renderTransactions();
    renderChart();
}

// Render Ringkasan Total
function renderSummary() {
    const totals = state.transactions.reduce((acc, curr) => {
        if (curr.type === 'income') {
            acc.income += curr.amount;
        } else {
            acc.expense += curr.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });

    const balance = totals.income - totals.expense;

    totalBalanceEl.textContent = formatCurrency(balance);
    totalIncomeEl.textContent = formatCurrency(totals.income);
    totalExpenseEl.textContent = formatCurrency(totals.expense);

    // Warna teks saldo
    if (balance < 0) {
        totalBalanceEl.className = "text-2xl font-extrabold text-rose-600 mt-0.5";
    } else {
        totalBalanceEl.className = "text-2xl font-extrabold text-slate-900 mt-0.5";
    }
}

// Render Daftar Transaksi
function renderTransactions() {
    let filtered = state.transactions.filter(t => {
        if (state.filter === 'income' && t.type !== 'income') return false;
        if (state.filter === 'expense' && t.type !== 'expense') return false;
        if (state.searchQuery && !t.description.toLowerCase().includes(state.searchQuery) && !t.category.toLowerCase().includes(state.searchQuery)) {
            return false;
        }
        return true;
    });

    // Pengurutan
    filtered.sort((a, b) => {
        if (state.sortBy === 'date-desc') {
            return new Date(b.date) - new Date(a.date);
        } else if (state.sortBy === 'date-asc') {
            return new Date(a.date) - new Date(b.date);
        } else if (state.sortBy === 'amount-desc') {
            return b.amount - a.amount;
        } else if (state.sortBy === 'amount-asc') {
            return a.amount - b.amount;
        }
    });

    transactionListEl.innerHTML = '';

    if (filtered.length === 0) {
        emptyStateEl.classList.remove('hidden');
        emptyStateEl.classList.add('flex');
        return;
    } else {
        emptyStateEl.classList.remove('flex');
        emptyStateEl.classList.add('hidden');
    }

    filtered.forEach(t => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all group";

        // Temukan Ikon Kategori
        const catList = categories[t.type];
        const foundCat = catList ? catList.find(c => c.name === t.category) : null;
        const iconClass = foundCat ? foundCat.icon : 'fa-tag';

        const isIncome = t.type === 'income';
        const amountSign = isIncome ? '+' : '-';
        const amountColor = isIncome ? 'text-emerald-600' : 'text-slate-800';
        const badgeBg = isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';

        item.innerHTML = `
            <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center shrink-0">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div>
                    <h4 class="text-sm font-semibold text-slate-800">${escapeHtml(t.description)}</h4>
                    <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span class="font-medium text-slate-500">${escapeHtml(t.category)}</span>
                        <span>&bull;</span>
                        <span>${formatDate(t.date)}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-sm font-bold ${amountColor}">${amountSign}${formatCurrency(t.amount)}</span>
                <button onclick="deleteTransaction('${t.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer" title="Hapus">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        transactionListEl.appendChild(item);
    });
}

// Hapus Transaksi berdasarkan ID
window.deleteTransaction = function (id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveAndRender();
};

// Render Diagram Donat Pengeluaran
function renderChart() {
    const expenses = state.transactions.filter(t => t.type === 'expense');

    // Akumulasi berdasarkan kategori
    const categoryTotals = {};
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const chartCanvas = document.getElementById('expenseChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    if (labels.length === 0) {
        noChartDataEl.classList.remove('hidden');
        noChartDataEl.classList.add('flex');
        if (expenseChartInstance) {
            expenseChartInstance.destroy();
            expenseChartInstance = null;
        }
        return;
    } else {
        noChartDataEl.classList.remove('flex');
        noChartDataEl.classList.add('hidden');
    }

    const backgroundColors = [
        '#6366f1', '#ec4899', '#f59e0b', '#10b981',
        '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'
    ];

    if (expenseChartInstance) {
        expenseChartInstance.data.labels = labels;
        expenseChartInstance.data.datasets[0].data = data;
        expenseChartInstance.update();
    } else {
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

// Fungsi Format Rupiah & Tanggal
function formatCurrency(amount) {
    const formatted = Math.abs(amount).toLocaleString('id-ID');
    return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Jalankan inisialisasi setelah DOM selesai dimuat
window.addEventListener('DOMContentLoaded', init);