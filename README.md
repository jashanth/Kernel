# 💰MoneyGuard

**💰MoneyGuard** is a web-based financial management tool designed to help users track their income, expenses, savings, and transactions. It provides a user-friendly interface with visual insights into financial data, making it easy to manage personal finances.

---

## 🔥Features

### 1. **User Authentication**
- **Login:** Secure login using username and password.
- **Signup:** New users can register with a username, password, initial balance, and income.
- **Logout:** Users can log out, destroying their session and clearing authentication data.

### 2. **Dashboard**
- **Total Balance:** Displays the user's current balance.
- **Total Income:** Shows the user's total income.
- **Total Expenses:** Tracks the user's total expenses.
- **Total Savings:** Displays the user's total savings.

### 3. **Expense Tracking**
- **Add Expense:** Users can add expenses with details like name, payment mode, date, amount, category, and type (debit/credit).
- **Expense Categories:** Expenses are categorized into groups (e.g., Travelling, Food, Essentials, Investment).
- **Pie Chart:** Visualizes the distribution of expenses by category.

### 4. **Savings Management**
- **Add to Savings:** Users can add a specific amount to their savings.
- **Remove from Savings:** Users can remove a specific amount from their savings.
- **Savings History:** Displays a history of all savings transactions.
- **Line Chart:** Visualizes savings over time.

### 5. **Transactions**
- **Transaction List:** Displays all transactions (expenses and income) in a table.
- **Transaction Details:** Includes name, payment mode, date, amount, category, and type.

### 6. **My Cards**
- **Add Card:** Users can add payment cards with details like card name, number, expiry date, CVV, and type.
- **View Cards:** Displays all saved cards with partially masked card numbers for security.

### 7. **AI Financial Assistant**
- **Ask AI:** Users can interact with an AI assistant to get financial advice, budgeting tips, savings recommendations, and explanations of financial terms.
- **Predefined Responses:** The AI provides instant answers to common financial questions, such as:
  - Budgeting advice
  - Savings recommendations
  - Investment tips
  - Explanations of financial terms (e.g., APR, compound interest, credit score)
  - Time and date queries
- **Personalized Greetings:** The AI greets users with personalized messages based on the time of day.

### 8. **Visual Insights**
- **Expense Pie Chart:** Shows the distribution of expenses by category.
- **Savings Line Chart:** Displays savings trends over time.

---

## ✅API Endpoints

### 1) Authentication
- **POST `/api/login`:** User login.
- **POST `/api/signup`:** User registration.
- **POST `/api/logout`:** User logout.
- **GET `/api/auth-check`:** Checks if the user is authenticated.

### 2) Financial Data
- **GET `/api/user-finances`:** Fetches the user's balance, income, and savings.
- **POST `/api/update-finances`:** Updates the user's balance and income.

### 3) Transactions
- **POST `/api/transactions`:** Adds a new transaction (expense or income).
- **GET `/api/transactions`:** Fetches all transactions for the user.
- **GET `/api/expenses-by-category`:** Fetches expenses grouped by category.

### 4) Savings
- **POST `/api/savings/add`:** Adds to savings.
- **POST `/api/savings/remove`:** Removes from savings.
- **GET `/api/savings`:** Fetches the current savings amount.
- **GET `/api/savings-history`:** Fetches the savings history.
- **GET `/api/savings-history-range`:** Fetches savings history between two dates.

### 5) Cards
- **POST `/api/cards/add`:** Adds a new payment card.
- **GET `/api/cards`:** Fetches all cards for the user.

---

## 🧑‍💻Technologies Used

### Frontend
- **HTML, CSS, JavaScript:** For building the user interface.
- **Tailwind CSS:** For styling and responsive design.
- **Chart.js:** For rendering pie charts and line charts.

### Backend
- **Node.js:** For server-side logic.
- **Express.js:** For handling API requests.
- **MySQL:** For storing user data, transactions, and financial information.
- **Bcrypt:** For password hashing.
- **Express-session:** For session management.

---

