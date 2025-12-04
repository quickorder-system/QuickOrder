const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

/**
 * @route GET /api/reports/sales
 * @description Fetch and aggregate sales data within a date range
 * @query startDate - Start date (ISO 8601 format: YYYY-MM-DD)
 * @query endDate - End date (ISO 8601 format: YYYY-MM-DD)
 * @access Private (Admin/Owner only) - can be protected with auth middleware if needed
 * @returns {Object} Chart.js formatted data with daily sales aggregation
 */
router.get('/sales', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate that both dates are provided
        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Both startDate and endDate query parameters are required (format: YYYY-MM-DD)'
            });
        }

        // Parse dates and validate format
        // Parse as local date, not UTC date
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }

        // Validate that startDate is before endDate
        if (start > end) {
            return res.status(400).json({
                message: 'startDate must be before or equal to endDate'
            });
        }

        logger.info(`Fetching sales report from ${startDate} to ${endDate}`);
        logger.info(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

        // MongoDB aggregation pipeline to fetch and aggregate completed orders
        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    total: 1
                }
            },
            {
                $group: {
                    _id: '$date',
                    dailySales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        logger.info(`Sales report generated: ${salesData.length} days with data`);

        // Also check how many complete orders exist in date range for debugging
        const completeOrdersCount = await Order.countDocuments({
            status: 'complete',
            createdAt: {
                $gte: start,
                $lte: end
            }
        });
        logger.info(`Total complete orders in range: ${completeOrdersCount}`);

        // Check all complete orders (regardless of date)
        const allCompleteOrders = await Order.find({ status: 'complete' });
        logger.info(`Total complete orders in database: ${allCompleteOrders.length}`);
        if (allCompleteOrders.length > 0) {
            logger.info(`Sample complete order createdAt: ${allCompleteOrders[0].createdAt}`);
        }

        // Generate array of all dates in the range (to fill gaps with 0 sales)
        const allDates = generateDateRange(start, end);

        // Create a map of sales data for quick lookup
        const salesMap = {};
        salesData.forEach(entry => {
            salesMap[entry._id] = entry.dailySales;
        });

        // Build final labels and data arrays, filling gaps with 0
        const labels = allDates.map(date => formatDate(date));
        const data = allDates.map(date => {
            const dateStr = formatDate(date);
            return salesMap[dateStr] || 0;
        });

        // Calculate summary statistics
        const totalRevenue = data.reduce((sum, val) => sum + val, 0);
        const averageDailySales = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;
        const maxDailySales = Math.max(...data, 0);
        const minDailySales = Math.min(...data.filter(val => val > 0), 0);

        // Format response for Chart.js
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Sales (₱)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ],
            summary: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                averageDailySales: parseFloat(averageDailySales),
                maxDailySales: maxDailySales,
                minDailySales: minDailySales || 0,
                totalDaysInRange: allDates.length,
                daysWithSales: salesData.length,
                totalOrdersCompleted: salesData.reduce((sum, entry) => sum + entry.orderCount, 0)
            }
        };

        res.json(chartData);

    } catch (error) {
        logger.error('Error generating sales report:', error);
        res.status(500).json({
            message: 'Error generating sales report',
            error: error.message
        });
    }
});

/**
 * Helper function to generate an array of dates between startDate and endDate
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<Date>}
 */
function generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

/**
 * @route GET /api/reports/daily
 * @description Get sales report for today
 * @access Public
 */
router.get('/daily', async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        const data = salesData[0] || { totalSales: 0, orderCount: 0, averageOrderValue: 0 };
        const date = formatDate(today);
        const totalSales = parseFloat(data.totalSales.toFixed(2));

        res.json({
            labels: [date],
            datasets: [
                {
                    label: 'Daily Sales (₱)',
                    data: [totalSales],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }
            ],
            summary: {
                totalRevenue: totalSales,
                totalOrdersCompleted: data.orderCount,
                averageOrderValue: parseFloat(data.averageOrderValue.toFixed(2)),
                averageDailySales: totalSales,
                maxDailySales: totalSales,
                minDailySales: totalSales,
                daysWithSales: data.orderCount > 0 ? 1 : 0,
                totalDaysInRange: 1
            }
        });
    } catch (error) {
        logger.error('Error generating daily report:', error);
        res.status(500).json({ message: 'Error generating daily report', error: error.message });
    }
});

