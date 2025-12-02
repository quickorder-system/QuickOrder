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
 * @route GET /api/reports/export-pdf
 * @description Export sales report to PDF format
 * @query startDate - Start date (ISO 8601 format: YYYY-MM-DD)
 * @query endDate - End date (ISO 8601 format: YYYY-MM-DD)
 * @query paymentMethod - Optional filter by payment method (GCash, Maya, Cash)
 * @access Private (Admin/Owner only)
 * @returns {Stream} PDF file
 */
router.get('/export-pdf', async (req, res) => {
    try {
        const { startDate, endDate, paymentMethod } = req.query;

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

        logger.info(`Generating PDF report from ${startDate} to ${endDate}`);

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

        // Daily Breakdown Table
        doc.fontSize(12).font('Helvetica-Bold').text('Daily Sales Breakdown');
        doc.fontSize(9).font('Helvetica');

        // Table header
        const tableTop = doc.y;
        const col1 = 60;
        const col2 = 250;
        const col3 = 400;

        doc.text('Date', col1, tableTop);
        doc.text('Daily Sales (₱)', col2, tableTop);
        doc.text('Orders', col3, tableTop);

        // Horizontal line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let yPosition = tableTop + 25;
        salesData.forEach(day => {
            if (yPosition > doc.page.height - 100) {
                doc.addPage();
                yPosition = 50;
            }
            doc.text(day._id, col1, yPosition);
            doc.text(day.dailySales.toFixed(2), col2, yPosition);
            doc.text(day.orderCount.toString(), col3, yPosition);
            yPosition += 20;
        });

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
