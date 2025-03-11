const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// Serve Static Files from 'public' Folder
app.use(express.static(path.join(__dirname, '../public')));

// Allow CORS & Include Credentials for Sessions
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}));

app.use(express.json());

// Configure Session Storage
app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to `true` if using HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 24-hour session expiration
    }
}));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nishanth@123', // Use your MySQL password
    database: 'pocket_money'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});

// Redirect Root Route to Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// User Signup
app.post('/api/signup', async (req, res) => {
    const { username, password, balance = 0, income = 0 } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hashedPassword],
            (err, result) => {
                if (err) {
                    return res.status(400).json({ message: "Username already taken" });
                }

                const userId = result.insertId;

                // Add financial data to user_finances table
                db.query(
<<<<<<< HEAD
                    "INSERT INTO user_finances (user_id, balance, income) VALUES (?, ?, ?)",
=======
                    "INSERT INTO user_finances (user_id, balance, income, savings) VALUES (?, ?, ?, 0)",
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
                    [userId, balance, income],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ message: "Failed to initialize finances" });
                        }

                        // Set session
                        req.session.user = { id: userId, username };
                        req.session.save(err => {
                            if (err) {
                                return res.status(500).json({ message: "Session save failed" });
                            }
                            res.json({ 
                                message: "Signup successful!", 
                                user: { id: userId, username }, 
                                balance, 
                                income 
                            });
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ message: "Signup failed!", error: err });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Fetch financial data
        db.query('SELECT * FROM user_finances WHERE user_id = ?', [user.id], (err, financeResults) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            // Set session
            req.session.user = { id: user.id, username: user.username };
            req.session.save(err => {
                if (err) {
                    return res.status(500).json({ message: "Session save failed" });
                }

<<<<<<< HEAD
                const finances = financeResults.length > 0 ? financeResults[0] : { balance: 0, income: 0 };
                res.json({ 
                    success: true, 
                    balance: finances.balance, 
                    income: finances.income 
=======
                const finances = financeResults.length > 0 ? financeResults[0] : { balance: 0, income: 0, savings: 0 };
                res.json({ 
                    success: true, 
                    balance: finances.balance, 
                    income: finances.income,
                    savings: finances.savings
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
                });
            });
        });
    });
});

// Get User Balance & Income
app.get('/api/user-finances', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

<<<<<<< HEAD
    db.query('SELECT balance, income FROM user_finances WHERE user_id = ?', [req.session.user.id], (err, results) => {
=======
    db.query('SELECT balance, income, savings FROM user_finances WHERE user_id = ?', [req.session.user.id], (err, results) => {
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

<<<<<<< HEAD
        const finances = results.length > 0 ? results[0] : { balance: 0, income: 0 };
=======
        const finances = results.length > 0 ? results[0] : { balance: 0, income: 0, savings: 0 };
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
        res.json(finances);
    });
});

// Update Balance & Income
app.post('/api/update-finances', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { balance = 0, income = 0 } = req.body;
    const userId = req.session.user.id;

    // Add to existing balance and income
    db.query(
        'UPDATE user_finances SET balance = balance + ?, income = income + ? WHERE user_id = ?',
        [balance, income, userId],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Failed to update finances" });
            }
            res.json({ message: "Finances updated successfully" });
        }
    );
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

// Get Transactions
app.get('/api/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch transactions" });
            }
            res.json(results);
        }
    );
});

// Add Transaction
app.post('/api/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

<<<<<<< HEAD
    const { name, mode, date, amount, type } = req.body;

    if (!name || !mode || !date || isNaN(amount) || !type) {
=======
    const { name, mode, date, amount, category, type } = req.body;

    if (!name || !mode || !date || isNaN(amount) || !category || !type) {
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
        return res.status(400).json({ message: "Invalid transaction data" });
    }

    const userId = req.session.user.id;

<<<<<<< HEAD
    // Insert the transaction
    db.query(
        "INSERT INTO transactions (user_id, name, mode, date, amount, type) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, name, mode, date, amount, type],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add transaction" });
            }

            // Update user balance based on transaction type
            const balanceUpdate = type === 'credit' ? amount : -amount;
            db.query(
                'UPDATE user_finances SET balance = balance + ? WHERE user_id = ?',
                [balanceUpdate, userId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ message: "Failed to update balance" });
                    }

                    res.json({ 
                        id: result.insertId, 
                        message: "Transaction added successfully" 
                    });
                }
            );
