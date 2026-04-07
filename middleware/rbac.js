const { logAudit } = require('./auth');

/**
 * Role-Based Access Control (RBAC) middleware.
 * 
 * Usage:
 *   router.get('/admin-only', authenticate, authorise('admin'), handler);
 *   router.get('/engineers', authenticate, authorise('admin', 'engineer'), handler);
 * 
 * Role hierarchy:
 *   admin    — full access: manage users, all CRUD, export data, view audit logs
 *   engineer — field access: create/update faults, perform tool checks, view dashboard
 *   viewer   — read-only: view faults, view dashboard, view tool status
 */
const authorise = (...allowedRoles) => {
  return async (req, res, next) => {
    // authenticate middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log the unauthorised access attempt
      await logAudit('UNAUTHORISED_ACCESS', {
        userId: req.user._id,
        message: `User "${req.user.email}" with role "${req.user.role}" attempted to access resource requiring roles: [${allowedRoles.join(', ')}]. Route: ${req.method} ${req.originalUrl}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

/**
 * RBAC permission matrix — documents what each role can do.
 * This is used both as reference and can be served via an API endpoint.
 */
const PERMISSIONS = {
  admin: {
    users:     { create: true, read: true, update: true, deactivate: true },
    faults:    { create: true, read: true, update: true, resolve: true, delete: true, annotate: true },
    tools:     { create: true, read: true, update: true, check: true },
    dashboard: { view: true, export: true },
    auditLogs: { view: true },
    analytics: { view: true, full: true }
  },
  engineer: {
    users:     { create: false, read: false, update: false, deactivate: false },
    faults:    { create: true, read: true, update: true, resolve: true, delete: false, annotate: true },
    tools:     { create: false, read: true, update: false, check: true },
    dashboard: { view: true, export: false },
    auditLogs: { view: false },
    analytics: { view: true, full: false }
  },
  viewer: {
    users:     { create: false, read: false, update: false, deactivate: false },
    faults:    { create: false, read: true, update: false, resolve: false, delete: false, annotate: false },
    tools:     { create: false, read: true, update: false, check: false },
    dashboard: { view: true, export: false },
    auditLogs: { view: false },
    analytics: { view: true, full: false }
  }
};

/**
 * Check a specific permission for the current user.
 * 
 * Usage:
 *   if (hasPermission(req.user.role, 'faults', 'delete')) { ... }
 */
const hasPermission = (role, resource, action) => {
  return PERMISSIONS[role]?.[resource]?.[action] || false;
};

module.exports = { authorise, PERMISSIONS, hasPermission };
