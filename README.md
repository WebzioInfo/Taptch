# TAPTCH — Digital Identity & NFC Platform

An independent, enterprise-grade digital identity and dynamic NFC/QR profile platform.

## Architecture

The project is structured into two completely independent applications:

```
taptch/
├── frontend/          # Standalone React 19 + Vite Frontend SPA
│   ├── src/           # Components, pages, hooks, services, types
│   ├── .env           # Independent frontend environment
│   ├── package.json   # Independent frontend dependencies
│   └── Dockerfile     # Nginx static multi-stage container
│
└── backend/           # Standalone NestJS 11 Backend API Engine
    ├── src/           # Modules, database, guards, interceptors, types
    ├── .env           # Independent backend environment
    ├── package.json   # Independent backend dependencies
    └── Dockerfile     # Node.js production multi-stage container
```

- **Zero Monorepo Workspaces**: Frontend and backend are completely decoupled.
- **Zero Shared Local Packages**: No `@taptch/shared` dependency. Each application maintains its own types, configurations, and dependencies.
- **Independent CI/CD**: Each application can be built, tested, and deployed to independent servers/containers.

---

## Quick Start

### 1. Frontend Setup (React + Vite)

```powershell
cd frontend
npm install
npm run dev      # Runs Vite dev server at http://localhost:5173
npm run build    # Production build into frontend/dist/
```

Frontend Environment (`frontend/.env`):
```env
VITE_API_URL=http://localhost:4000
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=TAPTCH
```

### 2. Backend Setup (NestJS)

```powershell
cd backend
npm install
npm run dev      # Runs NestJS dev server with hot-reload at http://localhost:4000
npm run build    # Production build into backend/dist/
```

Backend Environment (`backend/.env`):
```env
PORT=4000
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
```

---

## Production Verification

Both applications compile and build with zero errors:

- **Frontend Build**: `cd frontend && npm run build` -> `dist/`
- **Backend Build**: `cd backend && npm run build` -> `dist/`

