# Qphoria — Team Task Manager

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
| Containerization | Docker + Docker Compose |

---

## Running with Docker (recommended)

The fastest way to get the full stack running locally — no manual installs required.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start everything
```bash
# From the project root
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (React + Nginx) | http://localhost |
| Backend API | http://localhost:5001 |

### Common commands
```bash
# Start in background
docker-compose up -d --build

# View live logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and delete all data (resets the database)
docker-compose down -v

# Rebuild a single service
docker-compose up --build backend
```

### Set a custom JWT secret (recommended)
```bash
JWT_SECRET=your_long_random_secret docker-compose up --build
```
Or create a `.env` file at the project root:
```
JWT_SECRET=your_long_random_secret_here
```

### Architecture in Docker

```
Browser
  │
  ▼
Nginx (port 80)
  ├── /* ──────────────────► Serves React SPA from /dist
  └── /api/* ──────────────► Proxies to backend:5001
                                │
                                ▼
                          Express API (port 5001)
                                │
                                ▼
                          /app/data/db.json  ◄── named volume (persists restarts)
```

Nginx proxies `/api` requests to the backend container internally — no CORS issues, no hardcoded URLs.

---

## Running Locally (without Docker)

### 1. Backend
```bash
cd backend
cp .env.example .env   # edit JWT_SECRET
npm install
npm run dev
# Runs on http://localhost:5001
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Running Tests
```bash
cd backend
npm test
# Starts a clean server on port 5002 and runs 68 automated tests
```

---

## Features

- Authentication — Signup/Login with JWT, role selection (Admin/Member)
- Password Change — Authenticated endpoint with current-password verification
- Projects — Create, edit, delete projects with color coding and progress tracking
- Kanban Board — Status columns (Todo, In Progress, Review, Done)
- Tasks — Full CRUD with priority, due date, tags, assignee, estimated hours
- Task Search — Server-side full-text search across title, description, and tags
- Pagination — All list endpoints support `?page=&limit=` with total metadata
- Comments — Threaded discussion on each task
- Dashboard — Pie chart, bar chart, stat cards, recent tasks, project progress
- Notifications — Bell icon with unread count
- Role-Based Access — Admin can create projects and manage members; Members can create and update tasks
- Activity Log — Per-project action history
- Admin Panel — User management table with search
- Security — Helmet headers, per-IP rate limiting, bcrypt passwords, JWT auth

---

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get profile
- `PUT /api/auth/profile` — Update profile
- `PUT /api/auth/password` — Change password
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
- `GET /api/tasks` — List tasks (`?search=&status=&priority=&page=&limit=&sortBy=&sortOrder=`)
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

---

## Project Structure

```
task_qphoria_ai/
├── docker-compose.yml          # Orchestrates all services
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── test.js                 # 68-test suite
│   └── src/
│       ├── server.js           # Express entry + security middleware
│       ├── db.js               # JSON file persistence layer
│       ├── middleware/auth.js  # JWT + RBAC
│       └── routes/             # auth, projects, tasks, notifications
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # SPA serving + /api reverse proxy
    ├── .env.example
    └── src/
        ├── pages/              # 9 pages
        ├── components/         # Layout, TaskCard, TaskModal, ErrorBoundary
        ├── context/            # AuthContext
        └── lib/api.ts          # Axios instance
```