/**
 * @route GET /api/reports/weekly
 * @description Get sales report for the current week (Monday to Sunday)
 * @access Public
 */
router.get('/weekly', async (req, res) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        const start = new Date(today.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    total: 1
                }
            },
            {
                $group: {
                    _id: '$date',
                    dailySales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const allDates = generateDateRange(start, end);
        const salesMap = {};
        let totalRevenue = 0;
        let totalOrders = 0;

        salesData.forEach(entry => {
            salesMap[entry._id] = entry.dailySales;
            totalRevenue += entry.dailySales;
            totalOrders += entry.orderCount;
        });

        const labels = allDates.map(date => formatDate(date));
        const data = allDates.map(date => salesMap[formatDate(date)] || 0);
        const averageDailySales = parseFloat((totalRevenue / allDates.length).toFixed(2));
        const maxDailySales = Math.max(...data, 0);
        const minDailySales = Math.min(...data.filter(val => val > 0), 0);

        res.json({
            labels,
            datasets: [
                {
                    label: 'Weekly Sales (₱)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ],
            summary: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalOrdersCompleted: totalOrders,
                averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
                averageDailySales: averageDailySales,
                maxDailySales: maxDailySales,
                minDailySales: minDailySales || 0,
                daysWithSales: salesData.length,
                totalDaysInRange: allDates.length
            }
        });
    } catch (error) {
        logger.error('Error generating weekly report:', error);
        res.status(500).json({ message: 'Error generating weekly report', error: error.message });
    }
});

/**
 * @route GET /api/reports/monthly
 * @description Get sales report for the current month
 * @access Public
 */
router.get('/monthly', async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    total: 1
                }
            },
            {
                $group: {
                    _id: '$date',
                    dailySales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const allDates = generateDateRange(start, end);
        const salesMap = {};
        let totalRevenue = 0;
        let totalOrders = 0;

        salesData.forEach(entry => {
            salesMap[entry._id] = entry.dailySales;
            totalRevenue += entry.dailySales;
            totalOrders += entry.orderCount;
        });

        const labels = allDates.map(date => formatDate(date));
        const data = allDates.map(date => salesMap[formatDate(date)] || 0);
        const averageDailySales = parseFloat((totalRevenue / allDates.length).toFixed(2));
        const maxDailySales = Math.max(...data, 0);
        const minDailySales = Math.min(...data.filter(val => val > 0), 0);

        res.json({
            labels,
            datasets: [
                {
                    label: 'Monthly Sales (₱)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ],
            summary: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalOrdersCompleted: totalOrders,
                averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
                averageDailySales: averageDailySales,
                maxDailySales: maxDailySales,
                minDailySales: minDailySales || 0,
                daysWithSales: salesData.length,
                totalDaysInRange: allDates.length
            }
        });
    } catch (error) {
        logger.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report', error: error.message });
    }
});

/**
 * @route GET /api/reports/yearly
 * @description Get sales report for the current year
 * @access Public
 */
