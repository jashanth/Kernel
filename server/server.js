const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json()); // ✅ Correct way to parse JSON
app.use(express.static(path.join(__dirname, '../public')));

// API to fetch transactions
app.get('/api/transactions', (req, res) => {
    db.query("SELECT * FROM transactions", (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
