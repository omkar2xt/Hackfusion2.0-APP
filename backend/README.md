# SignalSafe Campus – FastAPI Backend Platform

Unified campus cybersecurity REST API engine providing URL threat detection, phishing text analysis, QR verification, and campus incident management.

---

## 🛠 Technology Stack

- **Python 3.12+**
- **FastAPI** (High-performance async ASGI web framework)
- **Pydantic v2** (Type validation and schemas)
- **SQLAlchemy 2.0 + aiosqlite / asyncpg** (Async database ORM)
- **PyJWT** (Supabase Auth Bearer token verification)
- **Pytest** (Automated endpoint & engine testing suite)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at **http://localhost:8000/docs**.

---

## 🛡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health monitoring & service status |
| `POST` | `/api/v1/scan/url` | URL threat inspection (IP, Punycode, Typosquatting, Ports) |
| `POST` | `/api/v1/scan/message` | Phishing SMS/email message analysis |
| `POST` | `/api/v1/scan/qr` | Safe QR target analysis without browser auto-opening |
| `POST` | `/api/v1/incidents` | Submit a new cybersecurity incident report |
| `GET` | `/api/v1/incidents` | List user's incidents (or all for security admins) |
| `GET` | `/api/v1/incidents/{id}` | Retrieve incident details and investigation timeline |
| `PATCH` | `/api/v1/incidents/{id}` | Update incident status (`SUBMITTED` ➔ `TRIAGED` ➔ `INVESTIGATING` ➔ `RESOLVED`) |
| `GET` | `/api/v1/dashboard/stats` | Aggregated threat telemetry and recent activity feed |

---

## 🔒 Security Architecture

1. **Zero SSRF:** The server never makes outbound HTTP requests to user-submitted domains.
2. **Explainable Threat Engine:** Real heuristic parsing (IP host, punycode, unusual ports, brand spoofing, urgency traps, credential harvesting patterns).
3. **Multi-Tenant Access Control:** Incidents are protected by user ownership; only security administrators can modify triage states.
4. **CORS:** Configured for local development (`http://localhost:5173`) and Vercel production preview URLs (`*.vercel.app`).