router.get('/yearly', async (req, res) => {
    try {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        const salesData = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $project: {
                    month: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    total: 1
                }
            },
            {
                $group: {
                    _id: '$month',
                    monthlySales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Generate all months for the year
        const allMonths = [];
        for (let month = 0; month < 12; month++) {
            const date = new Date(today.getFullYear(), month, 1);
            const monthStr = date.getFullYear() + '-' + String(month + 1).padStart(2, '0');
            allMonths.push({ date, monthStr });
        }

        const salesMap = {};
        let totalRevenue = 0;
        let totalOrders = 0;

        salesData.forEach(entry => {
            salesMap[entry._id] = entry.monthlySales;
            totalRevenue += entry.monthlySales;
            totalOrders += entry.orderCount;
        });

        const labels = allMonths.map(m => m.monthStr);
        const data = allMonths.map(m => salesMap[m.monthStr] || 0);
        const averageMonthlySales = parseFloat((totalRevenue / 12).toFixed(2));
        const maxDailySales = Math.max(...data, 0);
        const minDailySales = Math.min(...data.filter(val => val > 0), 0);

        res.json({
            labels,
            datasets: [
                {
                    label: 'Yearly Sales (₱)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ],
            summary: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalOrdersCompleted: totalOrders,
                averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
                averageDailySales: averageMonthlySales,
                maxDailySales: maxDailySales,
                minDailySales: minDailySales || 0,
                daysWithSales: salesData.length,
                totalDaysInRange: 12
            }
        });
    } catch (error) {
        logger.error('Error generating yearly report:', error);
        res.status(500).json({ message: 'Error generating yearly report', error: error.message });
    }
});

/**
 * Helper function to format a date as YYYY-MM-DD
 * @param {Date} date
 * @returns {String}
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * @route GET /api/reports/popular-items
 * @description Get popular items based on completed orders
 * @access Public
 * @returns {Object} List of items ranked by order count
 */
router.get('/popular-items', async (req, res) => {
    try {
        const popularItems = await Order.aggregate([
            {
                $match: {
                    status: 'complete'
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.itemId',
                    itemId: { $first: '$items.itemId' },
                    itemName: { $first: '$items.name' },
                    orderCount: { $sum: '$items.quantity' }
                }
            },
            {
                $sort: { orderCount: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            items: popularItems.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                orderCount: item.orderCount
            }))
        });
    } catch (error) {
        logger.error('Error fetching popular items:', error);
        res.status(500).json({
            message: 'Error fetching popular items',
            error: error.message
        });
    }
});

/**
 * @route GET /api/reports/payment-breakdown
 * @description Get sales breakdown by payment method within a date range
 * @query startDate - Start date (ISO 8601 format: YYYY-MM-DD)
 * @query endDate - End date (ISO 8601 format: YYYY-MM-DD)
 * @access Private (Admin/Owner only)
 * @returns {Object} Sales data grouped by payment method
 */
router.get('/payment-breakdown', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Both startDate and endDate query parameters are required (format: YYYY-MM-DD)'
            });
        }

        // Parse dates
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }

        if (start > end) {
            return res.status(400).json({
                message: 'startDate must be before or equal to endDate'
            });
        }

        logger.info(`Fetching payment breakdown from ${startDate} to ${endDate}`);

        // Aggregate sales by payment method
        const paymentBreakdown = await Order.aggregate([
            {
                $match: {
                    status: 'complete',
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            },
            {
                $sort: { totalSales: -1 }
            }
        ]);

        // Transform data for easier frontend consumption
        const paymentMethods = ['GCash', 'Maya', 'Cash'];
        const paymentData = {};
        let grandTotal = 0;
        let totalOrders = 0;

        // Initialize all payment methods with zero values
        paymentMethods.forEach(method => {
            paymentData[method] = {
                sales: 0,
                orders: 0,
                percentage: 0,
                averageOrderValue: 0
            };
        });

        // Populate with actual data
        paymentBreakdown.forEach(item => {
            const method = item._id || 'Unknown';
            if (paymentData[method]) {
                paymentData[method] = {
                    sales: parseFloat(item.totalSales.toFixed(2)),
                    orders: item.orderCount,
                    percentage: 0,
                    averageOrderValue: parseFloat(item.averageOrderValue.toFixed(2))
                };
                grandTotal += item.totalSales;
                totalOrders += item.orderCount;
            }
        });

        // Calculate percentages
        if (grandTotal > 0) {
            Object.keys(paymentData).forEach(method => {
                paymentData[method].percentage = parseFloat(
                    ((paymentData[method].sales / grandTotal) * 100).toFixed(2)
                );
            });
        }

        const response = {
            paymentMethods: paymentData,
            summary: {
                totalRevenue: parseFloat(grandTotal.toFixed(2)),
                totalOrders: totalOrders,
                dateRange: { startDate, endDate }
            }
        };

        res.json(response);

    } catch (error) {
        logger.error('Error generating payment breakdown report:', error);
        res.status(500).json({
            message: 'Error generating payment breakdown report',
            error: error.message
        });
    }
});

