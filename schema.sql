CREATE DATABASE pocket_money;
USE pocket_money;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    mode VARCHAR(50),
    date DATE,
    amount INT
);

-- Insert Sample Data
INSERT INTO transactions (name, mode, date, amount) VALUES
('Figma (Subscription)', 'Credit Card', '2022-06-26', -1800),
('John Doe', 'Debit Card', '2022-06-20', 15000),
('Dribbble (Subscription)', 'Credit Card', '2022-06-19', -1600),
('Bank Transfer', 'Bank', '2022-06-15', -50000);
