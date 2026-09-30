# CivicResolve Mobile Companion App (React Native + Expo)

Production-grade cross-platform mobile companion application for **CivicResolve** engineered for Citizens and Field Workers.

---

## 📱 Features & Portals

### 1. Citizen Portal
- **Fast Issue Reporting**: Take live camera photos or select from gallery, capture GPS location via `expo-location`, select category & urgency.
- **Geospatial Proximity Warning**: Real-time duplicate detection alerting if an issue was already reported nearby with 1-tap "Upvote & Follow Instead".
- **Real-Time Tracking & Verification**: Live timeline status changes via Socket.IO, before/after resolution evidence viewer, 1-5 star verification rating, and defect reopen workflow.
- **Community Discussion**: Public comments and query replies with municipal staff.

### 2. Field Crew Portal
- **Live Task Dispatch Queue**: Filter by Active, Assigned, In-Progress, or Completed tasks.
- **SLA Urgency Timers**: Dynamic countdown with `⚡ SLA ESCALATED` overdue badges.
- **Field Action Flow**:
  - **Start Work**: Transitions task to `in_progress` and records worker timestamp.
  - **Interim Progress Logs**: Records work performed and material quantities used.
  - **Resolution Proof**: Mandatory photo evidence capture with completion notes to trigger citizen verification.
- **Internal Staff Notes**: Private encrypted staff-only communication log.

### 3. Shared City Map & Notification Center
- **Civic Map Explorer**: Visual category chips and active/resolved status filters.
- **Push Notification Center**: Instant real-time alerts on assignments and status updates.

---

## 🛠️ Architecture & Folder Structure

```text
mobile/
├── App.js                      # Root component with Providers & Navigation
├── app.json                    # Expo configuration & device permissions
├── package.json
├── src/
│   ├── components/
│   │   ├── Header.js           # Brand header with Socket indicator & notification badge
│   │   ├── StatusBadge.js      # Multi-status pill badge (Submitted, Verified, In Progress, etc.)
│   │   ├── PriorityBadge.js    # Priority indicator (Emergency, High, Medium, Low)
│   │   └── EmptyState.js       # Reusable empty state view
│   ├── config/
│   │   ├── api.js              # Axios client with JWT interceptor & dynamic host
│   │   └── theme.js            # Design tokens (dark glassmorphism palette)
│   ├── context/
│   │   ├── AuthContext.js      # Authentication, user state & AsyncStorage persistence
│   │   └── SocketContext.js    # Real-time Socket.IO room subscriptions & alerts
│   ├── navigation/
│   │   ├── RootNavigator.js    # Auth stack vs Citizen vs Worker tabs
│   │   ├── CitizenTabs.js      # Bottom tab navigator for citizens
│   │   └── WorkerTabs.js       # Bottom tab navigator for field crew
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js      # Login with 1-tap demo credentials
│       │   └── RegisterScreen.js   # Citizen & Worker account registration
│       ├── citizen/
│       │   ├── CitizenHomeScreen.js   # Summary metrics & recent reports
│       │   ├── ReportIssueScreen.js   # Photo capture, GPS & duplicate warning
│       │   └── IssueDetailScreen.js   # Timeline, rating & comments
│       ├── worker/
│       │   ├── WorkerTaskQueueScreen.js   # SLA task list & urgency filters
│       │   └── WorkerTaskActionScreen.js  # Start work, progress logs & proof
│       └── common/
│           ├── PublicMapScreen.js         # Verified civic issue explorer
│           ├── NotificationsScreen.js     # Real-time alert feed & mark as read
│           └── ProfileScreen.js           # User account & network status
```

---

## 🚀 Running the Mobile App

### Prerequisites
- Node.js >= 18
- Backend server running at `http://localhost:5000` (run `npm run dev:server` in root)
- Expo CLI (`npm install -g expo-cli` or `npx expo`)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

### 3. Running on Target Devices
- **Android Emulator**: Press `a` in the terminal (auto-maps backend to `http://10.0.2.2:5000/api`).
- **iOS Simulator**: Press `i` in the terminal (connects to `http://localhost:5000/api`).
- **Physical Phone (Expo Go)**: Scan the QR code using the Expo Go app on Android/iOS.
  > *Note: If using a physical phone, set your PC's local Wi-Fi IP in the Login screen config (e.g., `http://192.168.1.50:5000/api`).*
- **Web Browser Preview**: Press `w` in the terminal.

---

## 🔑 Demo Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Citizen** | `citizen@civicresolve.org` | `Password123!` |
| **Field Worker** | `worker@civicresolve.org` | `Password123!` |
| **Admin** | `admin@civicresolve.org` | `Password123!` |
| **Super Admin** | `superadmin@civicresolve.org` | `Password123!` |
