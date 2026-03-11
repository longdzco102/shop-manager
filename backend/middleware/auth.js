const jwt = require('jsonwebtoken');

// Verify JWT token middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

// Optional auth - reads token if present, continues if not
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        } catch (err) { /* ignore invalid token */ }
    }
    next();
}

// Require admin role
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
}

// Require staff or admin role
function requireStaff(req, res, next) {
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Staff role required.' });
    }
    next();
}

// Require customer role
function requireCustomer(req, res, next) {
    if (!req.user || req.user.role !== 'customer') {
        return res.status(403).json({ error: 'Access denied. Customer login required.' });
    }
    next();
}

module.exports = { authenticate, optionalAuth, requireAdmin, requireStaff, requireCustomer };
