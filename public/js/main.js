document.addEventListener("DOMContentLoaded", () => {
    // Single authentication check that checks both values
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const username = localStorage.getItem("username") || localStorage.getItem("user");
    
    if (!isAuthenticated || !username) {
        window.location.href = "login.html";
        return; // Stop further execution
    }
    
    // Only run these if authenticated
    loadTransactions();
    updateBalances();
});

// Handle Expense Form Submission
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

    // Create transaction object
    const transaction = { name, mode, date, amount };

    // Save to localStorage
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Update UI
    addTransactionToTable(transaction);
    updateBalances();

    // Clear form
    document.getElementById("expenseForm").reset();
});

// Load transactions from localStorage on page load
// Load Transactions from DB
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', {
            credentials: 'include' // ✅ Ensures session is sent
        });

        if (!response.ok) {
            throw new Error("Failed to fetch transactions");
        }

        const transactions = await response.json();

        if (!Array.isArray(transactions)) {
            throw new Error("Invalid response format");
        }

        // ✅ Only map if transactions is an array
        transactions.forEach(transaction => {
            console.log("Transaction:", transaction);
            addTransactionToTable(transaction); // Added this to actually display transactions
        });
    } catch (error) {
        console.error("Error loading transactions:", error.message);
    }
}

// Add a transaction to the table
function addTransactionToTable(transaction) {
    const tableBody = document.getElementById("transactionsList");
    
    if (!tableBody) {
        console.error("Transaction table not found!");
        return;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
        <td class="px-4 py-2">${transaction.name}</td>
        <td class="px-4 py-2">${transaction.mode}</td>
        <td class="px-4 py-2">${transaction.date}</td>
        <td class="px-4 py-2 ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}">
            ${transaction.amount < 0 ? `-₹${Math.abs(transaction.amount)}` : `+₹${transaction.amount}`}
        </td>
    `;

    tableBody.appendChild(row);
}

// Update Balances
function updateBalances() {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    let totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    let totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    let totalBalance = totalIncome - totalExpenses;

    document.getElementById("totalBalance").innerText = `₹${totalBalance.toFixed(2)}`;
    document.getElementById("totalIncome").innerText = `₹${totalIncome.toFixed(2)}`;
    document.getElementById("totalExpenses").innerText = `₹${totalExpenses.toFixed(2)}`;
}

// Ensure transactions persist after logout (Optional)
document.getElementById("logoutBtn")?.addEventListener("click", function () {
    localStorage.removeItem("transactions"); // Clear transactions on logout (Optional)
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});