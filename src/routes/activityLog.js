const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ActivityLog = require('../models/activityLog');

// Log an activity
router.post('/', auth, async (req, res) => {
  try {
    const { action, page, description, details } = req.body;
    
    const activityLog = new ActivityLog({
      userId: req.user.id,
      username: req.user.username,
      action,
      page,
      description,
      details,
      ipAddress: req.ip
    });

    const savedLog = await activityLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get activity logs with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { page, action, startDate, endDate, limit = 50, skip = 0 } = req.query;
    
    let filter = {};
    
    // Filter by page
    if (page) {
      filter.page = page;
    }
    
    // Filter by action
    if (action) {
      filter.action = action;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const totalCount = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    res.json({
      totalCount,
      count: logs.length,
      skip: parseInt(skip),
      limit: parseInt(limit),
      logs
    });
  } catch (error) {
    console.error('[ActivityLog] Error fetching logs:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get activity statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, page } = req.query;
    
    let filter = {};
    if (page) filter.page = page;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const stats = await ActivityLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ stats });
  } catch (error) {
    console.error('[ActivityLog] Error fetching stats:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get recent activities
router.get('/recent/:limit', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.params.limit) || 10, 100);
    
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(logs);
  } catch (error) {
    console.error('[ActivityLog] Error fetching recent logs:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