=======
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Transaction failed" });
        }

        // Insert the transaction
        db.query(
            "INSERT INTO transactions (user_id, name, mode, date, amount, category, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [userId, name, mode, date, amount, category, type],
            (err, result) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Failed to add transaction" }));
                }

                // If the transaction is a debit (expense), update the balance
                if (type === 'debit') {
                    db.query(
                        'UPDATE user_finances SET balance = balance - ? WHERE user_id = ?',
                        [amount, userId],
                        (err) => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ message: "Failed to update balance" }));
                            }

                            // Commit the transaction
                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                                }
                                res.json({ id: result.insertId, message: "Transaction added successfully" });
                            });
                        }
                    );
                } else {
                    // Commit the transaction if it's not a debit
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                        }
                        res.json({ id: result.insertId, message: "Transaction added successfully" });
                    });
                }
            }
        );
    });
});
app.post('/api/savings/add', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { amount, date } = req.body;
    if (isNaN(amount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const userId = req.session.user.id;
    const transactionDate = new Date(date);

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Transaction failed" });
        }

        // Add to savings history
        db.query(
            'INSERT INTO savings_history (user_id, type, amount, date) VALUES (?, "add", ?, ?)',
            [userId, amount, transactionDate],
            (err, result) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Failed to record transaction" }));
                }

                // Update user_finances table (reduce balance and increase savings)
                db.query(
                    'UPDATE user_finances SET savings = savings + ?, balance = balance - ? WHERE user_id = ?',
                    [amount, amount, userId],
                    (err, result) => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ message: "Failed to update savings and balance" }));
                        }

                        // Commit the transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                            }
                            res.json({ message: "Added to savings successfully" });
                        });
                    }
                );
            }
        );
    });
});
// Fetch Savings Data
app.get('/api/savings', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
        'SELECT savings FROM user_finances WHERE user_id = ?',
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch savings" });
            }
            res.json({ savings: results[0]?.savings || 0 });
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
        }
    );
});

<<<<<<< HEAD
// ✅ Fetch Savings Data
app.get('/api/savings', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
        'SELECT savings FROM user_finances WHERE user_id = ?',
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch savings" });
            }
            res.json({ savings: results[0]?.savings || 0 });
        }
    );
});

// ✅ Add to Savings (Transfer from Balance to Savings)
app.post('/api/savings/add', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { amount } = req.body;
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const userId = req.session.user.id;

    // Start a transaction
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Transaction failed" });
        }

        // Check if the user has enough balance
        db.query(
            'SELECT balance FROM user_finances WHERE user_id = ? FOR UPDATE',
            [userId],
            (err, results) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Database error" }));
                }

                const currentBalance = results[0]?.balance || 0;
                if (currentBalance < amount) {
                    return db.rollback(() => res.status(400).json({ message: "Insufficient balance" }));
                }

                // Deduct from balance and add to savings
                db.query(
                    'UPDATE user_finances SET balance = balance - ?, savings = savings + ? WHERE user_id = ?',
                    [amount, amount, userId],
                    (err) => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ message: "Failed to update finances" }));
                        }

                        // Record the savings transaction
                        db.query(
                            'INSERT INTO savings_history (user_id, type, amount) VALUES (?, "add", ?)',
                            [userId, amount],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => res.status(500).json({ message: "Failed to record transaction" }));
                                }

                                // Commit the transaction
                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                                    }
                                    res.json({ message: "Added to savings successfully" });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// ✅ Remove from Savings (Transfer from Savings to Balance)
=======
// Add to Savings
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
app.post('/api/savings/remove', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

<<<<<<< HEAD
    const { amount } = req.body;
    if (isNaN(amount) || amount <= 0) {
=======
    const { amount, date } = req.body;
    if (isNaN(amount)) {
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
        return res.status(400).json({ message: "Invalid amount" });
    }

    const userId = req.session.user.id;
<<<<<<< HEAD

    // Start a transaction
=======
    const transactionDate = new Date(date);

>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Transaction failed" });
        }

<<<<<<< HEAD
        // Check if the user has enough savings
        db.query(
            'SELECT savings FROM user_finances WHERE user_id = ? FOR UPDATE',
            [userId],
            (err, results) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Database error" }));
                }

                const currentSavings = results[0]?.savings || 0;
                if (currentSavings < amount) {
                    return db.rollback(() => res.status(400).json({ message: "Insufficient savings" }));
                }

                // Deduct from savings and add to balance
=======
        // Add to savings history
        db.query(
            'INSERT INTO savings_history (user_id, type, amount, date) VALUES (?, "remove", ?, ?)',
            [userId, amount, transactionDate],
            (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Failed to record transaction" }));
                }

                // Update user_finances table (increase balance and reduce savings)
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
                db.query(
                    'UPDATE user_finances SET savings = savings - ?, balance = balance + ? WHERE user_id = ?',
                    [amount, amount, userId],
                    (err) => {
                        if (err) {
<<<<<<< HEAD
                            return db.rollback(() => res.status(500).json({ message: "Failed to update finances" }));
                        }

                        // Record the savings transaction
                        db.query(
                            'INSERT INTO savings_history (user_id, type, amount) VALUES (?, "remove", ?)',
                            [userId, amount],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => res.status(500).json({ message: "Failed to record transaction" }));
                                }

                                // Commit the transaction
                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                                    }
                                    res.json({ message: "Removed from savings successfully" });
                                });
                            }
                        );
