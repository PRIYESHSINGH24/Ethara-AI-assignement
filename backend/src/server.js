require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5001;
const isDev = process.env.NODE_ENV !== 'production';

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
// Auth endpoints: max 20 requests per 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again in 15 minutes.' },
  skip: () => isDev, // disabled in development so tests aren't affected
});

// General API: max 300 requests per 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
  skip: () => isDev,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '2mb' })); // was 10mb — no need for that
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Qphoria Task Manager API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Root redirect (for direct backend access) ─────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Qphoria API — visit /api/health for status. Frontend runs on port 80.',
    docs: '/api/health',
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
// NOTE: Never expose stack traces in production
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (isDev) console.error(err.stack);
  res.status(status).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `
  ╔═══════════════════════════════════════╗
  ║   Qphoria Task Manager API            ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)} ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
