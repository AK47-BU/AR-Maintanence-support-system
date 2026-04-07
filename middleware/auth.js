const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Authentication middleware — verifies JWT token from Authorization header.
 * 
 * Expected header format: Authorization: Bearer <token>
 * 
 * On success: attaches req.user with the full user document.
 * On failure: returns 401 with error message.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Contact an administrator.'
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Generate JWT access token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Generate JWT refresh token (longer-lived)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Log an action to the audit trail
 */
const logAudit = async (action, details = {}) => {
  try {
    await AuditLog.create({
      user: details.userId || null,
      action,
      resource: details.resource || null,
      resourceId: details.resourceId || null,
      details: details.message || '',
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null,
      success: details.success !== undefined ? details.success : true
    });
  } catch (error) {
    // Don't crash the request if audit logging fails
    console.error('Audit log error:', error.message);
  }
};

module.exports = { authenticate, generateToken, generateRefreshToken, logAudit };
