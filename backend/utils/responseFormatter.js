const success = (res, data, statusCode = 200) => {
    res.status(statusCode).json(data);
};

const created = (res, data) => {
    res.status(201).json(data);
};

const error = (res, message, statusCode = 400) => {
    res.status(statusCode).json({ error: message });
};

module.exports = { success, created, error };
