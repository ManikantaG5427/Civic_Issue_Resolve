# CivicResolve — Feature Development Queue

## Development Rule

Build only one feature at a time.

A feature can be marked Done only when:

- The database model/change is complete.
- Backend API is complete.
- Frontend UI is complete.
- Frontend and backend validation are complete.
- Authorization is enforced in the backend.
- Loading, success, empty, and error states are handled.
- Basic tests are added.
- Lint passes.
- Build passes.
- The feature is tested manually.
- The feature is committed to Git.

---

## Queue Status Tracker

| Queue | Feature | Status | Commit / Notes |
|---|---|---|---|
| **0** | **Project Foundation** | ✅ Done | `418631d` chore: initialize MERN project foundation |
| **1** | **Authentication** | ✅ Done | `ed5712c` feat: add authentication with JWT and protected routes |
| **2** | **Roles & Permissions** | ✅ Done | `62d828e` feat: add role-based access control and permissions |
| **3** | **Configuration Data** | ✅ Done | `e4ae92e` feat: add civic categories departments and service areas |
| **4** | **Citizen Creates Issue** | ✅ Done | `e495314` feat: add citizen civic issue reporting |
| **5** | **Map Location & GPS** | ✅ Done | `d721ed3` feat: add issue map location and GPS selection |
| **6** | **Evidence Image Upload** | ✅ Done | `a5f2388` feat: add secure civic issue evidence uploads |
| **7** | **My Reports & Detail** | ✅ Done | `9cdf182` feat: add citizen reports dashboard and issue timeline |
| **8** | **Admin Review Queue** | ✅ Done | `f0b3ced` feat: add administrator review queue and triage metrics |
| **9** | **Verify, Reject, Request Info** | ✅ Done | `0c77041` feat: add admin triage verify reject and request info workflow |
| **10** | **Assignment Workflow** | ✅ Done | `feat: add field worker assignment and SLA deadline dispatch` |
| **11** | **Worker Dashboard** | ✅ Done | `feat: add field worker dashboard and operational task queue` |
| 12 | Worker Progress Updates | ⏳ Pending | In-progress workflow & updates |
| 13 | Worker Resolution Evidence | ⏳ Pending | Proof of resolution (before/after photos) |
| 14 | Citizen Confirm / Reopen | ⏳ Pending | Verified closure or reopening with reasons |
| 15 | In-App Notifications | ⏳ Pending | Persistent notification system |
| 16 | Real-Time Socket.IO | ⏳ Pending | Live updates without refresh |
| 17 | Comments & Internal Notes | ⏳ Pending | Public/internal visibility separation |
| 18 | Duplicate Detection | ⏳ Pending | Geospatial nearby duplicate search & following |
| 19 | SLA & Escalation | ⏳ Pending | Deadlines, node-cron overdue tracking, escalation |
| 20 | Admin Analytics | ⏳ Pending | Recharts KPI cards, trends, worker workload |
| 21 | Public Issue Map | ⏳ Pending | Privacy-safe verified public map |
| 22 | Security & Testing | ⏳ Pending | Helmet, rate limits, end-to-end tests, docs |
| 23 | Optional AI Assistant | ⏳ Pending | Category/title suggestions (advisory only) |

---

## Queue 0 — Project Foundation

### Feature Goal
Create a clean, maintainable MERN project structure.

### Tasks
- [x] Create `client` React + Vite application.
- [x] Create `server` Node.js + Express application.
- [x] Connect backend to MongoDB.
- [x] Add environment variable configuration (`.env.example`).
- [x] Add ESLint and Prettier.
- [x] Add basic folder structure.
- [x] Create `GET /api/health`.
- [x] Add central backend error handler.
- [x] Add frontend Not Found page.
- [x] Add README with setup steps.
- [x] Add Git ignore rules.
- [x] Configure local uploads directory.

### Acceptance Criteria
- React frontend starts successfully.
- Express backend starts successfully.
- MongoDB connection succeeds.
- `GET /api/health` returns success response.
- Secrets are not committed to Git.
- Lint and production build pass.

### Git Commit
`chore: initialize MERN project foundation`
