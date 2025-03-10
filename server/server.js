const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// ✅ Serve Static Files from 'public' Folder
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Allow CORS & Include Credentials for Sessions
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}));

app.use(express.json());

// ✅ Configure Session Storage in Memory (Modified for better persistence)
app.use(session({
    secret: 'your_secret_key',
    resave: true, // Changed to true for better session persistence
    saveUninitialized: true, // Changed to true
    cookie: {
        secure: false, // Set to `true` if using HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 24-hour session expiration
    }
}));

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nishanth@123', // ✅ Use your MySQL password
    database: 'pocket_money'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});

// ✅ Redirect Root Route to Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ✅ User Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        (err, result) => {
            if (err) {
                return res.status(400).json({ message: "Username already taken" });
            }
            res.json({ message: "Signup successful! Please log in." });
        }
    );
});

// ✅ User Login (Improved Session Handling)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ Store user in session
        req.session.user = { id: user.id, username: user.username };
        
        // Wait for session to be saved before responding
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Login failed" });
            }
            console.log("Session saved successfully:", req.sessionID);
            res.json({ message: "Login successful", user });
        });
    });
});

// ✅ Authentication Check Route (Improved Logging)
app.get('/api/auth-check', (req, res) => {
    console.log("Auth check request received, session:", req.sessionID);
    console.log("Session user:", req.session.user);
    
    if (req.session.user) {
        console.log("User is authenticated:", req.session.user.username);
        res.json({ isAuthenticated: true, username: req.session.user.username });
    } else {
        console.log("User is not authenticated");
        res.status(401).json({ isAuthenticated: false });
    }
});

// ✅ Logout (Now Clears Session Properly)
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logged out successfully" });
    });
});

// ✅ Debug route to check session state
app.get('/api/debug-session', (req, res) => {
    console.log("Current session ID:", req.sessionID);
    console.log("Session data:", req.session);
    res.json({ 
        sessionID: req.sessionID,
        hasUser: !!req.session.user,
        userData: req.session.user || null
    });
});

// ✅ API route for transactions
app.get('/api/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    
    db.query(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
        [req.session.user.id],
        (err, results) => {
            if (err) {
                console.error("Error fetching transactions:", err);
                return res.status(500).json({ message: "Failed to fetch transactions" });
            }
            res.json(results);
        }
    );
});

// ✅ API route to add transaction
app.post('/api/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { name, mode, date, amount } = req.body;
    
    if (!name || !mode || !date || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid transaction data" });
    }
    
    db.query(
        "INSERT INTO transactions (user_id, name, mode, date, amount) VALUES (?, ?, ?, ?, ?)",
        [req.session.user.id, name, mode, date, amount],
        (err, result) => {
            if (err) {
                console.error("Error adding transaction:", err);
                return res.status(500).json({ message: "Failed to add transaction" });
            }
            
            res.json({ 
                id: result.insertId,
                message: "Transaction added successfully" 
            });
        }
    );
});

// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));