const Dashboard = require('../models/Dashboard');
const { asyncHandler } = require('../utils/errorHandler');

const getSummary = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getSummary());
});

const getRevenueChart = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getRevenueChart());
});

const getExpenseChart = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getExpenseChart());
});

const getRecentSales = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getRecentSales());
});

const getMonthlyRevenue = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getMonthlyRevenue());
});

const getProfitChart = asyncHandler(async (req, res) => {
    res.json(await Dashboard.getProfitChart());
});

module.exports = { getSummary, getRevenueChart, getExpenseChart, getRecentSales, getMonthlyRevenue, getProfitChart };
