const express = require('express');
const { create, getById, update, remove, filter, findOne, getAll } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper to check if user is project member or global admin
function isProjectMember(userId, projectId) {
  return filter('projectMembers', (m) => m.projectId === projectId && m.userId === userId).length > 0;
}
function isProjectAdmin(userId, projectId, globalRole) {
  if (globalRole === 'admin') return true;
  const m = findOne('projectMembers', (m) => m.projectId === projectId && m.userId === userId);
  return m && m.role === 'admin';
}

// GET /api/projects - list projects the user belongs to or all (global admin)
router.get('/', authenticate, (req, res) => {
  const projects =
    req.user.role === 'admin'
      ? getAll('projects')
      : filter('projectMembers', (m) => m.userId === req.user.id).map((m) => getById('projects', m.projectId)).filter(Boolean);

  const enriched = projects.map((p) => {
    const members = filter('projectMembers', (m) => m.projectId === p.id);
    const tasks = filter('tasks', (t) => t.projectId === p.id);
    const memberUsers = members.map((m) => {
      const u = getById('users', m.userId);
      if (!u) return null;
      const { password: _, ...safe } = u;
      return { ...safe, projectRole: m.role };
    }).filter(Boolean);

    return {
      ...p,
      memberCount: members.length,
      taskCount: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'done').length,
      members: memberUsers,
    };
  });

  return res.json({ success: true, data: enriched });
});

// POST /api/projects - create project (admin only)
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can create projects' });
  }
  const { name, description, color, dueDate, priority } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

  const project = create('projects', {
    name: name.trim(),
    description: description || '',
    color: color || '#6C5CE7',
    dueDate: dueDate || null,
    priority: priority || 'medium',
    status: 'active',
    createdBy: req.user.id,
  });

  // Auto-add creator as admin
  create('projectMembers', { projectId: project.id, userId: req.user.id, role: 'admin' });

  // Log activity
  create('activityLogs', {
    projectId: project.id,
    userId: req.user.id,
    action: 'project_created',
    details: `Project "${project.name}" created`,
  });

  return res.status(201).json({ success: true, data: project });
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (req.user.role !== 'admin' && !isProjectMember(req.user.id, project.id)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const members = filter('projectMembers', (m) => m.projectId === project.id);
  const tasks = filter('tasks', (t) => t.projectId === project.id);
  const memberUsers = members.map((m) => {
    const u = getById('users', m.userId);
    if (!u) return null;
    const { password: _, ...safe } = u;
    return { ...safe, projectRole: m.role };
  }).filter(Boolean);

  return res.json({
    success: true,
    data: {
      ...project,
      members: memberUsers,
      tasks,
      taskStats: {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        review: tasks.filter((t) => t.status === 'review').length,
        done: tasks.filter((t) => t.status === 'done').length,
      },
    },
  });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!isProjectAdmin(req.user.id, project.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Project admin access required' });
  }
  const { name, description, color, dueDate, priority, status } = req.body;
  const updated = update('projects', project.id, { name, description, color, dueDate, priority, status });
  return res.json({ success: true, data: updated });
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!isProjectAdmin(req.user.id, project.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  remove('projects', project.id);
  // Cascade delete
  filter('tasks', (t) => t.projectId === project.id).forEach((t) => remove('tasks', t.id));
  filter('projectMembers', (m) => m.projectId === project.id).forEach((m) => remove('projectMembers', m.id));
  return res.json({ success: true, message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!isProjectAdmin(req.user.id, project.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

  const user = getById('users', userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const existing = findOne('projectMembers', (m) => m.projectId === project.id && m.userId === userId);
  if (existing) return res.status(409).json({ success: false, message: 'User already in project' });

  const member = create('projectMembers', { projectId: project.id, userId, role: role || 'member' });

  // Notification
  create('notifications', {
    userId,
    type: 'project_invite',
    message: `You've been added to project "${project.name}"`,
    read: false,
    link: `/projects/${project.id}`,
  });

  return res.status(201).json({ success: true, data: member });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!isProjectAdmin(req.user.id, project.id, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  const member = findOne('projectMembers', (m) => m.projectId === project.id && m.userId === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  remove('projectMembers', member.id);
  return res.json({ success: true, message: 'Member removed' });
});

// GET /api/projects/:id/activity
router.get('/:id/activity', authenticate, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const logs = filter('activityLogs', (l) => l.projectId === project.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50)
    .map((log) => {
      const u = getById('users', log.userId);
      return { ...log, user: u ? { id: u.id, name: u.name, avatar: u.avatar } : null };
    });
  return res.json({ success: true, data: logs });
});

module.exports = router;
