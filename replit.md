# Horizon Bank

## Running on Replit

This project uses two existing services:

- **Backend API:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Frontend:** `cd frontend && npm run dev`

The configured `Project` workflow starts both services. The frontend is served on
port 5000 and proxies `/api` requests to the backend on port 8000.

## Environment

- `DATABASE_URL` is provided by the Replit environment and is used by the
  backend for its PostgreSQL connection.
- `SESSION_SECRET` is used to sign backend JWTs.
- `VITE_API_URL` is optional; when unset, the frontend uses its same-origin
  `/api` proxy.

## Verification

- API health check: `http://localhost:8000/health`
- Frontend preview: port 5000
- Frontend production build: `cd frontend && npm run build`