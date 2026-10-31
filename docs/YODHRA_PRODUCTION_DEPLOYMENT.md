# YODHRA — Production Deployment Architecture & Troubleshooting Manual
**Platform:** FastAPI 0.110+ | SQLAlchemy 2.0+ (Psycopg 3) | Supabase Shared Session Pooler | Render Cloud PaaS  
**Repository:** [omkar2xt/Hackfusion2.0-APP](https://github.com/omkar2xt/Hackfusion2.0-APP)

---

## 1. Production Architecture Overview

The YODHRA Cyber Intelligence backend runs as a high-concurrency FastAPI service deployed on Render, connecting to an institutional PostgreSQL cluster managed via Supabase's Session Pooler:

```
[ Android APK / Web PWA Clients ]
               │
               ▼ (HTTPS / TLS 1.3)
      [ Render PaaS: Uvicorn ]
    (FastAPI: 0.0.0.0:$PORT)
               │
   ┌───────────┴────────────────────────┐
   │ Async Lifespan Non-Blocking Init   │
   │ SQLAlchemy 2.0 Engine (Psycopg 3)  │
   │ Connection Pool: size=10, rec=300s │
   └───────────┬────────────────────────┘
               │ (SSL Mode: Require)
               ▼ (TCP 5432)
[ Supabase Session Pooler (PgBouncer) ]
   aws-1-eu-west-3.pooler.supabase.com
               │
               ▼
[ PostgreSQL Dedicated Cluster (AWS eu-west-3) ]
```

---

## 2. Supabase Session Pooler Configuration

For serverless and auto-scaling cloud deployments like Render, Supabase provides PgBouncer poolers to prevent exhausting backend database connections.

| Parameter | Production Value |
|---|---|
| **Host** | `aws-1-eu-west-3.pooler.supabase.com` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **Username** | `postgres.wevmeqdidigchvkxmgkf` |
| **Pool Mode** | Session Pooling |
| **SSL Mode** | `require` (Enforced automatically) |
| **Driver** | `psycopg` (Psycopg 3 Binary v3.1+) |

---

## 3. Correct DATABASE_URL Structure

SQLAlchemy requires a standard RFC-1738 connection URI. Terminal CLI commands (such as `psql -h ...`) are **not** URIs and will be rejected.

### Correct Format:
```text
postgresql+psycopg://postgres.wevmeqdidigchvkxmgkf:<ENCODED_PASSWORD>@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

### Password Encoding:
If your database password contains characters like `@`, `:`, `#`, `%`, or `&`, the YODHRA database resolver automatically unquotes and safely percent-encodes them before initializing SQLAlchemy's `make_url()`. You do not need to manually double-encode your credentials.

---

## 4. Environment Variables Audit

The following table documents all environment variables recognized by the YODHRA backend:

| Variable Name | Required? | Purpose | Where to Obtain / Example |
|---|---|---|---|
| `DATABASE_URL` | **Required (Prod)** | Primary PostgreSQL connection URI | Supabase Dashboard -> Project Settings -> Database -> Connection URI |
| `ENVIRONMENT` | **Required (Prod)** | Defines operational profile (`production` vs `development`) | Set to `production` in Render dashboard |
| `PORT` | **Automatic** | Port number on which Uvicorn binds | Provided dynamically by Render (e.g. `10000`) |
| `ALLOWED_ORIGINS` | Optional | Comma-delimited list of CORS allowed domains | Set to your Vercel/custom frontend domain |
| `PGPASSWORD` | Optional | Password fallback if `psql` command was pasted in `DATABASE_URL` | Supabase Database Password |
| `SUPABASE_URL` | Optional | Base REST endpoint for direct Supabase client calls | Supabase Dashboard -> API -> URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Administrative service key (server-side only) | Supabase Dashboard -> API -> service_role |
| `SUPABASE_JWT_SECRET` | Optional | Secret key to verify user auth tokens | Supabase Dashboard -> API -> JWT Secret |
| `THREAT_INTELLIGENCE_API_KEY` | Optional | External API key for VirusTotal or SafeBrowsing | Security vendor portals |

*(Template available at [`backend/.env.production.example`](file:///e:/ALL%20HACKTHONS/HackFusion-2.0-APP/backend/.env.production.example))*

---

## 5. Render Service Configuration

In your **Render Dashboard** (Web Service settings):

- **Environment:** `Python 3`
- **Root Directory:** `backend` (or leave empty if using root `requirements.txt`)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Important Render Settings:
1. Ensure the Web Service uses port `$PORT` via the start command flag `--port $PORT`.
2. Do not hardcode `localhost` or port `8000` in production settings.

---

## 6. FastAPI Lifespan & Non-Blocking Database Initialization

In legacy deployments, synchronous database connection attempts during module import or blocking in startup events caused Render's 60-second port scan timer to expire.

### Implemented Fix in `backend/app/main.py`:
- Database engine creation never raises unhandled exceptions during Python module import.
- When the service boots, Uvicorn enters the async `lifespan`:
  ```python
  @asynccontextmanager
  async def lifespan(app: FastAPI):
      print(f"[{settings.PROJECT_NAME}] Starting server on port {settings.PORT}...")
      # Schema verification runs in worker thread so HTTP port binding is instantaneous
      import asyncio
      asyncio.create_task(asyncio.to_thread(init_db))
      yield
      # Graceful shutdown
      close_db()
  ```
- **Port Binding:** Instantaneous (< 100ms), satisfying Render's port scan immediately.
- **Connection Liveness:** Pool recycle is set to 300 seconds with `pool_pre_ping=True` and a 5-second connection timeout, eliminating hanging sockets.

---

## 7. Health Check Verification Endpoint

The active health check route is mounted at:
```http
GET /api/v1/health
```

### When Database is Healthy & Connected:
```json
{
  "status": "healthy",
  "service": "SignalSafe Campus API",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-10-31T03:45:00.000000Z",
  "database": "connected",
  "database_status": "Database connection active and responsive"
}
```

### When Database Credentials Need Configuration in Render:
```json
{
  "status": "degraded",
  "service": "SignalSafe Campus API",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-10-31T03:45:00.000000Z",
  "database": "disconnected",
  "database_status": "Environment variable 'DATABASE_URL' contains a psql terminal command...",
  "config_guidance": "Verify that DATABASE_URL in Render Dashboard is set to a valid SQLAlchemy URI: postgresql+psycopg://postgres.wevmeqdidigchvkxmgkf:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
}
```

---

## 8. Security Checklist

- [x] **No Secrets in Source:** `.env` and sensitive credentials are listed in `.gitignore`.
- [x] **Masked Logging:** Passwords are scrubbed from logs via `_mask_url()` using SQLAlchemy URL rendering (`hide_password=True`).
- [x] **SSL Mode Enforced:** `sslmode=require` is auto-appended to remote PostgreSQL hosts.
- [x] **CORS Filtering:** Restricted to configured production frontend origins and institutional subdomains.
- [x] **No Fallback to SQLite in Production:** Production environments reject unconfigured states with clear guidance instead of creating ephemeral local files.

---

## 9. Troubleshooting Guide

### Issue A: "Port scan timeout reached, no open ports detected"
- **Cause:** Previous code crashed on module import or stalled during synchronous database connection.
- **Solution:** Fully resolved by moving engine initialization to non-crashing safe factory and running schema verification asynchronously.

### Issue B: "Could not parse database URL: psql -h ..."
- **Cause:** Copying the terminal CLI string from the Supabase dashboard instead of the URI tab.
- **Solution:** 
  1. Open Render Dashboard -> Web Service -> **Environment**.
  2. Find `DATABASE_URL`.
  3. Replace `psql -h aws-1-eu-west-3.pooler.supabase.com ...` with:
     `postgresql+psycopg://postgres.wevmeqdidigchvkxmgkf:YOUR_PASSWORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`
  4. Click **Save Changes** (Render will auto-redeploy).

---

## 10. Deployment & Rollback Procedure

1. **Deploying Updates:**
   - Commit changes to `master` and push to GitHub:
     ```bash
     git push origin master
     git push origin master:main
     ```
   - Render automatically triggers the build via GitHub webhook.
2. **Rollback:**
   - In Render Dashboard -> **Deploys** -> select any prior successful deploy and click **Rollback**.