=======
                            return db.rollback(() => res.status(500).json({ message: "Failed to update savings and balance" }));
                        }

                        // Commit the transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                            }
                            res.json({ message: "Removed from savings successfully" });
                        });
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
                    }
                );
            }
        );
    });
});

<<<<<<< HEAD
// ✅ Fetch Savings History
app.get('/api/savings/history', (req, res) => {
=======
// Remove from Savings
app.post('/api/savings/remove', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { amount, date, month, year } = req.body;
    if (isNaN(amount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const userId = req.session.user.id;
    let transactionDate = new Date();

    if (date) {
        transactionDate = new Date(date);
    } else if (month) {
        const [yearPart, monthPart] = month.split('-');
        transactionDate = new Date(yearPart, monthPart - 1, 1); // Set to the first day of the month
    } else if (year) {
        transactionDate = new Date(year, 0, 1); // Set to the first day of the year
    }

    // Start a transaction to ensure both operations succeed or fail together
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ message: "Transaction failed" });
        }

        // Add to savings history
        db.query(
            'INSERT INTO savings_history (user_id, type, amount, date) VALUES (?, "remove", ?, ?)',
            [userId, amount, transactionDate],
            (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Failed to record transaction" }));
                }

                // Update user_finances table
                db.query(
                    'UPDATE user_finances SET savings = savings - ? WHERE user_id = ?',
                    [amount, userId],
                    (err) => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ message: "Failed to update savings" }));
                        }

                        // Commit the transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ message: "Commit failed" }));
                            }
                            res.json({ message: "Removed from savings successfully" });
                        });
                    }
                );
            }
        );
    });
});

// Fetch Savings History
app.get('/api/savings-history', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { date, month, year } = req.query;
    let query = 'SELECT * FROM savings_history WHERE user_id = ?';
    let params = [req.session.user.id];

    if (date) {
        query += ' AND DATE(date) = ?';
        params.push(date);
    } else if (month) {
        query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
        const [yearPart, monthPart] = month.split('-');
        params.push(monthPart, yearPart);
    } else if (year) {
        query += ' AND YEAR(date) = ?';
        params.push(year);
    }

    query += ' ORDER BY date ASC';

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Failed to fetch savings history" });
        }
        res.json(results);
    });
});

// Fetch Total Expenses
app.get('/api/total-expenses', (req, res) => {
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
<<<<<<< HEAD
        'SELECT * FROM savings_history WHERE user_id = ? ORDER BY date DESC',
        [req.session.user.id],
        (err, results) => {
            if (err) {
=======
        "SELECT SUM(amount) AS totalExpenses FROM transactions WHERE user_id = ? AND type = 'debit'",
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch total expenses" });
            }
            res.json({ totalExpenses: results[0]?.totalExpenses || 0 });
        }
    );
});

// Fetch Expenses by Category
app.get('/api/expenses-by-category', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
        `SELECT category, SUM(amount) AS total 
         FROM transactions 
         WHERE user_id = ? AND type = 'debit'
         GROUP BY category`,
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch categorized expenses" });
            }
            res.json(results);
        }
    );
});

// Fetch Savings History Between Two Dates
app.get('/api/savings-history-range', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
    }

    const userId = req.session.user.id;

    db.query(
        'SELECT * FROM savings_history WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC',
        [userId, startDate, endDate],
        (err, results) => {
            if (err) {
>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
                return res.status(500).json({ message: "Failed to fetch savings history" });
            }
            res.json(results);
        }
    );
});

<<<<<<< HEAD
=======
// Add Card to Database
// Add Card to Database
app.post('/api/cards/add', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { cardName, cardNumber, cardExpiry, cardCVV, cardType } = req.body;

    if (!cardName || !cardNumber || !cardExpiry || !cardCVV || !cardType) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.session.user.id;

    db.query(
        'INSERT INTO cards (user_id, card_name, card_number, card_expiry, card_cvv, card_type) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, cardName, cardNumber, cardExpiry, cardCVV, cardType],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add card" });
            }
            res.json({ message: "Card added successfully", cardId: result.insertId });
        }
    );
});

// Fetch Cards for the Logged-In User
app.get('/api/cards', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.session.user.id;

    db.query(
        'SELECT * FROM cards WHERE user_id = ? ORDER BY id DESC',
        [userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch cards" });
            }
            res.json(results);
        }
    );
});


>>>>>>> e486554 (We integrated AI and worked on backend. Imporved the UI for better stability)
// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));