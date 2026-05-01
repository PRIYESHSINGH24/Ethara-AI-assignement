const express = require('express');
const { filter, update, getAll } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - get current user's notifications
router.get('/', authenticate, (req, res) => {
  const notifications = filter('notifications', (n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return res.json({ success: true, data: { notifications, unreadCount } });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, (req, res) => {
  const updated = update('notifications', req.params.id, { read: true });
  if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
  return res.json({ success: true, data: updated });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, (req, res) => {
  const userNotifications = filter('notifications', (n) => n.userId === req.user.id && !n.read);
  userNotifications.forEach((n) => update('notifications', n.id, { read: true }));
  return res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
