document.addEventListener("DOMContentLoaded", () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const username = localStorage.getItem("username") || localStorage.getItem("user");

    if (!isAuthenticated || !username) {
        window.location.href = "login.html";
        return;
    }

    // ✅ Update username in the dashboard
    document.getElementById("username").textContent = username;

    // ✅ Fetch balance & income from backend
    fetchBalanceAndIncome();

    // ✅ Load transactions & update balances
    loadTransactions();
});

// ✅ Fetch Balance & Income from Backend
function fetchBalanceAndIncome() {
    fetch("/api/user-finances", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        if (data.balance !== undefined && data.income !== undefined) {
            // Update the UI with balance and income
            document.getElementById("balanceDisplay").textContent = `₹${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById("incomeDisplay").textContent = `₹${parseFloat(data.income).toFixed(2)}`;
        } else {
            console.error("Balance & income data not found");
        }
    })
    .catch(error => console.error("Error fetching user finances:", error));
}
// ✅ Handle Balance & Income Update
document.getElementById("updateFinancesForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const newBalance = parseFloat(document.getElementById("balanceInput").value);
    const newIncome = parseFloat(document.getElementById("incomeInput").value);

    if (isNaN(newBalance) || isNaN(newIncome)) {
        alert("Please enter valid numbers.");
        return;
    }

    // ✅ Send update request to backend
    fetch("/api/update-finances", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance, income: newIncome })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        // ✅ Refresh balance & income
        fetchBalanceAndIncome();
    })
    .catch(error => console.error("Error updating finances:", error));
});

// ✅ Handle Expense Form Submission
document.getElementById("expenseForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("expenseName").value;
    const mode = document.getElementById("expenseMode").value;
    const date = document.getElementById("expenseDate").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    if (!name || !mode || !date || isNaN(amount)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    // ✅ Save transaction to backend
    fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mode, date, amount })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        // ✅ Reload transactions
        loadTransactions();

        // ✅ Refresh balance
        fetchBalanceAndIncome();

        // ✅ Clear form
        document.getElementById("expenseForm").reset();
    })
    .catch(error => console.error("Error adding transaction:", error));
});

// ✅ Load Transactions from Backend
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Failed to fetch transactions");

        const transactions = await response.json();
        if (!Array.isArray(transactions)) throw new Error("Invalid response format");

        // Clear existing transactions
        document.getElementById("transactionsList").innerHTML = "";

        // Add each transaction to the table
        transactions.forEach(transaction => addTransactionToTable(transaction));
    } catch (error) {
        console.error("Error loading transactions:", error.message);
    }
}

// ✅ Add a transaction to the table
function addTransactionToTable(transaction) {
    const tableBody = document.getElementById("transactionsList");
    if (!tableBody) {
        console.error("Transaction table not found!");
        return;
    }

    const row = document.createElement("tr");

    // Determine the amount display based on transaction type
    let amountDisplay;
    if (transaction.type === 'debit') {
        amountDisplay = `-₹${Math.abs(transaction.amount)}`; // Negative amount for debit
    } else {
        amountDisplay = `+₹${transaction.amount}`; // Positive amount for credit
    }

    // Determine the text color based on transaction type
    const amountColor = transaction.type === 'debit' ? 'text-red-500' : 'text-green-500';

    row.innerHTML = `
        <td class="px-4 py-2">${transaction.name}</td>
        <td class="px-4 py-2">${transaction.mode}</td>
        <td class="px-4 py-2">${transaction.date}</td>
        <td class="px-4 py-2 ${amountColor}">
            ${amountDisplay}
        </td>
    `;

    tableBody.appendChild(row);
}

// ✅ Handle Logout & Clear Data
document.getElementById("logoutBtn")?.addEventListener("click", function () {
    fetch("/api/logout", {
        method: "POST",
        credentials: "include"
    })
    .then(() => {
        localStorage.clear();
        window.location.href = "login.html";
    })
    .catch(error => console.error("Logout failed:", error));
});

document.getElementById("expenseForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("expenseName").value;
    const mode = document.getElementById("expenseMode").value;
    const date = document.getElementById("expenseDate").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const type = document.getElementById("expenseType").value;

    if (!name || !mode || !date || isNaN(amount)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    // Save transaction to backend
    fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mode, date, amount, type })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        // Reload transactions
        loadTransactions();

        // Refresh balance
        fetchBalanceAndIncome();

        // Clear form
        document.getElementById("expenseForm").reset();
    })
    .catch(error => console.error("Error adding transaction:", error));
});

// ✅ Fetch Savings Data
function fetchSavings() {
    fetch("/api/savings", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("savingsDisplay").textContent = `₹${parseFloat(data.savings).toFixed(2)}`;
    })
    .catch(error => console.error("Error fetching savings:", error));
}

// ✅ Add to Savings
function addToSavings() {
    const amount = parseFloat(document.getElementById("savingsAmount").value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    fetch("/api/savings/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchSavings();
        fetchBalanceAndIncome();
        fetchSavingsHistory();
    })
    .catch(error => console.error("Error adding to savings:", error));
}

// ✅ Remove from Savings
function removeFromSavings() {
    const amount = parseFloat(document.getElementById("savingsAmount").value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    fetch("/api/savings/remove", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchSavings();
        fetchBalanceAndIncome();
        fetchSavingsHistory();
    })
    .catch(error => console.error("Error removing from savings:", error));
}

// ✅ Fetch Savings History
function fetchSavingsHistory() {
    fetch("/api/savings/history", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const savingsHistory = document.getElementById("savingsHistory");
        savingsHistory.innerHTML = ""; // Clear existing history

        data.forEach(entry => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-4 py-2">${entry.type === 'add' ? 'Added' : 'Removed'}</td>
                <td class="px-4 py-2 ${entry.type === 'add' ? 'text-green-500' : 'text-red-500'}">
                    ${entry.type === 'add' ? '+' : '-'}₹${entry.amount}
                </td>
                <td class="px-4 py-2">${new Date(entry.date).toLocaleString()}</td>
            `;
            savingsHistory.appendChild(row);
        });
    })
    .catch(error => console.error("Error fetching savings history:", error));
}

// ✅ Initialize Savings Data on Page Load
document.addEventListener("DOMContentLoaded", () => {
    fetchSavings();
    fetchSavingsHistory();
});