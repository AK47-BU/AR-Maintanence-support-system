const express = require('express');
const router = express.Router();
const Fault = require('../models/Fault');
const { Tool, ToolCheck } = require('../models/Tool');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');
const { authorise } = require('../middleware/rbac');

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/overview
 * Combined overview stats for the main dashboard. All authenticated roles.
 */
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalFaults,
      activeFaults,
      criticalFaults,
      faultsThisWeek,
      totalTools,
      missingTools,
      totalChecks,
      failedChecks,
      recentFaults,
      recentChecks
    ] = await Promise.all([
      Fault.countDocuments(),
      Fault.countDocuments({ status: { $in: ['detected', 'confirmed', 'in_progress'] } }),
      Fault.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
      Fault.countDocuments({ createdAt: { $gte: weekAgo } }),
      Tool.countDocuments(),
      Tool.countDocuments({ status: 'missing' }),
      ToolCheck.countDocuments({ createdAt: { $gte: monthAgo } }),
      ToolCheck.countDocuments({ passed: false, createdAt: { $gte: monthAgo } }),
      Fault.find().populate('detectedBy', 'name').sort({ createdAt: -1 }).limit(5),
      ToolCheck.find().populate('performedBy', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        faults: {
          total: totalFaults,
          active: activeFaults,
          critical: criticalFaults,
          thisWeek: faultsThisWeek
        },
        tools: {
          total: totalTools,
          missing: missingTools,
          checksThisMonth: totalChecks,
          failedChecks
        },
        recent: {
          faults: recentFaults,
          toolChecks: recentChecks
        }
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

/**
 * GET /api/dashboard/fault-trends
 * Fault trends over the last 30 days, grouped by day.
 * Useful for line/bar charts on the dashboard.
 */
router.get('/fault-trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Fault.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Also get resolution rate
    const resolutionRate = await Fault.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: { trends, resolutionRate, periodDays: days }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fault trends.' });
  }
});

/**
 * GET /api/dashboard/audit-log
 * View audit logs. Admin only.
 */
router.get('/audit-log', authorise('admin'), async (req, res) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

/**
 * GET /api/dashboard/security-events
 * Recent security-relevant events. Admin only.
 * Shows failed logins, unauthorised access attempts, suspicious activity.
 */
router.get('/security-events', authorise('admin'), async (req, res) => {
  try {
    const securityActions = [
      'LOGIN_FAILED',
      'UNAUTHORISED_ACCESS',
      'SUSPICIOUS_ACTIVITY'
    ];

    const events = await AuditLog.find({
      action: { $in: securityActions }
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    const summary = await AuditLog.aggregate([
      { $match: { action: { $in: securityActions } } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        events,
        summary: Object.fromEntries(summary.map(s => [s._id, s.count]))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch security events.' });
  }
});

module.exports = router;
