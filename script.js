// Fetch Transactions & Update UI
async function loadTransactions() {
    const response = await fetch('/api/transactions');
    const transactions = await response.json();

    let totalIncome = 0, totalExpenses = 0;
    const tbody = document.getElementById("transactionsTable");
    tbody.innerHTML = "";

    transactions.forEach(txn => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${txn.name}</td>
            <td>${txn.mode}</td>
            <td>${txn.date}</td>
            <td class="${txn.amount < 0 ? 'expense' : 'income'}">${txn.amount < 0 ? '-' : '+'}₹${Math.abs(txn.amount)}</td>
        `;
        tbody.appendChild(row);

        if (txn.amount > 0) totalIncome += txn.amount;
        else totalExpenses += Math.abs(txn.amount);
    });

    document.getElementById("totalIncome").textContent = `₹${totalIncome}`;
    document.getElementById("totalExpenses").textContent = `₹${totalExpenses}`;
    document.getElementById("totalBalance").textContent = `₹${totalIncome - totalExpenses}`;

    generateChart(totalIncome, totalExpenses);
}

// Generate Pie Chart
function generateChart(income, expenses) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        }
    });
}

// Load transactions on page load
window.onload = loadTransactions;
