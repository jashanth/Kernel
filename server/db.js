const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nishanth@123', // Replace with your actual MySQL root password
    database: 'pocket_money'
});

db.connect(err => {
    if (err) {
        console.error("Database Connection Failed: " + err);
    } else {
        console.log("Connected to MySQL");
    }
});

module.exports = db;
