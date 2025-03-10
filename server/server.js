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
                    "INSERT INTO user_finances (user_id, balance, income) VALUES (?, ?, ?)",
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

                const finances = financeResults.length > 0 ? financeResults[0] : { balance: 0, income: 0 };
                res.json({ 
                    success: true, 
                    balance: finances.balance, 
                    income: finances.income 
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

    db.query('SELECT balance, income FROM user_finances WHERE user_id = ?', [req.session.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        const finances = results.length > 0 ? results[0] : { balance: 0, income: 0 };
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

    const { name, mode, date, amount, type } = req.body;

    if (!name || !mode || !date || isNaN(amount) || !type) {
        return res.status(400).json({ message: "Invalid transaction data" });
    }

    const userId = req.session.user.id;

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
        }
    );
});

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
app.post('/api/savings/remove', (req, res) => {
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
                db.query(
                    'UPDATE user_finances SET savings = savings - ?, balance = balance + ? WHERE user_id = ?',
                    [amount, amount, userId],
                    (err) => {
                        if (err) {
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
                    }
                );
            }
        );
    });
});

// ✅ Fetch Savings History
app.get('/api/savings/history', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    db.query(
        'SELECT * FROM savings_history WHERE user_id = ? ORDER BY date DESC',
        [req.session.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Failed to fetch savings history" });
            }
            res.json(results);
        }
    );
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));