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
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost,http://localhost:5173')
  .split(',').map((o) => o.trim());

const TRUSTED_DEPLOY_DOMAINS = ['.railway.app', '.onrender.com', '.vercel.app', '.netlify.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (TRUSTED_DEPLOY_DOMAINS.some((d) => origin.endsWith(d))) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
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

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function seedIfEmpty() {
  const data = db.read();
  if (data.users && data.users.length > 0) return; // already has data

  console.log('[SEED] Fresh database detected — seeding demo accounts...');
  const now = new Date().toISOString();
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const memberPassword = await bcrypt.hash('Member@123', 10);

  const adminId = uuidv4();
  const memberId = uuidv4();

  data.users = [
    { id: adminId, name: 'Alex Rivera', email: 'admin@qphoria.com', password: adminPassword, role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex%20Rivera', bio: '', isActive: true, createdAt: now, updatedAt: now },
    { id: memberId, name: 'Jordan Lee', email: 'member@qphoria.com', password: memberPassword, role: 'member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan%20Lee', bio: '', isActive: true, createdAt: now, updatedAt: now },
  ];

  // Seed 3 projects
  const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4();
  data.projects = [
    { id: p1, name: 'Qphoria Mobile App', description: 'Build iOS and Android version of Qphoria.', color: '#6c5ce7', priority: 'high', dueDate: '2026-06-30', ownerId: adminId, members: [{ userId: adminId, role: 'admin' }, { userId: memberId, role: 'member' }], createdAt: now, updatedAt: now },
    { id: p2, name: 'Q2 Marketing Launch', description: 'Plan and execute Q2 product launch campaign.', color: '#00cec9', priority: 'urgent', dueDate: '2026-05-31', ownerId: adminId, members: [{ userId: adminId, role: 'admin' }, { userId: memberId, role: 'member' }], createdAt: now, updatedAt: now },
    { id: p3, name: 'Backend Infrastructure', description: 'Migrate to PostgreSQL with Prisma ORM.', color: '#fd79a8', priority: 'medium', dueDate: '2026-07-15', ownerId: adminId, members: [{ userId: adminId, role: 'admin' }, { userId: memberId, role: 'member' }], createdAt: now, updatedAt: now },
  ];

  // Seed tasks
  const mkTask = (title, projectId, assigneeId, priority, status) => ({ id: uuidv4(), title, description: '', projectId, assigneeId, createdBy: adminId, priority, status, tags: [], comments: [], dueDate: null, estimatedHours: null, completedAt: status === 'done' ? now : null, createdAt: now, updatedAt: now });
  data.tasks = [
    mkTask('Set up React Native project', p1, adminId, 'high', 'done'),
    mkTask('Design system tokens', p1, memberId, 'medium', 'done'),
    mkTask('Build authentication screens', p1, memberId, 'high', 'in_progress'),
    mkTask('Implement push notifications', p1, adminId, 'high', 'in_progress'),
    mkTask('Dashboard screen with charts', p1, memberId, 'medium', 'review'),
    mkTask('App Store submission', p1, adminId, 'urgent', 'todo'),
    mkTask('Write product launch blog post', p2, memberId, 'high', 'done'),
    mkTask('Social media campaign', p2, memberId, 'urgent', 'in_progress'),
    mkTask('Set up Google Ads campaign', p2, adminId, 'urgent', 'todo'),
    mkTask('Evaluate PostgreSQL vs MongoDB', p3, adminId, 'medium', 'done'),
    mkTask('Write Prisma schema', p3, memberId, 'high', 'in_progress'),
    mkTask('Data migration script', p3, adminId, 'high', 'todo'),
  ];

  data.notifications = data.notifications || [];
  data.activities = data.activities || [];
  db.write(data);
  console.log('[SEED] Done — admin@qphoria.com / Admin@123 | member@qphoria.com / Member@123');
}

app.listen(PORT, async () => {
  await seedIfEmpty();
  console.log('\x1b[36m%s\x1b[0m', `
  ╔═══════════════════════════════════════╗
  ║   Qphoria Task Manager API            ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)} ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
