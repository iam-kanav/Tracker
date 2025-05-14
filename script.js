document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let appState = {
        settings: {
            initialBankBalance: 0,
            fixedMinimum: 0,
            dailySpendingGoal: 300,
            setupComplete: false,
        },
        transactions: [],
        ui: {
            currentFilterMonthYear: '', // YYYY-MM
            editingTransactionId: null,
        }
    };

    // --- DOM ELEMENTS ---
    // Modals
    const setupModal = document.getElementById('setupModal');
    const transactionModal = document.getElementById('transactionModal');
    // Setup Form
    const initialBalanceInput = document.getElementById('initialBalance');
    const fixedMinimumInput = document.getElementById('fixedMinimum');
    const dailyGoalInput = document.getElementById('dailyGoal');
    const saveSetupBtn = document.getElementById('saveSetupBtn');
    // Main Content Area
    const mainContent = document.getElementById('mainContent');
    // Header
    const currentMonthYearDisplay = document.getElementById('currentMonthYearDisplay');
    // Dashboard
    const usableFundsDisplay = document.getElementById('usableFundsDisplay');
    const dailySpendTotalDisplay = document.getElementById('dailySpendTotalDisplay');
    const dailySpendProgressBar = document.getElementById('dailySpendProgressBar');
    const dailySpendingGoalMainDisplay = document.getElementById('dailySpendingGoalMainDisplay');
    // Monthly Summary
    const totalIncomeMonthDisplay = document.getElementById('totalIncomeMonthDisplay');
    const toMotherDisplay = document.getElementById('toMotherDisplay');
    const netAvailableDisplay = document.getElementById('netAvailableDisplay');
    const targetSavingsDisplay = document.getElementById('targetSavingsDisplay');
    const spendingBudgetDisplay = document.getElementById('spendingBudgetDisplay');
    const actualSpentMonthDisplay = document.getElementById('actualSpentMonthDisplay');
    const budgetRemainingDisplay = document.getElementById('budgetRemainingDisplay');
    const actualSavedMonthDisplay = document.getElementById('actualSavedMonthDisplay');
    // Transaction List & Filter
    const monthFilter = document.getElementById('monthFilter');
    const transactionListUl = document.getElementById('transactionList');
    // Transaction Modal Form
    const transactionModalTitle = document.getElementById('transactionModalTitle');
    const editingTransactionIdInput = document.getElementById('editingTransactionId');
    const transactionTypeInput = document.getElementById('transactionType');
    const transactionAmountInput = document.getElementById('transactionAmount');
    const transactionCategoryInput = document.getElementById('transactionCategory');
    const transactionDateInput = document.getElementById('transactionDate');
    const transactionDescriptionInput = document.getElementById('transactionDescription');
    const saveTransactionBtn = document.getElementById('saveTransactionBtn');
    // FAB & Other Buttons
    const fabAddTransaction = document.getElementById('fabAddTransaction');
    const resetDataAppBtn = document.getElementById('resetDataAppBtn');
    // Rules
    const ruleDailyGoalDisplay = document.getElementById('ruleDailyGoalDisplay');
    // Footer
    const currentYearDisplay = document.getElementById('currentYear');

    // --- LOCAL STORAGE FUNCTIONS ---
    const STORAGE_KEYS = {
        SETTINGS: 'finScribeSettings_v2',
        TRANSACTIONS: 'finScribeTransactions_v2'
    };

    function saveState() {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appState.settings));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(appState.transactions));
    }

    function loadState() {
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedSettings) {
            appState.settings = JSON.parse(storedSettings);
        }
        const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (storedTransactions) {
            appState.transactions = JSON.parse(storedTransactions).map(t => ({
                ...t,
                date: new Date(t.date) // Ensure date is a Date object
            }));
        }
    }

    // --- INITIALIZATION ---
    function init() {
        loadState();
        currentYearDisplay.textContent = new Date().getFullYear();

        if (!appState.settings.setupComplete) {
            setupModal.classList.add('active');
            mainContent.style.display = 'none';
        } else {
            mainContent.style.display = 'block';
            setupModal.classList.remove('active');
            const today = new Date();
            appState.ui.currentFilterMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            renderApp();
        }
        addEventListeners();
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        saveSetupBtn.addEventListener('click', handleSaveSetup);
        fabAddTransaction.addEventListener('click', () => openTransactionModal());
        saveTransactionBtn.addEventListener('click', handleSaveTransaction);
        monthFilter.addEventListener('change', handleMonthFilterChange);
        resetDataAppBtn.addEventListener('click', handleResetData);

        // Close modal buttons
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modalId;
                if (modalId) document.getElementById(modalId).classList.remove('active');
            });
        });
         // Close modal on outside click
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        });
    }

    // --- HANDLERS ---
    function handleSaveSetup() {
        const initialBalance = parseFloat(initialBalanceInput.value);
        const fixedMinimum = parseFloat(fixedMinimumInput.value);
        const dailyGoal = parseFloat(dailyGoalInput.value);

        if (isNaN(initialBalance) || isNaN(fixedMinimum) || isNaN(dailyGoal) || dailyGoal <= 0) {
            alert('Please enter valid numbers for all fields. Daily goal must be positive.');
            return;
        }
        if (fixedMinimum < 0) {
             alert('Fixed minimum cannot be negative.');
            return;
        }
        if (initialBalance < fixedMinimum) {
            alert('Initial balance cannot be less than fixed minimum.');
            return;
        }

        appState.settings.initialBankBalance = initialBalance;
        appState.settings.fixedMinimum = fixedMinimum;
        appState.settings.dailySpendingGoal = dailyGoal;
        appState.settings.setupComplete = true;
        
        saveState();
        setupModal.classList.remove('active');
        mainContent.style.display = 'block';
        const today = new Date();
        appState.ui.currentFilterMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        renderApp();
    }
    
    function openTransactionModal(transactionToEdit = null) {
        transactionModal.classList.add('active');
        transactionDateInput.valueAsDate = new Date(); // Default to today
        transactionAmountInput.value = '';
        transactionDescriptionInput.value = '';
        transactionCategoryInput.value = 'Food'; // Default category
        transactionTypeInput.value = 'expense'; // Default type
        editingTransactionIdInput.value = '';
        transactionModalTitle.textContent = 'Add Transaction';

        if (transactionToEdit) {
            transactionModalTitle.textContent = 'Edit Transaction';
            editingTransactionIdInput.value = transactionToEdit.id;
            transactionTypeInput.value = transactionToEdit.type;
            transactionAmountInput.value = transactionToEdit.amount;
            transactionCategoryInput.value = transactionToEdit.category;
            transactionDescriptionInput.value = transactionToEdit.description;
            // Format date correctly for input type="date"
            const yyyy = transactionToEdit.date.getFullYear();
            const mm = String(transactionToEdit.date.getMonth() + 1).padStart(2, '0');
            const dd = String(transactionToEdit.date.getDate()).padStart(2, '0');
            transactionDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
    }

    function handleSaveTransaction() {
        const type = transactionTypeInput.value;
        const amount = parseFloat(transactionAmountInput.value);
        const category = transactionCategoryInput.value;
        const dateString = transactionDateInput.value;
        const description = transactionDescriptionInput.value.trim();
        const editingId = editingTransactionIdInput.value;

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }
        if (!dateString) {
            alert('Please select a date.');
            return;
        }
        // Parse date string to avoid timezone issues, ensuring it's treated as local
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to be safe


        if (editingId) { // Editing existing transaction
            const index = appState.transactions.findIndex(t => t.id === editingId);
            if (index > -1) {
                appState.transactions[index] = { ...appState.transactions[index], type, amount, category, date, description };
            }
        } else { // Adding new transaction
            const newTransaction = {
                id: Date.now().toString(),
                type, amount, category, date, description
            };
            appState.transactions.push(newTransaction);
        }
        
        appState.transactions.sort((a, b) => b.date - a.date); // Sort by date descending
        saveState();
        renderApp();
        transactionModal.classList.remove('active');
    }

    function handleDeleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            appState.transactions = appState.transactions.filter(t => t.id !== id);
            saveState();
            renderApp();
        }
    }

    function handleMonthFilterChange(e) {
        appState.ui.currentFilterMonthYear = e.target.value;
        renderApp(); // Re-render everything based on new filter
    }
    
    function handleResetData() {
        if (confirm('DANGER! This will erase ALL your financial data and reset the app. Are you absolutely sure?')) {
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
            // Reset in-memory state to defaults
            appState.settings = { initialBankBalance: 0, fixedMinimum: 0, dailySpendingGoal: 300, setupComplete: false };
            appState.transactions = [];
            appState.ui.currentFilterMonthYear = '';
            appState.ui.editingTransactionId = null;
            
            // Show setup modal, hide main content
            setupModal.classList.add('active');
            mainContent.style.display = 'none';
            // Clear form fields in setup modal
            initialBalanceInput.value = '';
            fixedMinimumInput.value = '';
            dailyGoalInput.value = '';
            // No need to call renderApp() as setup screen will be shown
        }
    }

    // --- CALCULATIONS ---
    function getFilteredTransactions(monthYear) {
        if (!monthYear) return [];
        const [year, month] = monthYear.split('-').map(Number);
        return appState.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && (tDate.getMonth() + 1) === month;
        });
    }

    function calculateOverallBalances() {
        let totalIncomeAllTime = 0;
        let totalExpensesAllTime = 0;
        appState.transactions.forEach(t => {
            if (t.type === 'income') totalIncomeAllTime += t.amount;
            else totalExpensesAllTime += t.amount;
        });
        const usableFunds = appState.settings.initialBankBalance - appState.settings.fixedMinimum + totalIncomeAllTime - totalExpensesAllTime;
        return { usableFunds };
    }

    function calculateMonthlySummary(transactionsForMonth) {
        let incomeThisMonth = 0;
        let expensesThisMonth = 0;
        transactionsForMonth.forEach(t => {
            if (t.type === 'income') incomeThisMonth += t.amount;
            else expensesThisMonth += t.amount;
        });

        const motherShare = incomeThisMonth * 0.30;
        const netAvailable = incomeThisMonth - motherShare;
        const targetSavings = netAvailable * 0.40;
        const spendingBudget = netAvailable * 0.60; // Or netAvailable - targetSavings
        const budgetRemaining = spendingBudget - expensesThisMonth;
        const actualSaved = incomeThisMonth - expensesThisMonth; // This is total income minus total expenses for the month

        return {
            incomeThisMonth, expensesThisMonth, motherShare, netAvailable,
            targetSavings, spendingBudget, budgetRemaining, actualSaved
        };
    }

    function calculateDailySpending() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        let dailySpend = 0;
        appState.transactions.forEach(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0); // Normalize transaction date
            if (t.type === 'expense' && tDate.getTime() === today.getTime()) {
                dailySpend += t.amount;
            }
        });
        return dailySpend;
    }

    // --- RENDER FUNCTIONS ---
    function formatCurrency(amount) {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function renderApp() {
        if (!appState.settings.setupComplete) return; // Don't render if setup not done

        populateMonthFilter(); // Needs to be done before setting filter value
        
        // Set current month for display and filter if not already set
        if (!appState.ui.currentFilterMonthYear) {
            const today = new Date();
            appState.ui.currentFilterMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        }
        monthFilter.value = appState.ui.currentFilterMonthYear; // Ensure filter dropdown reflects current state

        const [currentYear, currentMonthNum] = appState.ui.currentFilterMonthYear.split('-');
        const displayDate = new Date(currentYear, currentMonthNum - 1, 1);
        currentMonthYearDisplay.textContent = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Overall Balances
        const { usableFunds } = calculateOverallBalances();
        usableFundsDisplay.textContent = formatCurrency(usableFunds);

        // Daily Spending
        const dailySpend = calculateDailySpending();
        const dailyGoal = appState.settings.dailySpendingGoal;
        dailySpendTotalDisplay.textContent = formatCurrency(dailySpend);
        dailySpendingGoalMainDisplay.textContent = formatCurrency(dailyGoal);
        ruleDailyGoalDisplay.textContent = formatCurrency(dailyGoal); // Update rule display

        const dailyProgress = Math.min((dailySpend / dailyGoal) * 100, 100);
        dailySpendProgressBar.style.width = `${dailyProgress}%`;
        dailySpendProgressBar.className = 'progress-bar'; // Reset classes
        if (dailySpend > dailyGoal) dailySpendProgressBar.classList.add('danger');
        else if (dailySpend > dailyGoal * 0.75) dailySpendProgressBar.classList.add('warning');

        // Monthly Summary for the filtered month
        const transactionsForSelectedMonth = getFilteredTransactions(appState.ui.currentFilterMonthYear);
        const summary = calculateMonthlySummary(transactionsForSelectedMonth);
        totalIncomeMonthDisplay.textContent = formatCurrency(summary.incomeThisMonth);
        toMotherDisplay.textContent = formatCurrency(summary.motherShare);
        netAvailableDisplay.textContent = formatCurrency(summary.netAvailable);
        targetSavingsDisplay.textContent = formatCurrency(summary.targetSavings);
        spendingBudgetDisplay.textContent = formatCurrency(summary.spendingBudget);
        actualSpentMonthDisplay.textContent = formatCurrency(summary.expensesThisMonth);
        budgetRemainingDisplay.textContent = formatCurrency(summary.budgetRemaining);
        budgetRemainingDisplay.classList.toggle('negative', summary.budgetRemaining < 0);
        actualSavedMonthDisplay.textContent = formatCurrency(summary.actualSaved);

        renderTransactionList(transactionsForSelectedMonth);
    }

    function populateMonthFilter() {
        const SmonthYears = new Set();
        const today = new Date();
        // Always add current month to filter options
        SmonthYears.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

        appState.transactions.forEach(t => {
            const date = new Date(t.date);
            SmonthYears.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        
        const sortedMonthYears = Array.from(SmonthYears).sort().reverse(); // Most recent first
        
        const currentFilterValue = monthFilter.value; // Preserve current selection if possible
        monthFilter.innerHTML = ''; // Clear existing options
        
        sortedMonthYears.forEach(my => {
            const option = document.createElement('option');
            option.value = my;
            const [year, monthNum] = my.split('-');
            const dateForDisplay = new Date(year, monthNum - 1, 1);
            option.textContent = dateForDisplay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthFilter.appendChild(option);
        });

        // Restore selection or set to latest
        if (sortedMonthYears.includes(currentFilterValue)) {
            monthFilter.value = currentFilterValue;
        } else if (sortedMonthYears.length > 0) {
            monthFilter.value = sortedMonthYears[0];
            appState.ui.currentFilterMonthYear = sortedMonthYears[0]; // Update state if it was invalid
        }
    }

    function renderTransactionList(transactionsToRender) {
        transactionListUl.innerHTML = ''; // Clear
        if (transactionsToRender.length === 0) {
            transactionListUl.innerHTML = '<li class="no-transactions">No transactions for this period.</li>';
            return;
        }

        transactionsToRender.forEach(t => {
            const li = document.createElement('li');
            const iconClass = t.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
            const amountClass = t.type === 'income' ? 'income' : 'expense';
            const sign = t.type === 'income' ? '+' : '-';
            
            li.innerHTML = `
                <span class="transaction-icon ${amountClass}"><i class="fas ${iconClass}"></i></span>
                <div class="transaction-details">
                    <span class="description">${t.description || t.category}</span>
                    <span class="category-date">${t.category} - ${new Date(t.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'2-digit'})}</span>
                </div>
                <span class="transaction-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</span>
                <div class="transaction-actions">
                    <button class="edit" data-id="${t.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${t.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            transactionListUl.appendChild(li);
            
li.querySelector('.edit').addEventListener('click', () => {
                const transaction = appState.transactions.find(trans => trans.id === t.id);
                if (transaction) openTransactionModal(transaction);
            });
            li.querySelector('.delete').addEventListener('click', () => handleDeleteTransaction(t.id));
        });
    }

    // --- START THE APP ---
    init();
});
