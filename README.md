# AR Maintenance Support System

Augmented Reality maintenance tracking system for bus networks. Users can report faults and perform tool checks using AR markers, with a dashboard for analytics.

Built with Node.js, Express, MongoDB, and AR.js.

---

## Setup & Running

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `MONGODB_URI` - MongoDB connection string (local or Atlas)
- `JWT_SECRET` - Random string for JWT signing (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 2. Backend Server

```bash
# Install dependencies
npm install

# Start MongoDB (if using local instance)
mongod

# Seed database with sample data
node seed.js

# Start the server
npm run dev
```

Server runs at `http://localhost:3000`  
Test accounts (created by seed.js):
- Admin: `admin@busdepot.com` / `Admin123!`
- Engineer: `engineer@busdepot.com` / `Engineer123!`
- Viewer: `viewer@busdepot.com` / `Viewer123!`

### 3. Dashboard (Web UI)

In a new terminal:
```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard runs at `http://localhost:5173`

### 4. HTTPS Tunnel (for mobile testing)

AR requires HTTPS on mobile. Use ngrok to expose your local server:

```bash
ngrok http 3000
```

This outputs an HTTPS URL like `https://xxxx.ngrok-free.dev`. Open that on your phone browser to access the AR interface at `https://xxxx.ngrok-free.dev/ar/`.

---

## .env File

The `.env` file contains sensitive configuration. Create it by copying `.env.example`:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ar-maintenance
JWT_SECRET=your-generated-secret-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

For MongoDB Atlas (cloud), use: `mongodb+srv://username:password@cluster.mongodb.net/ar-maintenance`

Generate a secure JWT_SECRET with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never commit `.env` to version control** - it contains secrets.

---

## Features

- Augmented Reality fault reporting and tool verification
- JWT-based authentication with role-based access control
- Real-time dashboard with analytics and audit logging
- MongoDB for data persistence
- Security-focused implementation with input validation and rate limiting
