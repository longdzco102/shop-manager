// Custom application error with status code
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

// Wrap async controller functions to auto-catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handling middleware (mount LAST in Express)
const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log errors in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('🔥 Error:', err);
    }

    // Handle MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Dữ liệu đã tồn tại (trùng lặp).' });
    }

    res.status(statusCode).json({ error: message });
};

module.exports = { AppError, asyncHandler, globalErrorHandler };