/**
 * @route GET /api/reports/export-pdf
 * @description Export sales report to PDF format
 * @query startDate - Start date (ISO 8601 format: YYYY-MM-DD)
 * @query endDate - End date (ISO 8601 format: YYYY-MM-DD)
 * @query paymentMethod - Optional filter by payment method (GCash, Maya, Cash)
 * @query username - Username of person generating report
 * @access Private (Admin/Owner only)
 * @returns {Stream} PDF file
 */
router.get('/export-pdf', async (req, res) => {
    try {
        const { startDate, endDate, paymentMethod, username } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Both startDate and endDate query parameters are required (format: YYYY-MM-DD)'
            });
        }

        // Parse dates
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }

        if (start > end) {
            return res.status(400).json({
                message: 'startDate must be before or equal to endDate'
            });
        }

        logger.info(`Generating PDF report from ${startDate} to ${endDate} by ${username}`);

        // Build query
        const query = {
            status: 'complete',
            createdAt: { $gte: start, $lte: end }
        };

        if (paymentMethod && ['GCash', 'Maya', 'Cash'].includes(paymentMethod)) {
            query.paymentMethod = paymentMethod;
        }

        // Fetch sales data
        const salesData = await Order.aggregate([
            { $match: query },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $group: {
                    _id: '$date',
                    dailySales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fetch payment breakdown by day (detailed)
        const paymentByDay = await Order.aggregate([
            { $match: query },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $group: {
                    _id: {
                        date: '$date',
                        method: '$paymentMethod'
                    },
                    methodSales: { $sum: '$total' },
                    methodOrders: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1, '_id.method': 1 } }
        ]);

        // Fetch payment breakdown for same period
        const paymentBreakdown = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        // Fetch weekly breakdown with payment methods
        const weeklyData = await Order.aggregate([
            { $match: query },
            {
                $project: {
                    week: {
                        $dateToString: {
                            format: '%Y-W%V',
                            date: '$createdAt'
                        }
                    },
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $group: {
                    _id: {
                        week: '$week',
                        method: '$paymentMethod'
                    },
                    weekSales: { $sum: '$total' },
                    weekOrders: { $sum: 1 }
                }
            },
            { $sort: { '_id.week': 1 } }
        ]);

        // Fetch monthly breakdown with payment methods
        const monthlyData = await Order.aggregate([
            { $match: query },
            {
                $project: {
                    month: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $group: {
                    _id: {
                        month: '$month',
                        method: '$paymentMethod'
                    },
                    monthSales: { $sum: '$total' },
                    monthOrders: { $sum: 1 }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        // Fetch yearly breakdown with payment methods
        const yearlyData = await Order.aggregate([
            { $match: query },
            {
                $project: {
                    year: {
                        $dateToString: {
                            format: '%Y',
                            date: '$createdAt'
                        }
                    },
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $group: {
                    _id: {
                        year: '$year',
                        method: '$paymentMethod'
                    },
                    yearSales: { $sum: '$total' },
                    yearOrders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1 } }
        ]);

        // Calculate totals
        const totalRevenue = salesData.reduce((sum, day) => sum + day.dailySales, 0);
        const totalOrders = salesData.reduce((sum, day) => sum + day.orderCount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const filename = `Sales_Report_${startDate}_to_${endDate}.pdf`;

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe document to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Quick Order', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text('Sales Report', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
        
        // Add generated by info
        doc.fontSize(9).font('Helvetica').text(`Generated by: ${username || 'System Administrator'}`, { align: 'center' });
        doc.moveDown(1);

        // Report period
        doc.fontSize(12).font('Helvetica-Bold').text('Report Period');
        doc.fontSize(10).font('Helvetica').text(`From: ${startDate} to ${endDate}`);
        if (paymentMethod) {
            doc.text(`Payment Method: ${paymentMethod}`);
        }
        doc.moveDown(1);

        // Summary Section
        doc.fontSize(12).font('Helvetica-Bold').text('Summary Metrics');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Revenue: ₱${totalRevenue.toFixed(2)}`);
        doc.text(`Total Orders: ${totalOrders}`);
        doc.text(`Average Order Value: ₱${averageOrderValue.toFixed(2)}`);
        doc.moveDown(1);

        // Payment Method Breakdown (if not filtered by single method)
        if (!paymentMethod) {
            doc.fontSize(12).font('Helvetica-Bold').text('Payment Method Breakdown');
            doc.fontSize(10).font('Helvetica');
            
            paymentBreakdown.forEach(method => {
                const percentage = ((method.totalSales / totalRevenue) * 100).toFixed(2);
                doc.text(`${method._id}: ₱${method.totalSales.toFixed(2)} (${method.orderCount} orders, ${percentage}%)`);
            });
            doc.moveDown(1);
        }

        // Daily Breakdown Table with Payment Method Breakdown
        doc.fontSize(12).font('Helvetica-Bold').text('Daily Sales Breakdown (by Payment Method)');
        doc.fontSize(9).font('Helvetica');

        // Table header
        const tableTop = doc.y;
        const col1 = 60;
        const col2 = 130;
        const col3 = 200;
        const col4 = 270;
        const col5 = 340;
        const col6 = 410;

        doc.text('Date', col1, tableTop);
        doc.text('GCash', col2, tableTop);
        doc.text('Maya', col3, tableTop);
        doc.text('Cash', col4, tableTop);
        doc.text('Orders', col5, tableTop);
        doc.text('Total (₱)', col6, tableTop);

        // Horizontal line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let yPosition = tableTop + 25;
        
        // Group payment data by date
        const paymentByDateMap = {};
        paymentByDay.forEach(item => {
            if (!paymentByDateMap[item._id.date]) {
                paymentByDateMap[item._id.date] = {};
            }
            paymentByDateMap[item._id.date][item._id.method] = {
                sales: item.methodSales,
                orders: item.methodOrders
            };
        });

        // Display each day with payment breakdown
        salesData.forEach(day => {
            if (yPosition > doc.page.height - 100) {
                doc.addPage();
                yPosition = 50;
            }
            
            const dayPayments = paymentByDateMap[day._id] || {};
            const gcashSales = dayPayments['GCash']?.sales || 0;
            const mayaSales = dayPayments['Maya']?.sales || 0;
            const cashSales = dayPayments['Cash']?.sales || 0;
            
            doc.text(day._id, col1, yPosition);
            doc.text(gcashSales.toFixed(2), col2, yPosition);
            doc.text(mayaSales.toFixed(2), col3, yPosition);
            doc.text(cashSales.toFixed(2), col4, yPosition);
            doc.text(day.orderCount.toString(), col5, yPosition);
            doc.text(day.dailySales.toFixed(2), col6, yPosition);
            yPosition += 20;
        });

        // Add summary by time period
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text('Payment Method Summary');
        doc.fontSize(10).font('Helvetica');
        
        let gcashTotal = 0, mayaTotal = 0, cashTotal = 0;
        paymentBreakdown.forEach(method => {
            if (method._id === 'GCash') gcashTotal = method.totalSales;
            if (method._id === 'Maya') mayaTotal = method.totalSales;
            if (method._id === 'Cash') cashTotal = method.totalSales;
        });

        const totalRevenue = gcashTotal + mayaTotal + cashTotal;
        
        doc.text(`GCash: ₱${gcashTotal.toFixed(2)} (${((gcashTotal/totalRevenue)*100).toFixed(2)}%)`);
        doc.text(`Maya: ₱${mayaTotal.toFixed(2)} (${((mayaTotal/totalRevenue)*100).toFixed(2)}%)`);
        doc.text(`Cash: ₱${cashTotal.toFixed(2)} (${((cashTotal/totalRevenue)*100).toFixed(2)}%)`);
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text(`Total: ₱${totalRevenue.toFixed(2)}`);

        // Weekly Summary
        if (weeklyData.length > 0) {
            doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').text('Weekly Sales Breakdown');
            doc.fontSize(9).font('Helvetica');

            const weeklyByDate = {};
            weeklyData.forEach(item => {
                if (!weeklyByDate[item._id.week]) {
                    weeklyByDate[item._id.week] = {};
                }
                weeklyByDate[item._id.week][item._id.method] = {
                    sales: item.weekSales,
                    orders: item.weekOrders
                };
            });

            const weeklyTableTop = doc.y;
            const wCol1 = 60;
            const wCol2 = 130;
            const wCol3 = 200;
            const wCol4 = 270;
            const wCol5 = 340;
            const wCol6 = 410;

            doc.text('Week', wCol1, weeklyTableTop);
            doc.text('GCash', wCol2, weeklyTableTop);
            doc.text('Maya', wCol3, weeklyTableTop);
            doc.text('Cash', wCol4, weeklyTableTop);
            doc.text('Orders', wCol5, weeklyTableTop);
            doc.text('Total (₱)', wCol6, weeklyTableTop);

            doc.moveTo(50, weeklyTableTop + 15).lineTo(550, weeklyTableTop + 15).stroke();

            let weeklyY = weeklyTableTop + 25;
            const uniqueWeeks = [...new Set(weeklyData.map(w => w._id.week))].sort();
            
            uniqueWeeks.forEach(week => {
                if (weeklyY > doc.page.height - 100) {
                    doc.addPage();
                    weeklyY = 50;
                }
                
                const weekPayments = weeklyByDate[week] || {};
                const wGcash = weekPayments['GCash']?.sales || 0;
                const wMaya = weekPayments['Maya']?.sales || 0;
                const wCash = weekPayments['Cash']?.sales || 0;
                const wTotal = wGcash + wMaya + wCash;
                const wOrders = (weekPayments['GCash']?.orders || 0) + 
                               (weekPayments['Maya']?.orders || 0) + 
                               (weekPayments['Cash']?.orders || 0);
                
                doc.text(week, wCol1, weeklyY);
                doc.text(wGcash.toFixed(2), wCol2, weeklyY);
                doc.text(wMaya.toFixed(2), wCol3, weeklyY);
                doc.text(wCash.toFixed(2), wCol4, weeklyY);
                doc.text(wOrders.toString(), wCol5, weeklyY);
                doc.text(wTotal.toFixed(2), wCol6, weeklyY);
                weeklyY += 20;
            });
        }

        // Monthly Summary
        if (monthlyData.length > 0) {
            doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').text('Monthly Sales Breakdown');
            doc.fontSize(9).font('Helvetica');

            const monthlyByDate = {};
            monthlyData.forEach(item => {
                if (!monthlyByDate[item._id.month]) {
                    monthlyByDate[item._id.month] = {};
                }
                monthlyByDate[item._id.month][item._id.method] = {
                    sales: item.monthSales,
                    orders: item.monthOrders
                };
            });

            const monthlyTableTop = doc.y;
            const mCol1 = 60;
            const mCol2 = 130;
            const mCol3 = 200;
            const mCol4 = 270;
            const mCol5 = 340;
            const mCol6 = 410;

            doc.text('Month', mCol1, monthlyTableTop);
            doc.text('GCash', mCol2, monthlyTableTop);
            doc.text('Maya', mCol3, monthlyTableTop);
            doc.text('Cash', mCol4, monthlyTableTop);
            doc.text('Orders', mCol5, monthlyTableTop);
            doc.text('Total (₱)', mCol6, monthlyTableTop);

            doc.moveTo(50, monthlyTableTop + 15).lineTo(550, monthlyTableTop + 15).stroke();

            let monthlyY = monthlyTableTop + 25;
            const uniqueMonths = [...new Set(monthlyData.map(m => m._id.month))].sort();
            
            uniqueMonths.forEach(month => {
                if (monthlyY > doc.page.height - 100) {
                    doc.addPage();
                    monthlyY = 50;
                }
                
                const monthPayments = monthlyByDate[month] || {};
                const mGcash = monthPayments['GCash']?.sales || 0;
                const mMaya = monthPayments['Maya']?.sales || 0;
                const mCash = monthPayments['Cash']?.sales || 0;
                const mTotal = mGcash + mMaya + mCash;
                const mOrders = (monthPayments['GCash']?.orders || 0) + 
                               (monthPayments['Maya']?.orders || 0) + 
                               (monthPayments['Cash']?.orders || 0);
                
                doc.text(month, mCol1, monthlyY);
                doc.text(mGcash.toFixed(2), mCol2, monthlyY);
                doc.text(mMaya.toFixed(2), mCol3, monthlyY);
                doc.text(mCash.toFixed(2), mCol4, monthlyY);
                doc.text(mOrders.toString(), mCol5, monthlyY);
                doc.text(mTotal.toFixed(2), mCol6, monthlyY);
                monthlyY += 20;
            });
        }

        // Yearly Summary
        if (yearlyData.length > 0) {
            doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').text('Yearly Sales Breakdown');
            doc.fontSize(9).font('Helvetica');

            const yearlyByDate = {};
            yearlyData.forEach(item => {
                if (!yearlyByDate[item._id.year]) {
                    yearlyByDate[item._id.year] = {};
                }
                yearlyByDate[item._id.year][item._id.method] = {
                    sales: item.yearSales,
                    orders: item.yearOrders
                };
            });

            const yearlyTableTop = doc.y;
            const yCol1 = 60;
            const yCol2 = 130;
            const yCol3 = 200;
            const yCol4 = 270;
            const yCol5 = 340;
            const yCol6 = 410;

            doc.text('Year', yCol1, yearlyTableTop);
            doc.text('GCash', yCol2, yearlyTableTop);
            doc.text('Maya', yCol3, yearlyTableTop);
            doc.text('Cash', yCol4, yearlyTableTop);
            doc.text('Orders', yCol5, yearlyTableTop);
            doc.text('Total (₱)', yCol6, yearlyTableTop);

            doc.moveTo(50, yearlyTableTop + 15).lineTo(550, yearlyTableTop + 15).stroke();

            let yearlyY = yearlyTableTop + 25;
            const uniqueYears = [...new Set(yearlyData.map(y => y._id.year))].sort();
            
            uniqueYears.forEach(year => {
                if (yearlyY > doc.page.height - 100) {
                    doc.addPage();
                    yearlyY = 50;
                }
                
                const yearPayments = yearlyByDate[year] || {};
                const yGcash = yearPayments['GCash']?.sales || 0;
                const yMaya = yearPayments['Maya']?.sales || 0;
                const yCash = yearPayments['Cash']?.sales || 0;
                const yTotal = yGcash + yMaya + yCash;
                const yOrders = (yearPayments['GCash']?.orders || 0) + 
                               (yearPayments['Maya']?.orders || 0) + 
                               (yearPayments['Cash']?.orders || 0);
                
                doc.text(year, yCol1, yearlyY);
                doc.text(yGcash.toFixed(2), yCol2, yearlyY);
                doc.text(yMaya.toFixed(2), yCol3, yearlyY);
                doc.text(yCash.toFixed(2), yCol4, yearlyY);
                doc.text(yOrders.toString(), yCol5, yearlyY);
                doc.text(yTotal.toFixed(2), yCol6, yearlyY);
                yearlyY += 20;
            });
        }

        // Old Daily Breakdown Table (removed - keeping payment method version above)
        

        // Footer
        doc.fontSize(8).font('Helvetica').text('This is an automatically generated report from Quick Order System', 50, doc.page.height - 40, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        logger.error('Error generating PDF report:', error);
        res.status(500).json({
            message: 'Error generating PDF report',
            error: error.message
        });
    }
});

module.exports = router;
