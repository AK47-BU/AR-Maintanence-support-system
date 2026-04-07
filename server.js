const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const faultRoutes = require('./routes/faults');
const toolRoutes = require('./routes/tools');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────

// Helmet — sets various HTTP security headers
// (Content-Security-Policy, X-Content-Type-Options, etc.)
app.use(helmet());

// CORS — restrict which origins can access the API
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — prevent brute-force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                     // limit each IP to 20 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));  // Allows AR screenshots in base64
app.use(express.urlencoded({ extended: false }));

// ─────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────

// Health check — no auth required
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AR Maintenance API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes (register, login, refresh, profile)
app.use('/api/auth', authLimiter, authRoutes);

// Fault management routes
app.use('/api/faults', faultRoutes);

// Tool management and tool check routes
app.use('/api/tools', toolRoutes);

// Dashboard and analytics routes
app.use('/api/dashboard', dashboardRoutes);

// RBAC permissions reference endpoint
app.get('/api/permissions', (req, res) => {
  const { PERMISSIONS } = require('./middleware/rbac');
  res.json({ success: true, data: { permissions: PERMISSIONS } });
});

// ─────────────────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message
  });
});

// ─────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚌 AR Maintenance API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
