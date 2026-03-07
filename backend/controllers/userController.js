const db = require('../config/db');

// Get all users (admin only)
async function getAll(req, res) {
    try {
        const [rows] = await db.query('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Delete user (admin only, cannot delete self)
async function remove(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        }
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: 'User deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAll, remove };
