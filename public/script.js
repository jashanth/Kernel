// Fetch Transactions & Update UI
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', {
            credentials: 'include' // Add credentials to ensure session cookie is sent
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        
        const transactions = await response.json();

        let totalIncome = 0, totalExpenses = 0;
        const tbody = document.getElementById("transactionsTable");
        
        if (!tbody) {
            console.error("Transaction table element not found!");
            return;
        }
        
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
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

// Generate Pie Chart
function generateChart(income, expenses) {
    const ctx = document.getElementById('spendingChart');
    
    if (!ctx) {
        console.error("Chart canvas element not found!");
        return;
    }
    
    const context = ctx.getContext('2d');
    
    if (window.myChart) {
        window.myChart.destroy(); // Destroy previous chart before creating a new one
    }

    window.myChart = new Chart(context, {
        type: 'pie',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false // Allow custom height
        }
    });
}

// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
    // Check authentication first
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
        window.location.href = "login.html";
        return;
    }
    
    // If authenticated, load transactions
    loadTransactions();
});

// Remove the window.onload as it would conflict with DOMContentLoaded
// window.onload = loadTransactions;