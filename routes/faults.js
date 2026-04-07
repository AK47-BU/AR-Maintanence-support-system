const express = require('express');
const router = express.Router();
const Fault = require('../models/Fault');
const { authenticate, logAudit } = require('../middleware/auth');
const { authorise } = require('../middleware/rbac');
const { faultValidation, annotationValidation } = require('../middleware/validate');

// All fault routes require authentication
router.use(authenticate);

/**
 * GET /api/faults
 * List faults with optional filters. All authenticated roles can read.
 * 
 * Query params: status, severity, type, depot, limit, page
 */
router.get('/', async (req, res) => {
  try {
    const { status, severity, type, depot, limit = 50, page = 1 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (depot) filter['location.depot'] = depot;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [faults, total] = await Promise.all([
      Fault.find(filter)
        .populate('detectedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Fault.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        faults,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching faults:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faults.' });
  }
});

/**
 * GET /api/faults/stats
 * Get fault statistics for dashboard. All authenticated roles.
 */
router.get('/stats', async (req, res) => {
  try {
    const [byStatus, bySeverity, byType, recentCount] = await Promise.all([
      Fault.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Fault.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Fault.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Fault.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      success: true,
      data: {
        byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
        bySeverity: Object.fromEntries(bySeverity.map(s => [s._id, s.count])),
        byType: Object.fromEntries(byType.map(s => [s._id, s.count])),
        recentCount,
        total: await Fault.countDocuments()
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fault stats.' });
  }
});

/**
 * GET /api/faults/:id
 * Get a single fault by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const fault = await Fault.findById(req.params.id)
      .populate('detectedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('annotations.author', 'name email');

    if (!fault) {
      return res.status(404).json({ success: false, message: 'Fault not found.' });
    }

    res.json({ success: true, data: { fault } });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fault.' });
  }
});

/**
 * POST /api/faults
 * Create a new fault report. Requires admin or engineer role.
 */
router.post('/', authorise('admin', 'engineer'), faultValidation, async (req, res) => {
  try {
    const faultData = {
      ...req.body,
      detectedBy: req.user._id
    };

    const fault = await Fault.create(faultData);

    await logAudit('FAULT_CREATED', {
      userId: req.user._id,
      resource: 'fault',
      resourceId: fault._id.toString(),
      message: `Fault "${fault.title}" created by ${req.user.email} — severity: ${fault.severity}`,
      ipAddress: req.ip
    });

    // Populate the response
    await fault.populate('detectedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Fault reported successfully.',
      data: { fault }
    });

  } catch (error) {
    console.error('Error creating fault:', error);
    res.status(500).json({ success: false, message: 'Failed to create fault report.' });
  }
});

/**
 * PATCH /api/faults/:id
 * Update a fault. Requires admin or engineer role.
 */
router.patch('/:id', authorise('admin', 'engineer'), async (req, res) => {
  try {
    // Prevent changing certain fields
    const { detectedBy, _id, ...updates } = req.body;

    // If resolving, set resolver and timestamp
    if (updates.status === 'resolved') {
      updates.resolvedBy = req.user._id;
      updates.resolvedAt = new Date();
    }

    const fault = await Fault.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('detectedBy', 'name email role');

    if (!fault) {
      return res.status(404).json({ success: false, message: 'Fault not found.' });
    }

    const action = updates.status === 'resolved' ? 'FAULT_RESOLVED' : 'FAULT_UPDATED';
    await logAudit(action, {
      userId: req.user._id,
      resource: 'fault',
      resourceId: fault._id.toString(),
      message: `Fault "${fault.title}" updated by ${req.user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Fault updated successfully.',
      data: { fault }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update fault.' });
  }
});

/**
 * POST /api/faults/:id/annotate
 * Add an annotation to a fault. Requires admin or engineer role.
 */
router.post('/:id/annotate', authorise('admin', 'engineer'), annotationValidation, async (req, res) => {
  try {
    const fault = await Fault.findById(req.params.id);

    if (!fault) {
      return res.status(404).json({ success: false, message: 'Fault not found.' });
    }

    fault.annotations.push({
      text: req.body.text,
      author: req.user._id
    });

    await fault.save();

    await logAudit('FAULT_ANNOTATION_ADDED', {
      userId: req.user._id,
      resource: 'fault',
      resourceId: fault._id.toString(),
      message: `Annotation added to fault "${fault.title}" by ${req.user.email}`,
      ipAddress: req.ip
    });

    await fault.populate('annotations.author', 'name email');

    res.json({
      success: true,
      message: 'Annotation added.',
      data: { fault }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add annotation.' });
  }
});

module.exports = router;
