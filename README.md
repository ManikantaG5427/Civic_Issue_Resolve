# CivicResolve — Civic Issue Resolution Platform

A vertical-slice civic issue tracking and resolution platform engineered with the MERN stack (Node.js, Express, MongoDB, React + Vite) and architected for seamless companion React Native (Expo) mobile apps for citizens and field workers.

---

## 🏛️ System Architecture

```text
                    ┌──────────────────────────────┐
                    │        MongoDB Database       │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │ Node.js + Express + Mongoose │
                    │        Shared REST API        │
                    └───────┬────────────────┬─────┘
                            │                │
            ┌───────────────┘                └────────────────┐
            │                                                 │
┌───────────▼───────────┐                        ┌────────────▼───────────┐
│ React Web Application │                        │ React Native + Expo App│
│ Citizen/Admin/Worker  │                        │ Mobile-first Citizen & │
│ Browser Dashboards    │                        │ Field Worker Experience│
└───────────────────────┘                        └────────────────────────┘
```

---

## 📦 Project Structure

```text
CIRP/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, HealthChecker, etc.)
│   │   ├── pages/              # Views (HomePage, NotFoundPage)
│   │   ├── services/           # API client service wrappers
│   │   ├── App.jsx             # Main router
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind CSS + custom glassmorphism styles
│   ├── .env.example
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB connection & configuration
│   │   ├── controllers/        # Health and route controllers
│   │   ├── middlewares/        # Central error handler, 404, auth
│   │   ├── routes/             # API routing
│   │   ├── utils/              # AppError, ApiResponse helpers
│   │   ├── tests/              # Node.js native test suite
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entrypoint
│   ├── uploads/                # Local evidence storage directory
│   ├── .env.example
│   └── package.json
│
├── FEATURE_QUEUE.md            # Vertical slice development queue tracker
├── package.json                # Workspace scripts (concurrent dev/build/lint)
└── .gitignore
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Local MongoDB running on `mongodb://localhost:27017` (or MongoDB Atlas connection string)

### 1. Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Environment Variables
Both `server` and `client` have `.env.example` templates pre-configured for local development.

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/civicresolve
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

**Client (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CivicResolve
```

### 3. Run Development Servers
To run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Frontend Client
npm run dev:client
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Validation

### Run Automated Backend Tests
```bash
npm run test
```

### Run ESLint & Formatting
```bash
npm run lint
```

### Run Client Production Build
```bash
npm run build
```

---

## 📋 Feature Development Status
Development follows the strict vertical slice rules defined in [`FEATURE_QUEUE.md`](./FEATURE_QUEUE.md).

- [x] **Queue 0: Project Foundation**
- [ ] **Queue 1: Authentication** (Upcoming)
- [ ] **Queue 2: Roles & Permissions** (Upcoming)
