# Qphoria — Team Task Manager 🚀

A full-stack team task manager with role-based access control, Kanban boards, real-time dashboards, and a premium dark UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | Vanilla CSS (dark premium theme) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | JSON file (zero-config, swap for PostgreSQL easily) |
| Auth | JWT + bcrypt |

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Features

- ✅ **Authentication** — Signup/Login with JWT, role selection (Admin/Member)
- ✅ **Projects** — Create, edit, delete projects with color coding and progress tracking
- ✅ **Kanban Board** — Drag-free status columns (Todo → In Progress → Review → Done)
- ✅ **Tasks** — Full CRUD with priority, due date, tags, assignee, estimated hours
- ✅ **Comments** — Threaded discussion on each task
- ✅ **Dashboard** — Pie chart, bar chart, stat cards, recent tasks, project progress
- ✅ **Notifications** — Real-time bell with unread count
- ✅ **Role-Based Access** — Admin can create projects, manage members; Members can create/update tasks
- ✅ **Activity Log** — Per-project action history
- ✅ **Admin Panel** — User management table with search

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get profile
- `PUT /api/auth/profile` — Update profile
- `GET /api/auth/users` — List all users

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project (Admin)
- `GET /api/projects/:id` — Project detail
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project
- `POST /api/projects/:id/members` — Add member
- `DELETE /api/projects/:id/members/:userId` — Remove member
- `GET /api/projects/:id/activity` — Activity log

### Tasks
- `GET /api/tasks` — List tasks (with filters)
- `POST /api/tasks` — Create task
- `GET /api/tasks/:id` — Task detail + comments
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task
- `POST /api/tasks/:id/comments` — Add comment
- `GET /api/tasks/stats/dashboard` — Dashboard stats

### Notifications
- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/:id/read` — Mark read
- `PUT /api/notifications/read-all` — Mark all read
