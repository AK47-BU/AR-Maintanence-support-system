# AR Maintenance Support System — Backend API

Backend server for the AR-Enhanced Maintenance Support System for bus network environments.  
Built with **Node.js**, **Express.js**, **MongoDB**, and **JWT authentication**.

**COMP5074 — Technological Innovations in Cyber Security**  
Bournemouth University, 2026

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) (local install) or a [MongoDB Atlas](https://www.mongodb.com/atlas) free-tier cluster

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file

# Then edit .env — at minimum, set JWT_SECRET to a random string

# 3. Start MongoDB (if running locally)
mongod

# 4. Seed the database with sample data
node seed.js

# 5. Start the server
npm run dev    # with auto-reload (development)
npm start      # without auto-reload (production)
```

The server starts at **http://localhost:3000**.  
Verify with: `GET http://localhost:3000/api/health`

### Test Accounts (after seeding)

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@busdepot.com       | Admin123!     |
| Engineer | engineer@busdepot.com    | Engineer123!  |
| Viewer   | viewer@busdepot.com      | Viewer123!    |

---

## API Endpoints

### Authentication

| Method | Endpoint            | Auth | Description                  |
|--------|---------------------|------|------------------------------|
| POST   | /api/auth/register  | No   | Register a new user          |
| POST   | /api/auth/login     | No   | Login, returns JWT tokens    |
| GET    | /api/auth/me        | Yes  | Get current user profile     |
| POST   | /api/auth/refresh   | No   | Refresh access token         |
| GET    | /api/auth/users     | Admin| List all users               |

### Faults

| Method | Endpoint                    | Auth       | Description                 |
|--------|-----------------------------|------------|-----------------------------|
| GET    | /api/faults                 | Any role   | List faults (with filters)  |
| GET    | /api/faults/stats           | Any role   | Fault statistics            |
| GET    | /api/faults/:id             | Any role   | Get single fault            |
| POST   | /api/faults                 | Admin/Eng  | Report a new fault          |
| PATCH  | /api/faults/:id             | Admin/Eng  | Update a fault              |
| POST   | /api/faults/:id/annotate    | Admin/Eng  | Add annotation to fault     |

### Tools

| Method | Endpoint                    | Auth       | Description                 |
|--------|-----------------------------|------------|-----------------------------|
| GET    | /api/tools                  | Any role   | List all tools              |
| POST   | /api/tools                  | Admin      | Add tool to inventory       |
| PATCH  | /api/tools/:id              | Admin      | Update tool status          |
| POST   | /api/tools/checks           | Admin/Eng  | Record AR tool check        |
| GET    | /api/tools/checks           | Any role   | List tool check history     |
| GET    | /api/tools/checks/stats     | Any role   | Tool check statistics       |

### Dashboard

| Method | Endpoint                        | Auth    | Description                  |
|--------|---------------------------------|---------|------------------------------|
| GET    | /api/dashboard/overview         | Any     | Combined dashboard stats     |
| GET    | /api/dashboard/fault-trends     | Any     | Fault trends for charts      |
| GET    | /api/dashboard/audit-log        | Admin   | Security audit trail         |
| GET    | /api/dashboard/security-events  | Admin   | Failed logins, access issues |

### Utility

| Method | Endpoint           | Auth | Description                          |
|--------|--------------------|------|--------------------------------------|
| GET    | /api/health        | No   | Server health check                  |
| GET    | /api/permissions   | No   | RBAC permission matrix reference     |

---

## Authentication Flow

1. **Register** or **Login** → receive `token` and `refreshToken`
2. Include the token in all subsequent requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
3. When the token expires, call `/api/auth/refresh` with the refresh token
4. If the refresh token expires, the user must log in again

---

## Example API Calls (using curl)

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@busdepot.com","password":"Engineer123!"}'

# Get faults (use the token from login response)
curl http://localhost:3000/api/faults \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Report a fault
curl -X POST http://localhost:3000/api/faults \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Cracked wing mirror",
    "type": "structural",
    "severity": "medium",
    "location": { "area": "Nearside wing mirror", "vehicleId": "BF22 YTR" }
  }'

# Perform a tool check
curl -X POST http://localhost:3000/api/tools/checks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "checkType": "pre_shift",
    "vehicleId": "YX23 BUS",
    "expectedTools": [{"name": "Socket Wrench Set"}, {"name": "Multimeter"}],
    "detectedTools": [{"name": "Socket Wrench Set", "confidence": 0.95}]
  }'
```

---

## Project Structure

```
ar-maintenance-api/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   ├── auth.js            # JWT authentication + audit logging
│   ├── rbac.js            # Role-Based Access Control
│   └── validate.js        # Input validation and sanitisation
├── models/
│   ├── User.js            # User model with bcrypt hashing
│   ├── Fault.js           # Fault detection records
│   ├── Tool.js            # Tool inventory + tool check records
│   └── AuditLog.js        # Security audit trail
├── routes/
│   ├── auth.js            # Register, login, token refresh
│   ├── faults.js          # Fault CRUD + annotations
│   ├── tools.js           # Tool management + AR tool checks
│   └── dashboard.js       # Analytics, audit logs, security events
├── server.js              # Express app setup + security middleware
├── seed.js                # Sample data for development
├── .env.example           # Environment variable template
├── package.json
└── README.md
```

---

## Security Features

This prototype implements the following security measures:

- **JWT Authentication** — stateless token-based auth with access + refresh tokens
- **Password Hashing** — bcrypt with 10 salt rounds
- **Role-Based Access Control** — admin, engineer, viewer roles with granular permissions
- **Input Validation** — express-validator on all endpoints to prevent injection
- **Rate Limiting** — 100 req/15min general, 20 req/15min for auth endpoints
- **Security Headers** — Helmet.js sets CSP, HSTS, X-Frame-Options, etc.
- **CORS** — restricted to specified origins only
- **Audit Logging** — all security-relevant actions logged with IP and user agent
- **User Enumeration Prevention** — same error message for invalid email and wrong password
