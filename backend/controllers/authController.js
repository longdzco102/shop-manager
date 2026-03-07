const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
async function login(req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Register (admin only)
async function register(req, res) {
    try {
        const { username, password, full_name, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
            [username, hash, full_name || '', role || 'staff']
        );

        res.status(201).json({ id: result.insertId, username, full_name, role: role || 'staff' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
}

// Get current user profile
async function getProfile(req, res) {
    try {
        const [users] = await db.query('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { login, register, getProfile };
