const express = require('express');
const { create, getById, update, remove, filter, findOne, getAll } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function canAccessProject(userId, projectId, globalRole) {
  if (globalRole === 'admin') return true;
  return filter('projectMembers', (m) => m.projectId === projectId && m.userId === userId).length > 0;
}

function isProjectAdmin(userId, projectId, globalRole) {
  if (globalRole === 'admin') return true;
  const m = findOne('projectMembers', (m) => m.projectId === projectId && m.userId === userId);
  return m && m.role === 'admin';
}

// GET /api/tasks
// Query params: projectId, status, priority, assigneeId, search, page, limit, sortBy, sortOrder
router.get('/', authenticate, (req, res) => {
  const {
    projectId, status, priority, assigneeId,
    search,
    page = '1', limit = '20',
    sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query;

  let tasks = getAll('tasks');

  // Scope to user's projects for non-admins
  if (req.user.role !== 'admin') {
    const myProjects = filter('projectMembers', (m) => m.userId === req.user.id).map((m) => m.projectId);
    tasks = tasks.filter((t) => myProjects.includes(t.projectId));
  }

  // Filters
  if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
  if (status)    tasks = tasks.filter((t) => t.status === status);
  if (priority)  tasks = tasks.filter((t) => t.priority === priority);
  if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId);

  // Full-text search across title, description, tags
  if (search) {
    const q = search.toLowerCase().trim();
    tasks = tasks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }

  // Sorting
  const SORTABLE = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
  const field = SORTABLE.includes(sortBy) ? sortBy : 'createdAt';
  const dir = sortOrder === 'asc' ? 1 : -1;
  const PRIORITY_ORDER = { low: 1, medium: 2, high: 3, urgent: 4 };
  tasks.sort((a, b) => {
    const av = field === 'priority' ? PRIORITY_ORDER[a[field]] : a[field];
    const bv = field === 'priority' ? PRIORITY_ORDER[b[field]] : b[field];
    if (av == null) return 1;
    if (bv == null) return -1;
    return av < bv ? -dir : av > bv ? dir : 0;
  });

  // Pagination
  const totalCount = tasks.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(totalCount / pageSize);
  tasks = tasks.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  // Enrich
  const enriched = tasks.map((task) => {
    const assignee = task.assigneeId ? getById('users', task.assigneeId) : null;
    const creator  = getById('users', task.createdBy);
    const project  = getById('projects', task.projectId);
    const commentCount = filter('comments', (c) => c.taskId === task.id).length;
    return {
      ...task,
      assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
      creator:  creator  ? { id: creator.id,  name: creator.name }  : null,
      project:  project  ? { id: project.id,  name: project.name, color: project.color } : null,
      commentCount,
      isOverdue: task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(),
    };
  });

  return res.json({
    success: true,
    data: enriched,
    meta: { total: totalCount, page: pageNum, limit: pageSize, totalPages },
  });
});

// POST /api/tasks
router.post('/', authenticate, (req, res) => {
  const { title, description, projectId, assigneeId, priority, dueDate, status, tags, estimatedHours } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });
  if (!projectId) return res.status(400).json({ success: false, message: 'Project ID is required' });

  const project = getById('projects', projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!canAccessProject(req.user.id, projectId, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const task = create('tasks', {
    title: title.trim(),
    description: description || '',
    projectId,
    assigneeId: assigneeId || null,
    createdBy: req.user.id,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate: dueDate || null,
    tags: tags || [],
    estimatedHours: estimatedHours || null,
    completedAt: null,
  });

  // Notify assignee
  if (assigneeId && assigneeId !== req.user.id) {
    create('notifications', {
      userId: assigneeId,
      type: 'task_assigned',
      message: `You've been assigned to "${task.title}"`,
      read: false,
      link: `/tasks/${task.id}`,
      taskId: task.id,
    });
  }

  // Activity log
  create('activityLogs', {
    projectId,
    userId: req.user.id,
    action: 'task_created',
    details: `Task "${task.title}" created`,
    taskId: task.id,
  });

  return res.status(201).json({ success: true, data: task });
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  const task = getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!canAccessProject(req.user.id, task.projectId, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const assignee = task.assigneeId ? getById('users', task.assigneeId) : null;
  const creator = getById('users', task.createdBy);
  const project = getById('projects', task.projectId);
  const comments = filter('comments', (c) => c.taskId === task.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((c) => {
      const u = getById('users', c.userId);
      return { ...c, user: u ? { id: u.id, name: u.name, avatar: u.avatar } : null };
    });

  return res.json({
    success: true,
    data: {
      ...task,
      assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
      creator: creator ? { id: creator.id, name: creator.name } : null,
      project: project ? { id: project.id, name: project.name, color: project.color } : null,
      comments,
      isOverdue: task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(),
    },
  });
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, (req, res) => {
  const task = getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!canAccessProject(req.user.id, task.projectId, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { title, description, assigneeId, priority, status, dueDate, tags, estimatedHours } = req.body;
  const updates = {};
  if (title) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId;
  if (priority && VALID_PRIORITIES.includes(priority)) updates.priority = priority;
  if (status && VALID_STATUSES.includes(status)) {
    updates.status = status;
    if (status === 'done' && task.status !== 'done') updates.completedAt = new Date().toISOString();
    if (status !== 'done') updates.completedAt = null;
  }
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (tags) updates.tags = tags;
  if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours;

  const updated = update('tasks', task.id, updates);

  // Log status change
  if (status && status !== task.status) {
    create('activityLogs', {
      projectId: task.projectId,
      userId: req.user.id,
      action: 'task_status_changed',
      details: `Task "${task.title}" moved to ${status}`,
      taskId: task.id,
    });
    // Notify assignee if not self
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      create('notifications', {
        userId: task.assigneeId,
        type: 'task_updated',
        message: `Task "${task.title}" status changed to ${status}`,
        read: false,
        link: `/tasks/${task.id}`,
        taskId: task.id,
      });
    }
  }

  return res.json({ success: true, data: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, (req, res) => {
  const task = getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!isProjectAdmin(req.user.id, task.projectId, req.user.role) && task.createdBy !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  remove('tasks', task.id);
  filter('comments', (c) => c.taskId === task.id).forEach((c) => remove('comments', c.id));
  return res.json({ success: true, message: 'Task deleted' });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, (req, res) => {
  const task = getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!canAccessProject(req.user.id, task.projectId, req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Comment content is required' });

  const comment = create('comments', { taskId: task.id, userId: req.user.id, content: content.trim() });
  const u = req.user;
  return res.status(201).json({
    success: true,
    data: { ...comment, user: { id: u.id, name: u.name, avatar: u.avatar } },
  });
});

// GET /api/tasks/stats/dashboard - dashboard stats for current user
router.get('/stats/dashboard', authenticate, (req, res) => {
  let tasks = getAll('tasks');
  if (req.user.role !== 'admin') {
    const myProjects = filter('projectMembers', (m) => m.userId === req.user.id).map((m) => m.projectId);
    tasks = tasks.filter((t) => myProjects.includes(t.projectId));
  }

  const now = new Date();
  const myTasks = tasks.filter((t) => t.assigneeId === req.user.id);
  const overdue = tasks.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now);
  const dueThisWeek = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    const due = new Date(t.dueDate);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekEnd;
  });

  return res.json({
    success: true,
    data: {
      total: tasks.length,
      myTasks: myTasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0,
    },
  });
});

module.exports = router;
