const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, generateToken, generateRefreshToken, logAudit } = require('../middleware/auth');
const { authorise } = require('../middleware/rbac');
const { registerValidation, loginValidation } = require('../middleware/validate');

/**
 * POST /api/auth/register
 * Register a new user. Only admins can set roles other than 'engineer'.
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { email, password, name, role, depot } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create user (password is hashed automatically by the pre-save hook)
    const user = await User.create({
      email,
      password,
      name,
      role: 'viewer',
      depot: depot || 'Main Depot'
    });

    // Log the registration
    await logAudit('USER_CREATED', {
      userId: user._id,
      resource: 'user',
      resourceId: user._id.toString(),
      message: `New user registered: ${email} with role "${user.role}"`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens.
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logAudit('LOGIN_FAILED', {
        message: `Login attempt with unknown email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });

      // Use the same message for both cases to prevent user enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Contact an administrator.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await logAudit('LOGIN_FAILED', {
        userId: user._id,
        message: `Failed login attempt for: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await logAudit('LOGIN_SUCCESS', {
      userId: user._id,
      message: `User logged in: ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile. Requires authentication.
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toJSON() }
  });
});

/**
 * POST /api/auth/refresh
 * Refresh the access token using a refresh token.
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.'
      });
    }

    const newToken = generateToken(user._id, user.role);

    await logAudit('TOKEN_REFRESH', {
      userId: user._id,
      message: `Token refreshed for: ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.'
    });
  }
});

/**
 * GET /api/auth/users
 * List all users. Admin only.
 */
router.get('/users', authenticate, authorise('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { users, count: users.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

module.exports = router;
