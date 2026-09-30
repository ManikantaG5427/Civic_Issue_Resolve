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
| **11** | **Worker Dashboard** | ✅ Done | `b54ae86` feat: add field worker dashboard and operational task queue |
| **12** | **Worker Progress Updates** | ✅ Done | `0e79044` feat: add field worker start work and progress update workflow |
| **13** | **Worker Resolution Evidence** | ✅ Done | `3e8ca8d` feat: add resolution proof before after comparison and verification workflow |
| **14** | **Citizen Confirm / Reopen** | ✅ Done | `f3d79da` feat: add citizen resolution confirmation rating and reopen workflow |
| **15** | **In-App Notifications** | ✅ Done | `4f623f9` feat: add in-app persistent notifications system and navbar popover |
| **16** | **Real-Time Socket.IO** | ✅ Done | `4359fb6` feat(realtime): complete queue 16 with Socket.IO authentication and live synchronization |
| **17** | **Comments & Internal Notes** | ✅ Done | `22d0111` feat(comments): complete queue 17 with discussion comments, staff internal notes, and RBAC sanitization |
| **18** | **Duplicate Detection & Social Actions** | ✅ Done | `8eda8d4` feat(geospatial): complete queue 18 with nearby duplicate detection, proximity radius calculation, and upvote/follow social actions |
| **19** | **SLA Automated Background Engine** | ✅ Done | `4a0c3b0` feat(sla): complete queue 19 with automated background SLA cron monitor, escalation engine, and admin controls |
| **20** | **Admin Analytics & Intelligence** | ✅ Done | `21cb87f` feat(analytics): complete queue 20 with executive KPI scorecard, category distributions, and worker leaderboard |
| **21** | **Public Verified Civic Map Explorer** | ✅ Done | `976de7f` feat(map): complete queue 21 with public verified civic map explorer, status presets, and drawer previews |
| **22** | **Security Hardening & OpenAPI Docs** | ✅ Done | `34b247e` feat(security): complete queue 22 with OpenAPI docs, health diagnostics, security headers, and Phase 2 roadmap |
| **23** | **Mobile Foundation & Authentication** | ✅ Done | `feat(mobile): add React Native Expo companion app architecture, AuthContext, JWT persistence & role routing` |
| **24** | **Citizen Mobile Reporting & GPS Evidence** | ✅ Done | `feat(mobile): add mobile report creation, camera/gallery evidence, GPS coords & duplicate warning` |
| **25** | **Mobile Report Tracking & Comments** | ✅ Done | `feat(mobile): add real-time timeline sync, citizen comments, rating & reopen defect workflow` |
| **26** | **Worker Mobile Task Queue & Resolution** | ✅ Done | `feat(mobile): add SLA countdowns, start work, interim progress logs & photo proof resolution` |
| **27** | **Mobile Civic Map & Notifications** | ✅ Done | `feat(mobile): add public civic map explorer, status presets, category chips & in-app alerts` |

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
