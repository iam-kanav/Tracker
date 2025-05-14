document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupModal = document.getElementById('setupModal');
    const initialBalanceInput = document.getElementById('initialBalance');
    const fixedMinimumInput = document.getElementById('fixedMinimum');
    const dailyGoalInput = document.getElementById('dailyGoal');
    const saveSetupBtn = document.getElementById('saveSetup');

    const overviewSection = document.getElementById('overviewSection');
    const monthlyAllocationSection = document.getElementById('monthlyAllocationSection');
    const dailyTrackerSection = document.getElementById('dailyTrackerSection');
    const actionsSection = document.getElementById('actionsSection');
    const transactionsListSection = document.getElementById('transactionsListSection');
    const rulesGoalsSection = document.getElementById('rulesGoalsSection');


    const usableFundsEl = document.getElementById('usableFunds');
    const patreonEstEl = document.getElementById('patreonEst'); // For display, actual is logged
    const fixedMinimumDisplayEl = document.getElementById('fixedMinimumDisplay');


    const totalIncomeMonthEl = document.getElementById('totalIncomeMonth');
    const toMotherEl = document.getElementById('toMother');
    const netAvailableEl = document.getElementById('netAvailable');
    const targetSavingsEl = document.getElementById('targetSavings');
    const spendingBudgetEl = document.getElementById('spendingBudget');
    const actualSpentMonthEl = document.getElementById('actualSpentMonth');
    const budgetRemainingEl = document.getElementById('budgetRemaining');
    const actualSavedMonthEl = document.getElementById('actualSavedMonth');


    const dailySpendTotalEl = document.getElementById('dailySpendTotal');
    const dailySpendProgressEl = document.getElementById('dailySpendProgress');
    const dailySpendingGoalDisplayEl = document.getElementById('dailySpendingGoalDisplay');
    const ruleDailyGoalEl = document.getElementById('ruleDailyGoal');


    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const transactionModal = document.getElementById('transactionModal');
    const closeTransactionModalBtn = document.getElementById('closeTransactionModal');
    const saveTransactionBtn = document.getElementById('saveTransactionBtn');
    const transactionTypeInput = document.getElementById('transactionType');
    const transactionAmountInput = document.getElementById('transactionAmount');
    const transactionCategoryInput = document.getElementById('transactionCategory');
    const transactionDateInput = document.getElementById('transactionDate');
    const transactionDescriptionInput = document.getElementById('transactionDescription');

    const transactionsUl = document.getElementById('transactionsUl');
    const monthFilterEl = document.getElementById('monthFilter');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const currentMonthYearEl = document.getElementById('currentMonthYear');
    const todayDateEl = document.getElementById('todayDate');


    let settings = {
        initialBankBalance: 0,
        fixedMinimum: 0,
        dailySpendingGoal: 300,
        patreonEstimate: 10000 // Default, can be changed if needed
    };
    let transactions = [];
    let currentFilterMonthYear = '';

    // ---- INITIALIZATION & SETUP ----
    function init() {
        loadSettings();
        loadTransactions();

        if (!settings.initialBankBalance) { // Or some other check to see if setup is done
            setupModal.style.display = 'block';
            // Hide main content until setup is complete
            document.querySelectorAll('section:not(.actions), header').forEach(el => {
                if (el.id !== "setupModal" && !el.closest('.modal')) el.style.display = 'none';
            });
        } else {
            displayAppContent();
        }
        
        addEventListeners();
        updateUI();
    }

    function displayAppContent() {
        setupModal.style.display = 'none';
        overviewSection.style.display = 'block';
        monthlyAllocationSection.style.display = 'block';
        dailyTrackerSection.style.display = 'block';
        actionsSection.style.display = 'block';
        transactionsListSection.style.display = 'block';
        rulesGoalsSection.style.display = 'block';
        document.querySelector('header').style.display = 'block'; // Show header
    }

    saveSetupBtn.addEventListener('click', () => {
        const initialBalance = parseFloat(initialBalanceInput.value);
        const fixedMinimum = parseFloat(fixedMinimumInput.value);
        const dailyGoal = parseFloat(dailyGoalInput.value);

        if (isNaN(initialBalance) || isNaN(fixedMinimum) || isNaN(dailyGoal) || initialBalance <= 0 || fixedMinimum < 0 || dailyGoal <= 0) {
            alert('Please enter valid numbers for all fields.');
            return;
        }
        if (fixedMinimum > initialBalance) {
            alert('Fixed minimum cannot be greater than initial balance.');
            return;
        }

        settings.initialBankBalance = initialBalance;
        settings.fixedMinimum = fixedMinimum;
        settings.dailySpendingGoal = dailyGoal;
        
        saveSettings();
        displayAppContent();
        updateUI(); // Call updateUI after settings are saved and content is displayed
    });
    
    // ---- DATA PERSISTENCE (LOCAL STORAGE) ----
    function saveSettings() {
        localStorage.setItem('financeTrackerSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const storedSettings = localStorage.getItem('financeTrackerSettings');
        if (storedSettings) {
            settings = JSON.parse(storedSettings);
        }
    }

    function saveTransactions() {
        localStorage.setItem('financeTrackerTransactions', JSON.stringify(transactions));
    }

    function loadTransactions() {
        const storedTransactions = localStorage.getItem('financeTrackerTransactions');
        if (storedTransactions) {
            transactions = JSON.parse(storedTransactions).map(t => ({
                ...t,
                date: new Date(t.date) // Ensure date is a Date object
            }));
        }
    }

    // ---- EVENT LISTENERS ----
    function addEventListeners() {
        addTransactionBtn.addEventListener('click', openTransactionModal);
        closeTransactionModalBtn.addEventListener('click', closeTransactionModal);
        saveTransactionBtn.addEventListener('click', handleSaveTransaction);
        window.addEventListener('click', (event) => {
            if (event.target == transactionModal) {
                closeTransactionModal();
            }
        });
        monthFilterEl.addEventListener('change', (e) => {
            currentFilterMonthYear = e.target.value;
            renderTransactions();
            updateMonthlyAllocations(); // Re-calculate for the selected month
        });
        resetDataBtn.addEventListener('click', handleResetData);
    }

    function handleResetData() {
        if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
            localStorage.removeItem('financeTrackerSettings');
            localStorage.removeItem('financeTrackerTransactions');
            // Reset in-memory state
            settings = { initialBankBalance: 0, fixedMinimum: 0, dailySpendingGoal: 300, patreonEstimate: 10000 };
            transactions = [];
            currentFilterMonthYear = '';
            // Hide main content and show setup modal
             document.querySelectorAll('section:not(.actions), header').forEach(el => {
                if (el.id !== "setupModal" && !el.closest('.modal')) el.style.display = 'none';
            });
            overviewSection.style.display = 'none';
            monthlyAllocationSection.style.display = 'none';
            dailyTrackerSection.style.display = 'none';
            actionsSection.style.display = 'none';
            transactionsListSection.style.display = 'none';
            rulesGoalsSection.style.display = 'none';
            setupModal.style.display = 'block';
            initialBalanceInput.value = '';
            fixedMinimumInput.value = '';
            dailyGoalInput.value = '';

            updateUI(); // Clear the UI
        }
    }

    // ---- MODAL MANAGEMENT ----
    function openTransactionModal() {
        transactionModal.style.display = 'block';
        transactionDateInput.valueAsDate = new Date(); // Default to today
        transactionAmountInput.value = '';
        transactionDescriptionInput.value = '';
        transactionTypeInput.value = 'expense'; // Default to expense
    }

    function closeTransactionModal() {
        transactionModal.style.display = 'none';
    }

    // ---- TRANSACTION HANDLING ----
    function handleSaveTransaction() {
        const type = transactionTypeInput.value;
        const amount = parseFloat(transactionAmountInput.value);
        const category = transactionCategoryInput.value;
        const date = new Date(transactionDateInput.value);
        const description = transactionDescriptionInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (!transactionDateInput.value) {
            alert('Please select a date.');
            return;
        }
        // Adjust date to avoid timezone issues by setting time to noon
        date.setHours(12,0,0,0);


        const newTransaction = {
            id: Date.now().toString(), // Simple unique ID
            type,
            amount,
            category,
            date,
            description
        };

        transactions.push(newTransaction);
        transactions.sort((a, b) => b.date - a.date); // Sort by date descending
        saveTransactions();
        updateUI();
        closeTransactionModal();
    }
    
    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            updateUI();
        }
    }


    // ---- UI UPDATES & CALCULATIONS ----
    function updateUI() {
        if (!settings.initialBankBalance) return; // Don't update if setup not done

        const today = new Date();
        today.setHours(0,0,0,0); // Normalize today for comparisons

        // Populate month filter
        populateMonthFilter();
        if (!currentFilterMonthYear && transactions.length > 0) {
            const latestTransactionDate = transactions[0].date; // Assuming sorted
             currentFilterMonthYear = `${latestTransactionDate.getFullYear()}-${String(latestTransactionDate.getMonth() + 1).padStart(2, '0')}`;
             monthFilterEl.value = currentFilterMonthYear;
        } else if (!currentFilterMonthYear) {
            currentFilterMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            monthFilterEl.value = currentFilterMonthYear;
        }


        // Header Date
        const currentDisplayMonth = new Date(currentFilterMonthYear + "-01T12:00:00"); // Use noon to avoid TZ issues
        currentMonthYearEl.textContent = currentDisplayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        todayDateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });


        // Overview
        patreonEstEl.textContent = `₹${settings.patreonEstimate.toLocaleString()}`;
        fixedMinimumDisplayEl.textContent = `₹${settings.fixedMinimum.toLocaleString()}`;
        
        // Calculate total income and expenses up to now
        let totalIncomeAllTime = 0;
        let totalExpensesAllTime = 0;
        transactions.forEach(t => {
            if (t.type === 'income') totalIncomeAllTime += t.amount;
            else totalExpensesAllTime += t.amount;
        });
        const currentUsable = settings.initialBankBalance - settings.fixedMinimum + totalIncomeAllTime - totalExpensesAllTime;
        usableFundsEl.textContent = `₹${currentUsable.toLocaleString()}`;


        // Monthly Allocations (for the *filtered* month)
        updateMonthlyAllocations();
        
        // Daily Spending
        const dailyGoal = settings.dailySpendingGoal;
        let dailySpend = 0;
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0,0,0,0); // Normalize transaction date
            if (t.type === 'expense' && tDate.getTime() === today.getTime()) {
                dailySpend += t.amount;
            }
        });
        dailySpendTotalEl.textContent = `₹${dailySpend.toLocaleString()}`;
        dailySpendingGoalDisplayEl.textContent = `₹${dailyGoal.toLocaleString()}`;
        ruleDailyGoalEl.textContent = `₹${dailyGoal.toLocaleString()}`;


        const progressPercent = Math.min((dailySpend / dailyGoal) * 100, 100);
        dailySpendProgressEl.style.width = `${progressPercent}%`;
        dailySpendProgressEl.textContent = `₹${dailySpend}`;
        if (dailySpend > dailyGoal) {
            dailySpendProgressEl.classList.add('over-limit');
        } else {
            dailySpendProgressEl.classList.remove('over-limit');
        }

        renderTransactions();
    }

    function updateMonthlyAllocations() {
        const [year, month] = currentFilterMonthYear.split('-').map(Number);

        let incomeThisMonth = 0;
        let expensesThisMonth = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getFullYear() === year && (tDate.getMonth() + 1) === month) {
                if (t.type === 'income') {
                    incomeThisMonth += t.amount;
                } else {
                    expensesThisMonth += t.amount;
                }
            }
        });
        
        totalIncomeMonthEl.textContent = `₹${incomeThisMonth.toLocaleString()}`;

        const motherShare = incomeThisMonth * 0.30;
        toMotherEl.textContent = `₹${motherShare.toLocaleString()}`;

        const net = incomeThisMonth - motherShare;
        netAvailableEl.textContent = `₹${net.toLocaleString()}`;

        const savingsTarget = net * 0.40;
        targetSavingsEl.textContent = `₹${savingsTarget.toLocaleString()}`;
        
        const spendingBudgetCalc = net * 0.60;
        spendingBudgetEl.textContent = `₹${spendingBudgetCalc.toLocaleString()}`;
        
        actualSpentMonthEl.textContent = `₹${expensesThisMonth.toLocaleString()}`;

        const budgetRem = spendingBudgetCalc - expensesThisMonth;
        budgetRemainingEl.textContent = `₹${budgetRem.toLocaleString()}`;
        budgetRemainingEl.style.color = budgetRem < 0 ? 'var(--danger-color)' : 'var(--primary-text-color)';

        const actualSaved = incomeThisMonth - expensesThisMonth; // Simple version: what's left of income
        actualSavedMonthEl.textContent = `₹${actualSaved.toLocaleString()}`;
    }


    function populateMonthFilter() {
        const SmonthYears = new Set();
        // Add current month/year by default if no transactions
        const today = new Date();
        SmonthYears.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

        transactions.forEach(t => {
            const date = new Date(t.date);
            SmonthYears.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        
        const sortedMonthYears = Array.from(SmonthYears).sort().reverse(); // Most recent first
        
        monthFilterEl.innerHTML = ''; // Clear existing options
        sortedMonthYears.forEach(my => {
            const option = document.createElement('option');
            option.value = my;
            const [year, monthNum] = my.split('-');
            const dateForDisplay = new Date(year, monthNum - 1, 1);
            option.textContent = dateForDisplay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthFilterEl.appendChild(option);
        });

        if (currentFilterMonthYear && SmonthYears.has(currentFilterMonthYear)) {
            monthFilterEl.value = currentFilterMonthYear;
        } else if (sortedMonthYears.length > 0) {
            monthFilterEl.value = sortedMonthYears[0];
            currentFilterMonthYear = sortedMonthYears[0];
        }
    }

    function renderTransactions() {
        transactionsUl.innerHTML = ''; // Clear existing list
        
        const [filterYear, filterMonth] = currentFilterMonthYear ? currentFilterMonthYear.split('-').map(Number) : [null, null];

        const filteredTransactions = transactions.filter(t => {
            if (!filterYear || !filterMonth) return true; // Show all if no filter
            const tDate = new Date(t.date);
            return tDate.getFullYear() === filterYear && (tDate.getMonth() + 1) === filterMonth;
        });


        if (filteredTransactions.length === 0) {
            transactionsUl.innerHTML = '<li>No transactions for this period.</li>';
            return;
        }

        filteredTransactions.forEach(t => {
            const li = document.createElement('li');
            
            const datePart = new Date(t.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short'}); // DD MMM

            li.innerHTML = `
                <div class="details">
                    <span class="description">${t.description || t.category}</span>
                    <span class="category">${t.category} - ${datePart}</span>
                </div>
                <span class="amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString()}
                </span>
                <button class="delete-btn" data-id="${t.id}"><i class="fas fa-trash-alt"></i></button>
            `;
            transactionsUl.appendChild(li);

            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                 // Traverse up to ensure correct button if icon is clicked
                let targetButton = e.target;
                while (targetButton && !targetButton.dataset.id) {
                    targetButton = targetButton.parentElement;
                }
                if (targetButton) {
                    deleteTransaction(targetButton.dataset.id);
                }
            });
        });
    }

    // ---- START THE APP ----
    init();
});
