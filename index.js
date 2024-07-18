const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const users = [
    { username: 'user1', password: '$2a$10$EIXisD8/Aw/TrI5G0xUgY.pY0LJTpWfMf4Y5u0iO6QsbZIH3/F22a' } // password is 'password'
];

let expenses = [];

// Middleware for error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'secretKey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// User authentication endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username }, 'secretKey', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Expense management endpoints
app.get('/api/expenses', authenticateToken, (req, res) => {
    res.json(expenses);
});

app.post('/api/expenses', authenticateToken, (req, res) => {
    const expense = req.body;
    expenses.push(expense);
    res.status(201).json(expense);
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const index = expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
        expenses[index] = req.body;
        res.json(expenses[index]);
    } else {
        res.status(404).json({ message: 'Expense not found' });
    }
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    expenses = expenses.filter(exp => exp.id !== id);
    res.status(204).send();
});

// Expense calculation endpoint
app.get('/api/expense', authenticateToken, (req, res) => {
    const totalExpense = expenses.reduce((total, exp) => total + exp.amount, 0);
    res.json({ totalExpense });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
