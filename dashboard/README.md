# AR Maintenance — Dashboard (React Frontend)

This is the React dashboard for the AR Maintenance Support System.
It connects to the Node.js/Express backend built by the Cyber Security team.

---

## What's included

| Page | Who can see it | What it does |
|---|---|---|
| **Overview** | All roles | Stats cards, fault trend chart, status donut, recent activity |
| **Faults** | All roles | Full fault list with filters, report new faults, view/annotate/update status |
| **Tools** | All roles | Tool inventory status, AR tool check history with detail view |
| **Audit Log** | Admin only | Full audit trail of all system actions |
| **Security** | Admin only | Failed logins and unauthorised access events |

---

## Getting started

### Prerequisites

- Node.js v18 or later
- The backend server running (see the other repo's README)

### Step 1 — Start the backend

In the backend folder:

```bash
npm install
node seed.js      # populates the database with test data
npm run dev       # starts on http://localhost:3000
```

Test it's running: open http://localhost:3000/api/health in your browser.

### Step 2 — Start the dashboard

In this folder (ar-dashboard):

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

> The Vite config already proxies `/api/*` requests to `localhost:3000`,
> so you don't need to configure any URLs.

---

## Logging in

After running `node seed.js` in the backend, these test accounts exist:

| Role | Email | Password |
|---|---|---|
| Admin | admin@busdepot.com | Admin123! |
| Engineer | engineer@busdepot.com | Engineer123! |
| Viewer | viewer@busdepot.com | Viewer123! |

- **Admin** sees everything including Audit Log and Security pages.
- **Engineer** can report faults and add annotations, but no admin pages.
- **Viewer** read-only access.

---

## Project structure

```
src/
├── components/
│   ├── charts/
│   │   ├── FaultTrendChart.jsx   # Line chart — faults over 30 days by severity
│   │   └── StatusDonutChart.jsx  # Donut chart — faults by status
│   ├── layout/
│   │   ├── Sidebar.jsx           # Navigation sidebar with user info
│   │   └── Topbar.jsx            # Page header bar
│   └── ui/
│       ├── Badge.jsx             # Severity, status, pass/fail badges
│       ├── LoadingState.jsx      # Spinner and empty state components
│       ├── Modal.jsx             # Reusable modal wrapper
│       └── StatCard.jsx          # Metric card for stat grids
├── hooks/
│   └── useAuth.jsx               # Auth context — login/logout, current user
├── pages/
│   ├── AuditPage.jsx             # Audit log (admin only)
│   ├── FaultsPage.jsx            # Fault list + report + detail/annotate
│   ├── LoginPage.jsx             # Login screen
│   ├── OverviewPage.jsx          # Main dashboard overview
│   ├── SecurityPage.jsx          # Security events (admin only)
│   └── ToolsPage.jsx             # Tool inventory + check history
├── services/
│   └── api.js                    # All API calls in one place
├── utils/
│   └── format.js                 # Date formatting, humanise, initials
├── App.jsx                       # Routing + auth guard
├── index.css                     # All styles (CSS variables + components)
└── main.jsx                      # React entry point
```

---

## Notes for the report

- The JWT token is stored **in memory only** (not localStorage), which is the security-conscious approach — if the page is refreshed the user logs in again.
- The Vite proxy means no CORS config is needed in development.
- Admin-only routes redirect non-admin users silently back to the overview.
- The fault status flow is enforced in the UI: `detected → confirmed → in_progress → resolved`, with `false_alarm` available as an early exit.
