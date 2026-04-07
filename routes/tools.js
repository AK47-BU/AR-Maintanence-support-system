const express = require('express');
const router = express.Router();
const { Tool, ToolCheck } = require('../models/Tool');
const { authenticate, logAudit } = require('../middleware/auth');
const { authorise } = require('../middleware/rbac');
const { toolCheckValidation } = require('../middleware/validate');

// All tool routes require authentication
router.use(authenticate);

/**
 * GET /api/tools
 * List all tools. All authenticated roles.
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, depot } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (depot) filter.depot = depot;

    const tools = await Tool.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        tools,
        count: tools.length,
        summary: {
          available: tools.filter(t => t.status === 'available').length,
          checkedOut: tools.filter(t => t.status === 'checked_out').length,
          missing: tools.filter(t => t.status === 'missing').length,
          maintenance: tools.filter(t => t.status === 'maintenance').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tools.' });
  }
});

/**
 * POST /api/tools
 * Add a new tool to the inventory. Admin only.
 */
router.post('/', authorise('admin'), async (req, res) => {
  try {
    const tool = await Tool.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Tool added to inventory.',
      data: { tool }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Tool serial number already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to add tool.' });
  }
});

/**
 * PATCH /api/tools/:id
 * Update tool status. Admin only.
 */
router.patch('/:id', authorise('admin'), async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found.' });
    }

    await logAudit('TOOL_STATUS_CHANGED', {
      userId: req.user._id,
      resource: 'tool',
      resourceId: tool._id.toString(),
      message: `Tool "${tool.name}" updated by ${req.user.email}`,
      ipAddress: req.ip
    });

    res.json({ success: true, data: { tool } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update tool.' });
  }
});

// ---- Tool Checks ----

/**
 * POST /api/tools/checks
 * Record an AR tool check. Requires admin or engineer role.
 * This is the main endpoint for the AR tool tracking feature.
 */
router.post('/checks', authorise('admin', 'engineer'), toolCheckValidation, async (req, res) => {
  try {
    const { checkType, vehicleId, depot, expectedTools, detectedTools, notes } = req.body;

    // Calculate missing tools (expected but not detected)
    const detectedNames = new Set(detectedTools.map(t => t.name.toLowerCase()));
    const expected = expectedTools || [];
    const missing = expected.filter(t => !detectedNames.has(t.name.toLowerCase()));

    // Calculate unexpected tools (detected but not expected)
    const expectedNames = new Set(expected.map(t => t.name.toLowerCase()));
    const unexpected = detectedTools.filter(t => !expectedNames.has(t.name.toLowerCase()));

    const passed = missing.length === 0;

    const toolCheck = await ToolCheck.create({
      performedBy: req.user._id,
      checkType,
      vehicleId: vehicleId || null,
      depot: depot || 'Main Depot',
      expectedTools: expected,
      detectedTools,
      missingTools: missing,
      unexpectedTools: unexpected,
      totalExpected: expected.length,
      totalDetected: detectedTools.length,
      totalMissing: missing.length,
      passed,
      notes: notes || ''
    });

    await logAudit('TOOL_CHECK_PERFORMED', {
      userId: req.user._id,
      resource: 'toolcheck',
      resourceId: toolCheck._id.toString(),
      message: `Tool check (${checkType}) by ${req.user.email}: ${passed ? 'PASSED' : 'FAILED — ' + missing.length + ' tools missing'}`,
      ipAddress: req.ip
    });

    // Update tool statuses if tools are missing
    for (const m of missing) {
      if (m.tool) {
        await Tool.findByIdAndUpdate(m.tool, { status: 'missing' });
      }
    }

    await toolCheck.populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: passed
        ? `Tool check passed. All ${expected.length} tools accounted for.`
        : `Tool check failed. ${missing.length} tool(s) missing.`,
      data: { toolCheck }
    });

  } catch (error) {
    console.error('Tool check error:', error);
    res.status(500).json({ success: false, message: 'Failed to record tool check.' });
  }
});

/**
 * GET /api/tools/checks
 * List recent tool checks. All authenticated roles.
 */
router.get('/checks', async (req, res) => {
  try {
    const { limit = 20, page = 1, passed } = req.query;
    const filter = {};
    if (passed !== undefined) filter.passed = passed === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [checks, total] = await Promise.all([
      ToolCheck.find(filter)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ToolCheck.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        checks,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tool checks.' });
  }
});

/**
 * GET /api/tools/checks/stats
 * Tool check statistics for the dashboard.
 */
router.get('/checks/stats', async (req, res) => {
  try {
    const [total, passed, failed, recentChecks] = await Promise.all([
      ToolCheck.countDocuments(),
      ToolCheck.countDocuments({ passed: true }),
      ToolCheck.countDocuments({ passed: false }),
      ToolCheck.find()
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        total,
        passed,
        failed,
        passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
        recentChecks
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tool check stats.' });
  }
});

module.exports = router;
