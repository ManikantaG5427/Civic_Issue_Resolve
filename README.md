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
# MongoDB Atlas Cloud Database URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/civicresolve?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

**Client (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CivicResolve
# Google Maps API Key (Maps JavaScript API + Places API + Geocoding API)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
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
Development follows strict vertical slice rules across 3 comprehensive phases defined in [`FEATURE_QUEUE.md`](./FEATURE_QUEUE.md).

### ✅ Phase 1: Web Core Lifecycle (Queues 0–14)
- [x] **Queue 0**: Project Foundation (MERN + MongoDB + Express + Vite)
- [x] **Queue 1**: Authentication with JWT, bcryptjs password hashing, protected routes
- [x] **Queue 2**: Role-Based Access Control (Citizen, Field Worker, Admin, Super Admin)
- [x] **Queue 3**: Config catalogs (Categories, Departments, Pilot Service Areas, Seeders)
- [x] **Queue 4**: Citizen Issue Creation with ticket generator (`CIVIC-YYYY-XXXXXX`)
- [x] **Queue 5**: Google Maps Pin-drop GPS Location, Places Autocomplete & Geocoder Picker
- [x] **Queue 6**: Secure Multer Evidence Upload pipeline
- [x] **Queue 7**: Citizen My-Reports Dashboard & Interactive Issue Timeline
- [x] **Queue 8**: Administrator Review Queue & Triage Metrics
- [x] **Queue 9**: Admin Actions (Verify, Reject with Audit Trails, Request Citizen Info)
- [x] **Queue 10**: Field Worker Assignment & SLA Deadline Dispatch
- [x] **Queue 11**: Field Worker Task Queue & Operations Dashboard
- [x] **Queue 12**: Field Worker Start Work & Interim Progress Logs
- [x] **Queue 13**: Worker Resolution Proof (Mandatory Photos & Material Tracking)
- [x] **Queue 14**: Citizen 1-5 Star Verification Rating & Defect Reopen Workflow

### ✅ Phase 2: Real-Time Platform Systems & Advanced Services (Queues 15–22)
- [x] **Queue 15**: In-App Persistent Notifications & Navbar Popover
- [x] **Queue 16**: Real-Time Socket.IO Channels (`user:<id>`, `issue:<id>`, `role:admin`)
- [x] **Queue 17**: Comments & Internal Notes Subsystem with RBAC sanitization
- [x] **Queue 18**: Geospatial Proximity Duplicate Detection & Upvote/Follow Social Support
- [x] **Queue 19**: Automated Background SLA Cron Engine (`*/5 * * * *`) & Auto-Escalation
- [x] **Queue 20**: Administrator Executive Analytics KPI Scorecard & Worker Leaderboard
- [x] **Queue 21**: Public Verified Civic Map Explorer with Status Presets & Drawer Previews
- [x] **Queue 22**: Production Hardening (Helmet, Rate Limits, OpenAPI 3.0 Docs, Health Diagnostics)

### ✅ Phase 3: React Native Companion Mobile App (Queues 23–27)
- [x] **Queue 23**: Mobile App Foundation, AuthContext, JWT Persistence & Role-Based Navigation
- [x] **Queue 24**: Citizen Mobile Reporting with Camera/Gallery Evidence & GPS Pinpointing
- [x] **Queue 25**: Mobile Issue Tracking, Live Timeline Sync, Public Comments & Citizen Ratings
- [x] **Queue 26**: Field Worker Mobile Task Queue, SLA Timers, Start Work & Photo Proof Resolution
- [x] **Queue 27**: Mobile Public Civic Map Explorer & Push Notification Center

