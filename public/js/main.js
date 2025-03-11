document.addEventListener("DOMContentLoaded", () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const username = localStorage.getItem("username") || localStorage.getItem("user");

    if (!isAuthenticated || !username) {
        window.location.href = "login.html";
        return;
    }

    // ✅ Update username in the dashboard
    document.getElementById("username").textContent = username;

    // ✅ Load data based on the current page
    if (window.location.pathname.includes("index.html")) {
        fetchBalanceAndIncome();
        fetchTotalExpenses();
        fetchSavings();
        renderExpensePieChart(); // Render the pie chart
    } else if (window.location.pathname.includes("transactions.html")) {
        loadTransactions();
        fetchSavingsHistory();
    }
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
    const category = document.getElementById("expenseCategory").value;
    const type = document.getElementById("expenseType").value;

    if (!name || !mode || !date || isNaN(amount) || !category || !type) {
        alert("Please fill in all fields correctly.");
        return;
    }

    fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mode, date, amount, category, type })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to add transaction");
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);

        // Fetch updated balance and savings
        fetchBalanceAndIncome();
        fetchSavings();

        // Reload transactions and refresh UI
        loadTransactions();
        fetchTotalExpenses();
        renderExpensePieChart();

        // Clear form
        document.getElementById("expenseForm").reset();
    })
    .catch(error => {
        console.error("Error adding transaction:", error);
        alert("Failed to add transaction. Please try again.");
    });
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

        const tableBody = document.getElementById("transactionsList");
        if (tableBody) {
            tableBody.innerHTML = ""; // Clear existing transactions
            transactions.forEach(transaction => addTransactionToTable(transaction));
        }
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

// ✅ Fetch Total Expenses
function fetchTotalExpenses() {
    fetch("/api/total-expenses", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("totalExpenses").textContent = `₹${parseFloat(data.totalExpenses).toFixed(2)}`;
    })
    .catch(error => console.error("Error fetching total expenses:", error));
}

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

