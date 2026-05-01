#!/usr/bin/env node
/**
 * Qphoria — Core Functionality Test Suite
 * Tests: Auth, Projects, Tasks, Comments, Notifications, RBAC
 */

const BASE = 'http://localhost:5002/api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
let failed = 0;
let adminToken = '';
let memberToken = '';
let adminId = '';
let memberId = '';
let projectId = '';
let taskId = '';
let commentId = '';

const ts = Date.now();
const ADMIN_EMAIL = `admin_${ts}@test.com`;
const MEMBER_EMAIL = `member_${ts}@test.com`;

async function req(method, path, body, token) {
  await sleep(120); // pace every request to prevent connection drops
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('\n========================================');
  console.log('  Qphoria Core Functionality Test Suite');
  console.log('========================================\n');

  // ──────────────────────────────────────────
  // 1. AUTH
  // ──────────────────────────────────────────
  console.log('[1] Authentication');

  // Signup validation — missing fields
  let r = await req('POST', '/auth/signup', { email: ADMIN_EMAIL });
  assert('Signup rejects missing name/password', r.status === 400);

  // Signup validation — short password
  r = await req('POST', '/auth/signup', { name: 'A', email: ADMIN_EMAIL, password: '123' });
  assert('Signup rejects short password', r.status === 400);

  // Admin signup
  r = await req('POST', '/auth/signup', { name: 'Test Admin', email: ADMIN_EMAIL, password: 'password123', role: 'admin' });
  assert('Admin signup succeeds', r.status === 201 && r.data.success);
  assert('Admin role is correct', r.data.data?.user?.role === 'admin');
  adminToken = r.data.data?.token;
  adminId = r.data.data?.user?.id;
  await sleep(300); // bcrypt is CPU-heavy; let the event loop breathe

  // Duplicate signup
  await sleep(100);
  r = await req('POST', '/auth/signup', { name: 'Dup', email: ADMIN_EMAIL, password: 'password123', role: 'admin' });
  assert('Duplicate email rejected', r.status === 409);

  // Member signup
  await sleep(100);
  r = await req('POST', '/auth/signup', { name: 'Test Member', email: MEMBER_EMAIL, password: 'password123', role: 'member' });
  assert('Member signup succeeds', r.status === 201 && r.data.success);
  assert('Member role is correct', r.data.data?.user?.role === 'member');
  memberToken = r.data.data?.token;
  memberId = r.data.data?.user?.id;
  await sleep(300);

  // Login with wrong password
  r = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: 'wrongpass' });
  assert('Login rejects wrong password', r.status === 401);
  await sleep(200);

  // Login success
  r = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: 'password123' });
  assert('Admin login succeeds', r.status === 200 && r.data.success);
  assert('Login returns token', typeof r.data.data?.token === 'string');

  // GET /me without token
  r = await req('GET', '/auth/me', null, null);
  assert('GET /me requires auth', r.status === 401);

  // GET /me with token
  r = await req('GET', '/auth/me', null, adminToken);
  assert('GET /me returns user', r.status === 200 && r.data.data?.email === ADMIN_EMAIL);

  // Update profile
  r = await req('PUT', '/auth/profile', { name: 'Updated Admin', bio: 'Testing bio' }, adminToken);
  assert('Profile update succeeds', r.status === 200 && r.data.data?.name === 'Updated Admin');

  // List users
  r = await req('GET', '/auth/users', null, adminToken);
  assert('List users works', r.status === 200 && Array.isArray(r.data.data));

  // ──────────────────────────────────────────
  // 2. PROJECTS
  // ──────────────────────────────────────────
  console.log('\n[2] Projects');

  // Member cannot create project
  r = await req('POST', '/projects', { name: 'Forbidden Project' }, memberToken);
  assert('Member cannot create project (RBAC)', r.status === 403);

  // Missing name
  r = await req('POST', '/projects', { description: 'no name' }, adminToken);
  assert('Project creation requires name', r.status === 400);

  // Create project as admin
  r = await req('POST', '/projects', { name: 'Test Project', description: 'Automated test', color: '#6C5CE7', priority: 'high', dueDate: '2026-12-31' }, adminToken);
  assert('Admin creates project', r.status === 201 && r.data.success);
  projectId = r.data.data?.id;
  assert('Project has ID', !!projectId);

  // Member cannot access project yet
  r = await req('GET', `/projects/${projectId}`, null, memberToken);
  assert('Member cannot access project before being added', r.status === 403);

  // Add member to project
  r = await req('POST', `/projects/${projectId}/members`, { userId: memberId, role: 'member' }, adminToken);
  assert('Admin adds member to project', r.status === 201);

  // Duplicate member
  r = await req('POST', `/projects/${projectId}/members`, { userId: memberId, role: 'member' }, adminToken);
  assert('Duplicate member rejected', r.status === 409);

  // Member can now access project
  r = await req('GET', `/projects/${projectId}`, null, memberToken);
  assert('Member accesses project after being added', r.status === 200);
  assert('Project has members array', Array.isArray(r.data.data?.members));

  // List projects
  r = await req('GET', '/projects', null, adminToken);
  assert('Admin lists all projects', r.status === 200 && r.data.data.length > 0);

  r = await req('GET', '/projects', null, memberToken);
  assert('Member lists own projects', r.status === 200 && r.data.data.some(p => p.id === projectId));

  // Update project
  r = await req('PUT', `/projects/${projectId}`, { name: 'Updated Project', status: 'active' }, adminToken);
  assert('Admin updates project', r.status === 200 && r.data.data?.name === 'Updated Project');

  // Member cannot update project
  r = await req('PUT', `/projects/${projectId}`, { name: 'Hacked' }, memberToken);
  assert('Member cannot update project (RBAC)', r.status === 403);

  // Activity log
  r = await req('GET', `/projects/${projectId}/activity`, null, adminToken);
  assert('Activity log returns entries', r.status === 200 && Array.isArray(r.data.data));

  // ──────────────────────────────────────────
  // 3. TASKS
  // ──────────────────────────────────────────
  console.log('\n[3] Tasks');

  // Missing title
  r = await req('POST', '/tasks', { projectId, priority: 'high' }, adminToken);
  assert('Task creation requires title', r.status === 400);

  // Missing projectId
  r = await req('POST', '/tasks', { title: 'No project' }, adminToken);
  assert('Task creation requires projectId', r.status === 400);

  // Invalid status
  r = await req('POST', '/tasks', { title: 'Bad status', projectId, status: 'flying' }, adminToken);
  assert('Invalid status rejected', r.status === 400);

  // Create task
  r = await req('POST', '/tasks', { title: 'Test Task', description: 'Auto test task', projectId, assigneeId: memberId, priority: 'high', status: 'todo', dueDate: '2026-05-10', tags: ['testing', 'automation'], estimatedHours: 4 }, adminToken);
  assert('Admin creates task', r.status === 201 && r.data.success);
  taskId = r.data.data?.id;
  assert('Task has ID', !!taskId);
  assert('Task tags saved', Array.isArray(r.data.data?.tags) && r.data.data.tags.includes('testing'));

  // Get task detail
  r = await req('GET', `/tasks/${taskId}`, null, memberToken);
  assert('Member gets task detail', r.status === 200);
  assert('Task has assignee info', !!r.data.data?.assignee);
  assert('Task has project info', !!r.data.data?.project);

  // Update task status
  r = await req('PUT', `/tasks/${taskId}`, { status: 'in_progress' }, memberToken);
  assert('Member updates task status', r.status === 200 && r.data.data?.status === 'in_progress');
  await sleep(150);

  // Mark done — sets completedAt
  r = await req('PUT', `/tasks/${taskId}`, { status: 'done' }, adminToken);
  assert('Task marked done', r.status === 200 && r.data.data?.status === 'done');
  assert('completedAt set when done', !!r.data.data?.completedAt);
  await sleep(150);

  // Reopen — clears completedAt
  r = await req('PUT', `/tasks/${taskId}`, { status: 'in_progress' }, adminToken);
  assert('Task reopened clears completedAt', r.status === 200 && !r.data.data?.completedAt);

  // Filter tasks by status
  r = await req('GET', '/tasks?status=in_progress', null, adminToken);
  assert('Filter tasks by status works', r.status === 200 && r.data.data.every(t => t.status === 'in_progress'));

  // Filter tasks by projectId
  r = await req('GET', `/tasks?projectId=${projectId}`, null, adminToken);
  assert('Filter tasks by projectId works', r.status === 200 && r.data.data.some(t => t.id === taskId));

  // Dashboard stats
  r = await req('GET', '/tasks/stats/dashboard', null, adminToken);
  assert('Dashboard stats returns data', r.status === 200 && typeof r.data.data?.total === 'number');
  assert('Stats has completion rate', typeof r.data.data?.completionRate === 'number');

  // ──────────────────────────────────────────
  // 4. COMMENTS
  // ──────────────────────────────────────────
  console.log('\n[4] Comments');

  // Empty comment rejected
  r = await req('POST', `/tasks/${taskId}/comments`, { content: '' }, memberToken);
  assert('Empty comment rejected', r.status === 400);

  // Post comment
  r = await req('POST', `/tasks/${taskId}/comments`, { content: 'This is a test comment' }, memberToken);
  assert('Member posts comment', r.status === 201 && r.data.success);
  assert('Comment has user info', !!r.data.data?.user);
  commentId = r.data.data?.id;

  // Admin posts comment
  r = await req('POST', `/tasks/${taskId}/comments`, { content: 'Admin reply here' }, adminToken);
  assert('Admin posts comment', r.status === 201);

  // Comments appear in task detail
  r = await req('GET', `/tasks/${taskId}`, null, adminToken);
  assert('Comments appear in task detail', r.data.data?.comments?.length >= 2);

  // ──────────────────────────────────────────
  // 5. NOTIFICATIONS
  // ──────────────────────────────────────────
  console.log('\n[5] Notifications');

  // Get notifications (member was assigned + added to project)
  r = await req('GET', '/notifications', null, memberToken);
  assert('Member has notifications', r.status === 200);
  assert('Unread count present', typeof r.data.data?.unreadCount === 'number');
  assert('Member received notifications', r.data.data?.notifications?.length > 0);

  const notifId = r.data.data?.notifications?.[0]?.id;

  // Mark one read
  if (notifId) {
    r = await req('PUT', `/notifications/${notifId}/read`, null, memberToken);
    assert('Mark single notification read', r.status === 200 && r.data.data?.read === true);
  }

  // Mark all read
  r = await req('PUT', '/notifications/read-all', null, memberToken);
  assert('Mark all notifications read', r.status === 200);

  // Verify all read
  r = await req('GET', '/notifications', null, memberToken);
  assert('Unread count is 0 after mark all', r.data.data?.unreadCount === 0);

  // ──────────────────────────────────────────
  // 6. RBAC — UNAUTHORISED ACCESS
  // ──────────────────────────────────────────
  console.log('\n[6] RBAC & Security');

  // No token access
  r = await req('GET', '/projects', null, null);
  assert('Projects requires authentication', r.status === 401);

  r = await req('GET', '/tasks', null, null);
  assert('Tasks requires authentication', r.status === 401);

  // Invalid token
  r = await req('GET', '/auth/me', null, 'bad.token.here');
  assert('Invalid token rejected', r.status === 401);

  // Member cannot delete project
  r = await req('DELETE', `/projects/${projectId}`, null, memberToken);
  assert('Member cannot delete project', r.status === 403);

  // Member cannot remove other members
  r = await req('DELETE', `/projects/${projectId}/members/${adminId}`, null, memberToken);
  assert('Member cannot remove other members', r.status === 403);

  // Non-member cannot access project
  const otherSignup = await req('POST', '/auth/signup', { name: 'Outsider', email: `outsider_${ts}@test.com`, password: 'password123', role: 'member' });
  const outsiderToken = otherSignup.data.data?.token;
  r = await req('GET', `/projects/${projectId}`, null, outsiderToken);
  assert('Non-member blocked from project', r.status === 403);

  r = await req('GET', `/tasks/${taskId}`, null, outsiderToken);
  assert('Non-member blocked from task', r.status === 403);

  // ──────────────────────────────────────────
  // 7. CLEANUP — DELETE
  // ──────────────────────────────────────────
  console.log('\n[7] Cleanup & Delete');

  // Remove member
  r = await req('DELETE', `/projects/${projectId}/members/${memberId}`, null, adminToken);
  assert('Admin removes member', r.status === 200);

  // Delete task
  r = await req('DELETE', `/tasks/${taskId}`, null, adminToken);
  assert('Admin deletes task', r.status === 200);

  // Deleted task returns 404
  r = await req('GET', `/tasks/${taskId}`, null, adminToken);
  assert('Deleted task returns 404', r.status === 404);

  // Delete project (cascades tasks + members)
  r = await req('DELETE', `/projects/${projectId}`, null, adminToken);
  assert('Admin deletes project', r.status === 200);

  // Deleted project returns 404
  r = await req('GET', `/projects/${projectId}`, null, adminToken);
  assert('Deleted project returns 404', r.status === 404);

  // ──────────────────────────────────────────
  // RESULTS
  // ──────────────────────────────────────────
  const total = passed + failed;
  console.log('\n========================================');
  console.log(`  Results: ${passed}/${total} tests passed`);
  if (failed > 0) console.log(`  FAILED:  ${failed} test(s) need attention`);
  else console.log('  All tests passed.');
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner error:', err.message, err.cause ? '| cause: ' + err.cause.message : '');
  process.exit(1);
});
