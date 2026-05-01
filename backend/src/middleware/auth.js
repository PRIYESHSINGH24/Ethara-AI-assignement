const jwt = require('jsonwebtoken');
const { findOne } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'qphoria_super_secret_key_2024';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findOne('users', (u) => u.id === decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

const requireProjectAdmin = (getProjectFn) => (req, res, next) => {
  const { filter } = require('../db');
  const projectId = req.params.projectId || req.body.projectId;
  const member = filter('projectMembers', (m) => m.projectId === projectId && m.userId === req.user.id).find(Boolean);
  if (req.user.role === 'admin' || (member && member.role === 'admin')) return next();
  return res.status(403).json({ success: false, message: 'Project admin access required' });
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin, JWT_SECRET };