// Function to fetch savings history
function fetchSavingsHistory() {
    fetch("/api/savings-history", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const savingsHistory = document.getElementById("savingsHistory");
        if (savingsHistory) {
            savingsHistory.innerHTML = ""; // Clear existing history
            data.forEach(entry => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="px-4 py-2">${entry.type === 'add' ? 'Added' : 'Removed'}</td>
                    <td class="px-4 py-2 ${entry.type === 'add' ? 'text-green-500' : 'text-red-500'}">
                        ${entry.type === 'add' ? '+' : '-'}₹${entry.amount}
                    </td>
                    <td class="px-4 py-2">${new Date(entry.date).toLocaleDateString()}</td>
                `;
                savingsHistory.appendChild(row);
            });
        }
    })
    .catch(error => console.error("Error fetching savings history:", error));
}

// Function to add to savings
function addToSavings() {
    const amount = parseFloat(document.getElementById("savingsAmount").value);
    const date = document.getElementById("savingsDate").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!date) {
        alert("Please enter a date.");
        return;
    }

    fetch("/api/savings/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        fetchBalanceAndIncome(); // Refresh balance and income
        fetchSavings(); // Refresh savings display
        fetchSavingsHistory(); // Refresh savings history
    })
    .catch(error => {
        console.error("Error adding to savings:", error);
        alert("Failed to add to savings. Please try again.");
    });
}
// Function to remove from savings
function removeFromSavings() {
    const amount = parseFloat(document.getElementById("savingsAmount").value);
    const date = document.getElementById("savingsDate").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!date) {
        alert("Please enter a date.");
        return;
    }

    fetch("/api/savings/remove", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchSavings(); // Refresh savings display
        fetchSavingsHistory(); // Refresh savings history
    })
    .catch(error => console.error("Error removing from savings:", error));
}

// Function to fetch savings history


// Function to render the savings line chart
function renderSavingsLineChart(data) {
    const canvas = document.getElementById("savingsLineChart");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    const ctx = canvas.getContext("2d");

    // Destroy previous chart if it exists
    if (window.savingsLineChart instanceof Chart) {
        window.savingsLineChart.destroy();
    }

    // Create the line chart
    window.savingsLineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Savings",
                data: data.values,
                borderColor: "#36A2EB",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Savings: ₹${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to fetch savings history between two dates
function fetchSavingsHistoryRange(startDate, endDate) {
    fetch(`/api/savings-history-range?startDate=${startDate}&endDate=${endDate}`, {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const labels = data.map(entry => new Date(entry.date).toLocaleDateString());
        const values = data.map(entry => entry.amount);
        renderSavingsLineChart({ labels, values });
    })
    .catch(error => console.error("Error fetching savings history:", error));
}

// Handle form submission for savings graph
document.getElementById("savingsGraphForm")?.addEventListener("submit", function (event) {
    event.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    fetchSavingsHistoryRange(startDate, endDate);
});

document.getElementById("savingsGraphForm")?.addEventListener("submit", function (event) {
    event.preventDefault();
    const date = document.getElementById("savingsGraphDate").value;
    const month = document.getElementById("savingsGraphMonth").value;
    const year = document.getElementById("savingsGraphYear").value;
    fetchSavingsHistory(date, month, year);
});

// Initial fetch to load the graph with default data
fetchSavingsHistory();

// ✅ Fetch Categorized Expenses and Render Pie Chart
// ✅ Fetch Categorized Expenses and Render Pie Chart
// ✅ Fetch Categorized Expenses and Render Pie Chart
function renderExpensePieChart() {
    console.log("Rendering expense categories pie chart...");
    
    fetch("/api/expenses-by-category", {
        method: "GET",
        credentials: "include"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Categorized expenses data:", data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log("No expense data available");
            return;
        }

        const categories = data.map(item => item.category);
        const totals = data.map(item => parseFloat(item.total));
        
        console.log("Categories:", categories);
        console.log("Totals:", totals);

        const canvas = document.getElementById('expensePieChart');
        
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        const chartContainer = canvas.parentElement;
        if (chartContainer) {
            chartContainer.style.height = '300px';
        }
        
        const ctx = canvas.getContext('2d');
        
        // Check if window.expensePieChart is a Chart instance before destroying
        if (window.expensePieChart instanceof Chart) {
            window.expensePieChart.destroy();
        }

        window.expensePieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: totals,
                    backgroundColor: [
                        '#FF6384', // Travelling
                        '#36A2EB', // Food
                        '#FFCE56', // Essentials
                        '#4BC0C0'  // Investment
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#FFF' // White text for legend
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ₹${value}`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log("Expense categories chart created successfully");
    })
    .catch(error => {
        console.error("Error fetching categorized expenses:", error);
    });
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

// Function to render the savings line chart

// Function to fetch savings data
function fetchSavingsData(date, month, year) {
    fetch(`/api/savings-history?date=${date}&month=${month}&year=${year}`, {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const labels = data.map(entry => new Date(entry.date).toLocaleDateString());
        const values = data.map(entry => entry.amount);
        renderSavingsLineChart({ labels, values });
    })
    .catch(error => console.error("Error fetching savings data:", error));
}

// Handle form submission for savings graph
document.getElementById("savingsGraphForm")?.addEventListener("submit", function (event) {
    event.preventDefault();
    const date = document.getElementById("savingsDate").value;
    const month = document.getElementById("savingsMonth").value;
    const year = document.getElementById("savingsYear").value;
    fetchSavingsData(date, month, year);
});

// Initial fetch to load the graph with default data
fetchSavingsData(null, null, null);

// Handle Add Card Form Submission
document.addEventListener("DOMContentLoaded", () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const username = localStorage.getItem("username") || localStorage.getItem("user");

    if (!isAuthenticated || !username) {
        window.location.href = "login.html";
        return;
    }

    // Update username in the dashboard
    document.getElementById("username").textContent = username;

    // Load data based on the current page
    if (window.location.pathname.includes("index.html")) {
        fetchBalanceAndIncome();
        fetchTotalExpenses();
        fetchSavings();
        renderExpensePieChart();
    } else if (window.location.pathname.includes("transactions.html")) {
        loadTransactions();
        fetchSavingsHistory();
    }

    // Initialize My Cards functionality
    initializeMyCards();
});

// ==================== MY CARDS FUNCTIONALITY ====================
// Function to add a card to the UI and database
// Function to add a card to the UI and database
function addCardToUI(cardName, cardNumber, cardExpiry, cardCVV, cardType) {
    fetch("/api/cards/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardName, cardNumber, cardExpiry, cardCVV, cardType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Card added successfully") {
            // Add the card to the UI
            const cardsList = document.getElementById("cardsList");

            const cardElement = document.createElement("div");
            cardElement.className = "bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white";
            cardElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold">${cardType}</span>
                    <span class="text-sm">**** **** **** ${cardNumber.slice(-4)}</span>
                </div>
                <div class="mt-4">
                    <p class="text-sm">Cardholder Name</p>
                    <p class="text-lg font-semibold">${cardName}</p>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <div>
                        <p class="text-sm">Expiry Date</p>
                        <p class="text-lg font-semibold">${cardExpiry}</p>
                    </div>
                    <div>
                        <p class="text-sm">CVV</p>
                        <p class="text-lg font-semibold">***</p>
                    </div>
                </div>
            `;

            cardsList.appendChild(cardElement);
        } else {
            alert("Failed to add card. Please try again.");
        }
    })
    .catch(error => {
        console.error("Error adding card:", error);
        alert("Failed to add card. Please try again.");
    });
}

// Function to fetch and display cards from the database
function fetchCards() {
    fetch("/api/cards", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const cardsList = document.getElementById("cardsList");
        if (cardsList) {
            cardsList.innerHTML = ""; // Clear existing cards
            data.forEach(card => {
                const cardElement = document.createElement("div");
                cardElement.className = "bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white";
                cardElement.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-semibold">${card.card_type}</span>
                        <span class="text-sm">**** **** **** ${card.card_number.slice(-4)}</span>
                    </div>
                    <div class="mt-4">
                        <p class="text-sm">Cardholder Name</p>
                        <p class="text-lg font-semibold">${card.card_name}</p>
                    </div>
                    <div class="mt-4 flex justify-between items-center">
                        <div>
                            <p class="text-sm">Expiry Date</p>
                            <p class="text-lg font-semibold">${card.card_expiry}</p>
                        </div>
                        <div>
                            <p class="text-sm">CVV</p>
                            <p class="text-lg font-semibold">***</p>
                        </div>
                    </div>
                `;
                cardsList.appendChild(cardElement);
            });
        }
    })
    .catch(error => console.error("Error fetching cards:", error));
}

// Initialize My Cards functionality
function initializeMyCards() {
    // Handle Add Card Form Submission
    document.getElementById("addCardForm")?.addEventListener("submit", function (event) {
        event.preventDefault();

        const cardName = document.getElementById("cardName").value;
        const cardNumber = document.getElementById("cardNumber").value;
        const cardExpiry = document.getElementById("cardExpiry").value;
        const cardCVV = document.getElementById("cardCVV").value;
        const cardType = document.getElementById("cardType").value;

       

        // Add the card to the UI and database
        addCardToUI(cardName, cardNumber, cardExpiry, cardCVV, cardType);

        // Clear the form
        document.getElementById("addCardForm").reset();
    });

    // Fetch and display cards when the page loads
    fetchCards();
}

// Call initializeMyCards when the page loads
document.addEventListener("DOMContentLoaded", initializeMyCards);