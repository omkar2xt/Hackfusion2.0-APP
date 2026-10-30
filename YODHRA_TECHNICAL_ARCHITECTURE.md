# YODHRA — Complete Technical Architecture Documentation
**Campus Cyber Intelligence Platform (Defend • Detect • Respond)**
*Version 2.4.0 — Enterprise Architecture Specification*

---

## Executive Summary & System Overview

**YODHRA** (formerly *SignalSafe Campus*) is a specialized campus cyber defense, threat intelligence, and emergency incident response platform built for universities and educational institutions. It unifies client-side threat interception (URLs, messages, QR codes), an automated multi-vector heuristic risk scoring engine, campus threat campaign correlation (Threat DNA), an institutional trust directory, offline-first forensic incident reporting, and an authenticated emergency **RED ALERT** broadcast relay system operating across campus proximity meshes.

### Core Architectural Metrics
- **Frontend Stack:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Tailwind CSS 4.3.3, React Router v7.
- **Backend Stack:** Python 3.14+, FastAPI 0.110+, SQLAlchemy 2.0.28, Pydantic v2, PyJWT, HTTPX.
- **Database Engine:** Dual-mode SQLAlchemy (SQLite with `aiosqlite` for local dev; PostgreSQL with Supabase for cloud deployment).
- **Verified Endpoints:** 41 distinct RESTful API endpoints across 13 routing controllers under `/api/v1`.
- **Database Entities:** 20 relational models with normalized multi-tier institutional hierarchy.
- **Test Suite:** 10 automated unit/integration tests running via `pytest` (100% pass rate).

---

## 1. Frontend File and Folder Structure

### 1.1 Technology Stack & Versions
| Package / Dependency | Version | Role / Responsibility |
|---|---|---|
| `react` | `^19.3.1` | Core declarative UI rendering engine |
| `react-dom` | `^19.3.1` | DOM mounting and client lifecycle management |
| `react-router-dom` | `^7.18.5` | Client-side routing, route navigation, and deep linking |
| `typescript` | `~7.0.2` | Static type safety and contract enforcement |
| `vite` | `^8.3.5` | Build tooling, ESM bundler, and development HMR server |
| `@tailwindcss/vite` | `^4.3.3` | Tailwind CSS v4 JIT engine integration |
| `tailwindcss` | `^4.3.3` | Utility-first styling framework |
| `lucide-react` | `^1.65.0` | Comprehensive cybersecurity and UI icon set |
| `html5-qrcode` | `^2.3.8` | In-browser camera QR video stream capture and decoder |
| `@supabase/supabase-js` | `^2.118.0` | Supabase Authentication and PostgreSQL client |
| `oxlint` | `^1.89.0` | High-performance JavaScript/TypeScript linter |

---

### 1.2 Directory Tree (`mobile-pwa/`)

```text
mobile-pwa/
├── index.html                           # Single-page application shell, viewport & PWA meta tags
├── package.json                         # Dependencies, scripts, and build metadata
├── vite.config.ts                       # Vite build configuration with Tailwind plugin
├── tsconfig.json                        # Root TypeScript project references configuration
├── tsconfig.app.json                    # Application-specific compiler flags (strict mode)
├── tsconfig.node.json                   # Vite server node environment compiler configuration
├── .env.example                         # Template environment variables (VITE_API_BASE_URL)
├── public/
│   ├── favicon.svg                      # Legacy SVG favicon
│   ├── logo-icon.jpg                    # High-res official YODHRA emblem (squircle app icon)
│   ├── logo-full.jpg                    # Full YODHRA Cyber Intelligence branding banner
│   ├── manifest.webmanifest             # W3C Web App Manifest for installable PWA
│   ├── sw.js                            # Service worker for offline shell & caching strategies
│   └── icons/
│       ├── icon-192.svg                 # Android home screen icon
│       └── icon-512.svg                 # High-DPI splash and store icon
└── src/
    ├── main.tsx                         # Client application entry point (DOM render root)
    ├── App.tsx                          # Core router definitions, layout wrapper, Red Alert banner
    ├── App.css                          # Application-level CSS rules
    ├── index.css                        # Tailwind v4 imports, dark palette base, scrollbar hiding
    ├── assets/
    │   ├── logo-icon.jpg                # Bundled YODHRA emblem
    │   ├── logo-full.jpg                # Bundled YODHRA brand banner
    │   ├── hero.png                     # Visual hero illustration
    │   ├── react.svg                    # React logo
    │   └── vite.svg                     # Vite logo
    ├── components/
    │   ├── Logo.tsx                     # Reusable brand logo component (sm, md, lg, xl sizes)
    │   ├── Header.tsx                   # Sticky responsive header with mobile navigation drawer
    │   ├── BottomNav.tsx                # Mobile 5-tab persistent bottom bar
    │   ├── EmergencyAlertBanner.tsx     # Live Red Alert broadcast banner & protocol modal
    │   ├── IncidentTimeline.tsx         # SOC case lifecycle progress bar (Submitted -> Resolved)
    │   ├── CyberSafetyAssistant.tsx     # Contextual educational breakdown based on threat category
    │   ├── QuickActionCard.tsx          # Dashboard launcher cards (Scan, QR, Reports, Radar)
    │   ├── ScanResultCard.tsx           # Comprehensive threat analysis result card
    │   ├── StatCard.tsx                 # Metric metric counters with status indicators
    │   ├── StatusBadge.tsx              # Normalized severity and lifecycle status pill tags
    │   ├── LoadingSpinner.tsx           # Asynchronous loading spinner with cyber theme
    │   ├── ErrorState.tsx               # API and network failure display with retry handlers
    │   └── EmptyState.tsx               # Fallback visual when no incidents/scans exist
    ├── contexts/
    │   └── AuthContext.tsx              # Supabase auth state, user session, demo accounts
    ├── hooks/
    │   ├── useAuth.ts                   # Custom hook consuming AuthContext
    │   ├── useIncidents.ts              # Incident query, creation, and filter management hook
    │   └── useScan.ts                   # URL, text, and QR scanner execution state hook
    ├── pages/
    │   ├── WelcomePage.tsx              # Splash landing with animated YODHRA crest
    │   ├── LoginPage.tsx                # Email/password authentication & 1-click Demo roles
    │   ├── SignupPage.tsx               # Incident responder account registration
    │   ├── ForgotPasswordPage.tsx       # Password reset request screen
    │   ├── DashboardPage.tsx            # Central SOC posture, quick actions & threat indicators
    │   ├── ScanPage.tsx                 # Real-time URL and text phishing scanner workspace
    │   ├── QrScannerPage.tsx            # Camera QR code analyzer with tamper detection
    │   ├── ReportPage.tsx               # 3-step offline-first incident report creator
    │   ├── MyReportsPage.tsx            # Searchable, filterable campus incident directory
    │   ├── IncidentDetailPage.tsx       # Enterprise SOC Case Management & forensic dossier
    │   ├── ProfilePage.tsx              # Account hierarchy, device relay & registered nodes
    │   ├── RadarPage.tsx                # Threat cartography, proximity mesh & Red Alert dispatch
    │   ├── ThreatDnaPage.tsx            # Campaign clustering, signature hashes & DNA matching
    │   ├── TrustGraphPage.tsx           # Institutional authority registry & lookalike detector
    │   └── CoachPage.tsx                # SOC investigation workspace & NIST readiness dossier
    ├── services/
    │   ├── api.ts                       # Central API client for all 41 FastAPI backend endpoints
    │   └── supabase.ts                  # Supabase SDK client initialization and config
    ├── types/
    │   └── index.ts                     # Comprehensive TypeScript interfaces and entity types
    └── utils/
        ├── helpers.ts                   # Date formatters, risk calculators, URL validators
        └── offlineQueue.ts              # IndexedDB/localStorage encrypted offline draft storage
```

---

### 1.3 Module Interaction & Architecture

```mermaid
graph TD
    User["Campus User / SOC Analyst"] -->|Interacts| UI["React 19 View Layer"]
    UI --> Router["React Router v7 (App.tsx)"]
    Router --> Pages["Pages (15 Specialized Views)"]
    
    Pages --> HeaderComp["Header & Drawer (Header.tsx)"]
    Pages --> BannerComp["Emergency Alert Banner (EmergencyAlertBanner.tsx)"]
    Pages --> ViewComponents["UI Components (Logo, Badges, Cards, Timelines)"]
    
    Pages --> Hooks["Custom Hooks (useAuth, useIncidents, useScan)"]
    Hooks --> Contexts["AuthContext (Supabase / Demo)"]
    Hooks --> APIService["API Service Layer (api.ts)"]
    Pages --> APIService
    
    APIService -->|Local Drafts| OfflineStorage["Offline Queue (localStorage / IndexedDB)"]
    APIService -->|REST / Bearer Token| FastAPIServer["FastAPI Backend (Port 8000)"]
    Contexts -->|Auth Session| SupabaseCloud["Supabase Auth / PostgreSQL"]
```

---

## 2. System Architecture and Data Flow

### 2.1 Complete Architectural Topology

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Tier (React PWA)"]
        Browser["Mobile / Desktop Web Browser"]
        SW["Service Worker (sw.js Cache)"]
        LocalQueue["Offline Incident Store (localStorage)"]
        PWA_UI["YODHRA React 19 Frontend"]
    end

    subgraph APILayer ["API Routing & Security Gateway (FastAPI)"]
        CORS["CORS Middleware (Whitelist Origins)"]
        AuthHandler["Security Middleware (JWT / Supabase Auth)"]
        RouterHub["API Router Registry (/api/v1/*)"]
    end

    subgraph ServiceLayer ["Core Threat Intelligence & Business Services"]
        URLService["URL Analyzer (url_analyzer.py)"]
        MsgService["Message Analyzer (message_analyzer.py)"]
        QRService["QR Guardian Service (qr_guardian_service.py)"]
        RiskEngine["Explainable Risk Engine (risk_engine.py)"]
        DNAEngine["Threat DNA Service (threat_dna_service.py)"]
        RadarEngine["Cyber Radar Service (cyber_radar_service.py)"]
        TrustService["Trust Graph Service (trust_graph_service.py)"]
        AlertService["Alert & Device Relay (alert_and_device_service.py)"]
        IncidentService["Incident & SOC Service (incident_service.py)"]
        TimelineService["Forensic Timeline Service (timeline_service.py)"]
    end

    subgraph DataLayer ["Persistence Tier (SQLAlchemy ORM)"]
        Session["Synchronous Session Manager (session.py)"]
        SQLiteDB["SQLite Database (signalsafe.db - Local Dev)"]
        SupaPostgres["Supabase PostgreSQL (Production Target)"]
    end

    Browser --> PWA_UI
    PWA_UI <--> SW
    PWA_UI <--> LocalQueue
    PWA_UI -->|HTTP Fetch / JSON| CORS
    CORS --> AuthHandler
    AuthHandler --> RouterHub

    RouterHub --> URLService & MsgService & QRService
    RouterHub --> DNAEngine & RadarEngine & TrustService
    RouterHub --> AlertService & IncidentService & TimelineService

    URLService & MsgService & QRService --> RiskEngine
    IncidentService --> DNAEngine
    IncidentService --> TimelineService

    ServiceLayer --> Session
    Session --> SQLiteDB
    Session -.->|Production Connection| SupaPostgres
```

---

### 2.2 Sequence Flows by Operation

#### Flow 1: URL Threat Scanning & Risk Scoring
1. User enters URL in `ScanPage.tsx`.
2. Client calls `api.scanUrl({ url })` $\rightarrow$ `POST /api/v1/scan/url`.
3. `url_analyzer.py` decomposes the target:
   - Validates RFC-compliant syntax.
   - Checks IP-literal address formatting (e.g. `http://192.168.1.1:8080`).
   - Identifies suspicious TLDs (`.xyz`, `.top`, `.tk`, `.ru`, `.cn`).
   - Detects brand impersonation keywords (`login`, `verify`, `secure`, `bursar`, `sso`).
   - Flags URL shortening services and multiple subdomain chains.
4. `risk_engine.py` aggregates weights into an explainable score ($0 - 100$) and verdict (`CONFIRMED_MALICIOUS`, `SUSPICIOUS`, `LOW_RISK`).
5. Scan record is persisted in `scans` table via `ScanModel`.
6. Client receives response and renders `ScanResultCard.tsx` with mitigation steps.

#### Flow 2: Incident Reporting & Offline Synchronization
1. User submits report via `ReportPage.tsx`.
2. Browser evaluates `navigator.onLine`:
   - **If Online:** Dispatches `POST /api/v1/incidents`.
   - **If Offline:** Encrypts report payload into browser local sandbox queue (`offlineQueue.ts`).
3. When network reconnects, background sync listener drains the queue and issues batch submissions.
4. `incident_service.py` records incident in `incidents` table, logs an immutable entry in `incident_timeline`, and invokes `threat_dna_service.py` to auto-link matching campaign clusters.

#### Flow 3: Emergency RED ALERT Broadcast & Authenticated Device Relay
1. SOC Analyst opens Red Alert Dispatcher in `RadarPage.tsx` or Header Command modal.
2. Form submits target proximity zone, category, severity, and instructions.
3. Client dispatches `POST /api/v1/alerts/broadcast` (restricted to administrative sessions).
4. `alert_and_device_service.py`:
   - Creates `EmergencyAlertModel` record with status `ACTIVE`.
   - Queries `device_registrations` matching target proximity zone.
   - Spawns `AlertDeliveryModel` records with delivery status `ACCEPTED`.
   - Writes immutable entry to `audit_logs`.
5. Connected PWA terminals query `GET /api/v1/alerts/active?device_id=...` via `EmergencyAlertBanner.tsx`.
6. Blinking red alert banner prompts the user to read instructions and click "Acknowledge".
7. Client dispatches `POST /api/v1/alerts/{id}/acknowledge` sending unique `device_id`.
8. Server computes SHA-256 cryptographic audit hash, updates delivery status to `ACKNOWLEDGED`, increments `acknowledged_count`, and returns audit proof to the client.

---

## 3. Backend API Integration Specification

The FastAPI application mounts 13 dedicated routers under the versioned prefix `/api/v1`.

### 3.1 Implemented Endpoints Matrix

| HTTP Method | API Route | Purpose | Authentication | Minimum Role | Database Models | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/health` | Service health, DB connectivity & uptime | Public | Anyone | None | Global Health Checks | **IMPLEMENTED** |
| `POST` | `/api/v1/scan/url` | Heuristic URL safety & reputation scan | Optional | Student / Staff | `ScanModel` | `ScanPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/scan/message` | Phishing & social engineering NLP scan | Optional | Student / Staff | `ScanModel` | `ScanPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/scan/qr` | Decoded QR link inspection | Optional | Student / Staff | `ScanModel` | `QrScannerPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/qr-guardian/analyze` | Quishing & tamper analysis against registry | Optional | Student / Staff | `VerifiedQrDestinationModel` | `QrScannerPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/qr-guardian/verified-destinations` | List officially verified QR codes | Optional | Student / Staff | `VerifiedQrDestinationModel` | `QrScannerPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/qr-guardian/admin/registry` | Register official campus QR code | Required | Admin | `VerifiedQrDestinationModel` | Admin Tools | **IMPLEMENTED** |
| `DELETE` | `/api/v1/qr-guardian/admin/registry/{id}` | Remove verified QR destination | Required | Admin | `VerifiedQrDestinationModel` | Admin Tools | **IMPLEMENTED** |
| `GET` | `/api/v1/dashboard/stats` | High-level metrics for dashboard cards | Optional | Student / Staff | `ScanModel`, `IncidentModel` | `DashboardPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/incidents` | Submit new campus incident report | Optional | Student / Staff | `IncidentModel`, `IncidentTimelineModel` | `ReportPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/incidents` | List reports with status/category filters | Optional | Student / Staff | `IncidentModel` | `MyReportsPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/incidents/{id}` | Retrieve incident details and analysis | Optional | Student / Staff | `IncidentModel` | `IncidentDetailPage.tsx` | **IMPLEMENTED** |
| `PATCH` | `/api/v1/incidents/{id}` | Update SOC triage status or resolution notes | Required | Admin / Staff | `IncidentModel`, `IncidentTimelineModel` | `IncidentDetailPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/incidents/{id}/actions/quarantine` | Execute containment action (DNS sinkhole) | Required | Admin | `IncidentModel`, `IncidentTimelineModel` | `IncidentDetailPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/incidents/{id}/timeline` | Retrieve immutable milestone events | Optional | Student / Staff | `IncidentTimelineModel` | `IncidentDetailPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/incidents/{id}/export` | Export SHA-256 signed forensic dossier | Optional | Student / Staff | `IncidentModel`, `IncidentTimelineModel` | `IncidentDetailPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/threat-dna/analyze` | Extract threat fingerprint & cluster | Optional | Student / Staff | `ThreatFingerprintModel` | `ThreatDnaPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/threat-dna/campaigns` | List active correlated attack campaigns | Optional | Student / Staff | `ThreatCampaignModel` | `ThreatDnaPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/threat-dna/campaigns/{id}` | Inspect campaign incidents & IOC patterns | Optional | Student / Staff | `ThreatCampaignModel` | `ThreatDnaPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/threat-dna/campaigns/{id}/review` | Review & change campaign confidence | Required | Admin | `ThreatCampaignModel` | `ThreatDnaPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/cyber-radar/overview` | Aggregated campus threat map & trends | Optional | Student / Staff | `IncidentModel`, `ScanModel` | `RadarPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/cyber-radar/exposure` | Departmental vulnerability assessments | Optional | Student / Staff | `IncidentModel` | `RadarPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/cyber-radar/proximity-alerts` | Retrieve radar alerts within active zone | Optional | Student / Staff | Mock / In-Memory | `RadarPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/cyber-radar/broadcast-alert` | Dispatch radar zone alert | Required | Admin | `AuditLogModel` | `RadarPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/trust-graph/identities` | List verified campus departments & portals | Optional | Student / Staff | `InstitutionalIdentityModel` | `TrustGraphPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/trust-graph/verify` | Verify claimed sender against lookalikes | Optional | Student / Staff | `InstitutionalIdentityModel` | `TrustGraphPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/trust-graph/admin/identities` | Add official department identity to graph | Required | Admin | `InstitutionalIdentityModel` | Admin Tools | **IMPLEMENTED** |
| `GET` | `/api/v1/immune/warnings` | Retrieve automated campus safety bulletins | Optional | Student / Staff | `CampusWarningModel` | Dashboard / Immune | **IMPLEMENTED** |
| `POST` | `/api/v1/immune/admin/warnings` | Publish new warning bulletin | Required | Admin | `CampusWarningModel` | Admin Tools | **IMPLEMENTED** |
| `GET` | `/api/v1/coach/modules` | List interactive security assessment modules | Optional | Student / Staff | `LearningModuleModel` | `CoachPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/coach/modules/{slug}` | Retrieve specific training scenario & quiz | Optional | Student / Staff | `LearningModuleModel`, `QuizQuestionModel` | `CoachPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/coach/quiz/submit` | Grade assessment answers & return feedback | Optional | Student / Staff | `LearningProgressModel` | `CoachPage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/coach/progress` | Get user readiness metrics & badges | Optional | Student / Staff | `LearningProgressModel` | `CoachPage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/devices/register` | Register/heartbeat device session & zone | Required | Student / Staff | `DeviceRegistrationModel` | `ProfilePage.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/devices` | List registered devices for current user | Required | Student / Staff | `DeviceRegistrationModel` | `ProfilePage.tsx` | **IMPLEMENTED** |
| `DELETE` | `/api/v1/devices/{id}` | Revoke device registration from mesh | Required | Student / Staff | `DeviceRegistrationModel` | `ProfilePage.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/alerts/broadcast` | Broadcast emergency Red Alert to mesh | Required | Admin / Staff | `EmergencyAlertModel`, `AlertDeliveryModel`, `AuditLogModel` | `RadarPage.tsx` / Modal | **IMPLEMENTED** |
| `GET` | `/api/v1/alerts/active` | Retrieve active Red Alerts for device | Optional | Student / Staff | `EmergencyAlertModel`, `AlertDeliveryModel` | `EmergencyAlertBanner.tsx` | **IMPLEMENTED** |
| `POST` | `/api/v1/alerts/{id}/acknowledge` | Record authenticated user acknowledgment | Optional | Student / Staff | `EmergencyAlertModel`, `AlertDeliveryModel`, `AuditLogModel` | `EmergencyAlertBanner.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/alerts/{id}/deliveries` | Real-time mesh delivery & ack counters | Optional | Student / Staff | `EmergencyAlertModel`, `AlertDeliveryModel` | `EmergencyAlertBanner.tsx` | **IMPLEMENTED** |
| `GET` | `/api/v1/alerts/hierarchy/tree` | Full multi-tier institutional tree | Optional | Student / Staff | `InstitutionModel`, `CampusModel`, `DepartmentModel`, `UserGroupModel` | `ProfilePage.tsx` | **IMPLEMENTED** |

---

### 3.2 Key Request & Response Schemas

#### URL Scan (`POST /api/v1/scan/url`)
```json
// Request
{
  "url": "http://192.168.1.10:8080/campus-sso/login.php"
}

// Response (HTTP 200)
{
  "id": "78fc4a2b-2f61-46da-bf41-479cf8bf2e2b",
  "input_type": "url",
  "input_value": "http://192.168.1.10:8080/campus-sso/login.php",
  "verdict": "CONFIRMED_MALICIOUS",
  "risk_level": "CRITICAL RISK",
  "risk_score": 95,
  "scoring_version": "v2.0-explainable",
  "indicators": [
    "Target uses raw IP address instead of domain hostname",
    "Non-standard HTTP web port detected (:8080)",
    "Critical campus brand impersonation keywords detected (sso, login)"
  ],
  "recommendations": [
    "Do NOT proceed or submit institutional credentials to this destination.",
    "Block destination hostname in campus DNS resolvers.",
    "Report incident to Campus Incident Response Team."
  ],
  "checked_at": "2026-10-30T13:45:00Z"
}
```

#### Broadcast Red Alert (`POST /api/v1/alerts/broadcast`)
```json
// Request
{
  "target_zone": "Engineering & CS Quad (150m Proximity Mesh)",
  "category": "Rogue Wi-Fi Access Point",
  "title": "URGENT: Rogue Wi-Fi Spoofing Campus Authentication",
  "message": "Do not connect to 'Campus-Free-Wifi'. Unencrypted credential sniffer active.",
  "severity": "CRITICAL",
  "action_instructions": "Disconnect immediately. Verify SSL certificates before logging in.",
  "delivery_scope": "PROXIMITY_MESH",
  "expires_in_hours": 24
}

// Response (HTTP 201)
{
  "id": "c1f7b82e-9d21-4f10-9118-86d528b9a19c",
  "institution_id": "inst-apex-01",
  "campus_id": "camp-main-01",
  "department_id": null,
  "target_zone": "Engineering & CS Quad (150m Proximity Mesh)",
  "category": "Rogue Wi-Fi Access Point",
  "severity": "CRITICAL",
  "title": "URGENT: Rogue Wi-Fi Spoofing Campus Authentication",
  "message": "Do not connect to 'Campus-Free-Wifi'. Unencrypted credential sniffer active.",
  "action_instructions": "Disconnect immediately. Verify SSL certificates before logging in.",
  "status": "ACTIVE",
  "delivery_scope": "PROXIMITY_MESH",
  "target_device_count": 3,
  "acknowledged_count": 0,
  "broadcast_by": "Austin McDaniel (Incident Lead)",
  "broadcast_by_role": "security_admin",
  "is_acknowledged": false,
  "expires_at": "2026-10-31T13:45:00Z",
  "created_at": "2026-10-30T13:45:00Z"
}
```

---

## 4. Database Schema and Relationships

### 4.1 Verified Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    INSTITUTIONS ||--o{ CAMPUSES : contains
    CAMPUSES ||--o{ DEPARTMENTS : operates
    DEPARTMENTS ||--o{ USER_GROUPS : organizes
    DEPARTMENTS ||--o{ DEVICE_REGISTRATIONS : locates
    
    DEVICE_REGISTRATIONS ||--o{ ALERT_DELIVERIES : receives
    EMERGENCY_ALERTS ||--o{ ALERT_DELIVERIES : tracks
    
    INCIDENTS ||--o{ INCIDENT_TIMELINE : audits
    INCIDENTS ||--o{ THREAT_FINGERPRINTS : derives
    INCIDENTS ||--o{ CAMPAIGN_INCIDENTS : joins
    THREAT_CAMPAIGNS ||--o{ CAMPAIGN_INCIDENTS : clusters
    THREAT_CAMPAIGNS ||--o{ CAMPUS_WARNINGS : triggers
    
    LEARNING_MODULES ||--o{ QUIZ_QUESTIONS : tests
    LEARNING_MODULES ||--o{ LEARNING_PROGRESS : tracks

    INSTITUTIONS {
        string id PK
        string name
        string code
        string domain
        datetime created_at
    }

    CAMPUSES {
        string id PK
        string institution_id FK
        string name
        string code
        string location
        datetime created_at
    }

    DEPARTMENTS {
        string id PK
        string campus_id FK
        string name
        string code
        string head_of_department
        datetime created_at
    }

    USER_GROUPS {
        string id PK
        string department_id FK
        string name
        string role_type
        text description
        datetime created_at
    }

    DEVICE_REGISTRATIONS {
        string id PK
        string user_id
        string institution_id
        string campus_id
        string department_id
        string device_platform
        string device_name
        text push_token
        string ip_address
        string proximity_zone
        boolean is_active
        datetime last_active_at
        datetime registered_at
    }

    EMERGENCY_ALERTS {
        string id PK
        string institution_id
        string campus_id
        string target_zone
        string category
        string severity
        string title
        text message
        text action_instructions
        string status
        string delivery_scope
        int target_device_count
        int acknowledged_count
        string broadcast_by
        datetime expires_at
        datetime created_at
    }

    ALERT_DELIVERIES {
        string id PK
        string alert_id FK
        string device_id FK
        string user_id
        string delivery_status
        datetime delivered_at
        datetime acknowledged_at
        string device_ack_hash
        datetime created_at
    }

    INCIDENTS {
        string id PK
        string user_id
        string category
        string severity
        string status
        text description
        text suspicious_content
        string department
        text resolution_notes
        datetime created_at
        datetime updated_at
    }

    INCIDENT_TIMELINE {
        string id PK
        string incident_id FK
        string event_type
        string actor_id
        text description
        json metadata_json
        datetime created_at
    }

    THREAT_CAMPAIGNS {
        string id PK
        string name
        string primary_theme
        string severity
        string status
        float confidence_score
        int incident_count
        datetime first_seen
        datetime last_seen
    }

    AUDIT_LOGS {
        string id PK
        string actor_id
        string action
        string resource_type
        string resource_id
        json details
        datetime created_at
    }
```

---

### 4.2 Verified Database Tables Catalog

1. **`institutions`**: Multi-tenant institutional roots (`id`, `name`, `code`, `domain`, `created_at`).
2. **`campuses`**: Physical campus subdivisions (`id`, `institution_id`, `name`, `code`, `location`, `created_at`).
3. **`departments`**: Academic and administrative operational units (`id`, `campus_id`, `name`, `code`, `head_of_department`, `created_at`).
4. **`user_groups`**: Functional user divisions (`id`, `department_id`, `name`, `role_type`, `description`, `created_at`).
5. **`device_registrations`**: PWA client hardware tokens and proximity zone mapping (`id`, `user_id`, `device_platform`, `device_name`, `push_token`, `proximity_zone`, `is_active`, `last_active_at`, `registered_at`).
6. **`emergency_alerts`**: High-priority campus bulletins (`id`, `target_zone`, `category`, `severity`, `title`, `message`, `action_instructions`, `status`, `delivery_scope`, `target_device_count`, `acknowledged_count`, `broadcast_by`, `expires_at`, `created_at`).
7. **`alert_deliveries`**: Device delivery lifecycle state machine (`id`, `alert_id`, `device_id`, `user_id`, `delivery_status`, `delivered_at`, `acknowledged_at`, `device_ack_hash`, `created_at`).
8. **`scans`**: Historical IOC threat scans (`id`, `user_id`, `input_type`, `input_value`, `verdict`, `risk_level`, `risk_score`, `scoring_version`, `indicators`, `recommendations`, `checked_at`).
9. **`incidents`**: Reported cyber events (`id`, `user_id`, `category`, `severity`, `status`, `description`, `suspicious_content`, `department`, `resolution_notes`, `created_at`, `updated_at`).
10. **`incident_timeline`**: Immutable cryptographic milestone log (`id`, `incident_id`, `event_type`, `actor_id`, `description`, `metadata_json`, `created_at`).
11. **`threat_fingerprints`**: Structural token and domain hashes for campaign clustering (`id`, `incident_id`, `scan_id`, `domain_normalized`, `url_structure_hash`, `content_tokens`, `claimed_sender`, `fingerprint_hash`, `feature_vector`, `created_at`).
12. **`threat_campaigns`**: Correlated attack waves (`id`, `name`, `primary_theme`, `severity`, `status`, `confidence_score`, `incident_count`, `description`, `notes`, `first_seen`, `last_seen`, `created_at`, `updated_at`).
13. **`campaign_incidents`**: Many-to-many join entity between campaigns and incidents (`id`, `campaign_id`, `incident_id`, `similarity_score`, `match_reasons`, `added_at`).
14. **`verified_qr_destinations`**: Whitelist of official campus QR notices (`id`, `title`, `destination_url`, `category`, `department`, `created_by`, `is_active`, `created_at`).
15. **`institutional_identities`**: Official campus authority records for lookalike detection (`id`, `name`, `role_title`, `department`, `official_email`, `official_phone`, `verified_domain`, `official_portal_url`, `verified_payment_portal`, `is_active`, `created_at`).
16. **`campus_warnings`**: Immune system broadcast advisories (`id`, `campaign_id`, `title`, `content`, `severity`, `status`, `approved_by`, `published_at`).
17. **`learning_modules`**: Educational training modules (`id`, `slug`, `title`, `category`, `description`, `estimated_minutes`, `content_markdown`, `icon_name`, `order_index`).
18. **`quiz_questions`**: Assessment questions associated with training modules (`id`, `module_id`, `question_text`, `options_json`, `correct_index`, `explanation`).
19. **`learning_progress`**: User test submissions and compliance scoring (`id`, `user_id`, `module_id`, `completed`, `quiz_score`, `completed_at`).
20. **`audit_logs`**: Administrative SOC audit trail (`id`, `actor_id`, `action`, `resource_type`, `resource_id`, `details`, `created_at`).

---

## 5. Authentication, Security, Notifications & Deployment

### 5.1 Authentication Architecture
- **Supabase Auth & JWT Tokens:** Authentication runs natively against Supabase Auth (`@supabase/supabase-js`). Upon login, the client receives a JWT signed with `SUPABASE_JWT_SECRET`.
- **Backend Bearer Interceptor (`app/core/security.py`):**
  - Extracts token from `Authorization: Bearer <token>`.
  - When `SUPABASE_JWT_SECRET` is configured, verifies HS256 signature and audience (`authenticated`).
  - Fallback mode allows developer / unverified payload extraction for local development environments without failing mock sessions.
- **RBAC (Role-Based Access Control):**
  - Roles: `student`, `staff`, `security_admin`.
  - Sensitive endpoints (e.g., `PATCH /api/v1/incidents/{id}`, `POST /api/v1/alerts/broadcast`) execute `get_current_admin()`, rejecting non-privileged actors with `HTTP 403 Forbidden`.
- **Demo Mode Bypass:** The client provides instant demo authentication toggling between "Campus Student" (`student@campus.edu`) and "Security Incident Lead" (`admin@campus.edu`).

---

### 5.2 Application Security & Hardening Controls
- **CORS Protection:** Configured in `app/main.py` allowing specific frontend origins (`localhost:5173`, `localhost:3000`) and regex-matching production Vercel domains (`r"^https://.*\.vercel\.app$"`).
- **SQL Injection Prevention:** 100% parameterization enforced via SQLAlchemy ORM; zero raw string SQL concatenation.
- **SSRF Hardening (URL Analyzer):** `url_analyzer.py` inspects IP literals, private RFC 1918 addresses (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), loopback addresses (`127.0.0.1`), and AWS metadata endpoints (`169.254.169.254`), flagging them as high-risk before any outbound request can be made.
- **Immutable Milestones & Audit Trails:** Every triage transition, quarantine execution, and alert broadcast inserts a timestamped record in `audit_logs` and `incident_timeline`.
- **Zero Sensitive Incident Caching:** The service worker explicitly bypasses caching for all `/api/v1/*` routes using a Network-Only / Network-First policy, preventing incident leakage on shared campus computer terminals.

---

### 5.3 Notifications & Emergency Red Alert Relay
- **Notification Delivery Mechanism:** Dual-mode design:
  1. **In-App Proximity Mesh Relay (IMPLEMENTED):** Client PWA instances register their hardware platform and assigned zone in `device_registrations`. The sticky `EmergencyAlertBanner.tsx` polls active alerts and opens an emergency modal requiring an explicit user acknowledgment signature.
  2. **Web Push / FCM Push Tokens (PARTIALLY IMPLEMENTED):** `device_registrations` persists client push tokens (`push_token`). Web Push server dispatch worker is architected and queued for production VAPID key binding.
- **Delivery Tracking States:**
  - `QUEUED`: Alert created, targeted devices calculated.
  - `ACCEPTED`: Delivery record acknowledged by server/device heartbeat.
  - `ACKNOWLEDGED`: Student/staff tapped "Acknowledge Incident Protocol"; recorded with SHA-256 hash.
  - `FAILED`: Unreachable node or expired token.

---

### 5.4 Deployment Architecture

```mermaid
graph LR
    subgraph FrontendHosting ["Frontend Hosting (Vercel)"]
        VercelCDN["Vercel Global Edge CDN"]
        VitePWA["Pre-rendered React 19 PWA Assets"]
        VercelCDN --> VitePWA
    end

    subgraph BackendHosting ["Backend Hosting (Render / Railway / VM)"]
        Uvicorn["Uvicorn ASGI Server (Port 8000)"]
        FastAPIApp["FastAPI Application (app.main:app)"]
        Uvicorn --> FastAPIApp
    end

    subgraph DatabaseHosting ["Database Tier (Supabase)"]
        SupaAuth["Supabase GoTrue Auth"]
        PostgresDB["Supabase Managed PostgreSQL (Port 5432)"]
    end

    ClientDevice["Student / Staff Device"] -->|HTTPS / WSS| VercelCDN
    ClientDevice -->|REST API / Bearer JWT| Uvicorn
    FastAPIApp -->|Async Pool / SSL| PostgresDB
    ClientDevice -->|Auth Credentials| SupaAuth
```

#### Production Execution Commands
```powershell
# 1. Start FastAPI Backend (Production)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 2. Build React PWA Frontend
cd mobile-pwa
npm run build

# 3. Preview Built Frontend
npm run preview -- --port 5173
```

---

## 6. Environment Configuration Reference

| Environment Variable | Required | Service | Purpose | Example Value |
|---|---|---|---|---|
| `HOST` | Optional | Backend | Server binding IP address | `0.0.0.0` |
| `PORT` | Optional | Backend | Listening port | `8000` |
| `ENVIRONMENT` | Required | Backend | Runtime profile (`development`, `production`) | `production` |
| `ALLOWED_ORIGINS` | Required | Backend | Permitted CORS origins | `https://yodhra.vercel.app` |
| `DATABASE_URL` | Required | Backend | SQLAlchemy connection string | `postgresql://user:pass@db.host:5432/yodhra` |
| `SUPABASE_URL` | Optional | Backend & Frontend | Supabase project endpoint | `https://xyzcompany.supabase.co` |
| `SUPABASE_JWT_SECRET` | Optional | Backend | Secret used to verify HS256 auth tokens | `super-secret-jwt-key-32-chars` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Backend | Elevated service role key for administrative tasks | `eyJhbGciOi...` |
| `THREAT_INTELLIGENCE_API_KEY` | Optional | Backend | VirusTotal / Google Safe Browsing API key | `vt_api_key_placeholder` |
| `VITE_API_BASE_URL` | Required | Frontend | Base URL for FastAPI backend | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Optional | Frontend | Supabase authentication URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Optional | Frontend | Public Supabase client key | `eyJhbGciOi...` |

---

## 7. Dependencies & Libraries

### Frontend (`mobile-pwa/package.json`)
- `react` (`^19.3.1`) & `react-dom` (`^19.3.1`): Declarative component lifecycle.
- `react-router-dom` (`^7.18.5`): SPA routing with code splitting.
- `lucide-react` (`^1.65.0`): Enterprise SOC vector iconography.
- `html5-qrcode` (`^2.3.8`): Native camera feed canvas decoder for Quishing checks.
- `@supabase/supabase-js` (`^2.118.0`): Authentication tokens and profile management.
- `tailwindcss` (`^4.3.3`) & `@tailwindcss/vite` (`^4.3.3`): Utility styling.
- `vite` (`^8.3.5`): Compiler and bundler.

### Backend (`backend/requirements.txt`)
- `fastapi` (`>=0.110.0`): Core ASGI framework with OpenAPI schema auto-generation.
- `uvicorn[standard]` (`>=0.28.0`): Asynchronous server implementation.
- `pydantic` (`>=2.6.0`) & `pydantic-settings` (`>=2.2.0`): Schema validation and env parsing.
- `sqlalchemy` (`>=2.0.28`): Object-relational mapping.
- `aiosqlite` (`>=0.20.0`): Async SQLite database driver for local dev.
- `httpx` (`>=0.27.0`): Asynchronous HTTP client for threat intelligence lookups.
- `pyjwt` (`>=2.8.0`): Cryptographic token verification.
- `pytest` (`>=8.0.0`) & `pytest-asyncio` (`>=0.23.0`): Unit testing suite.

---

## 8. Testing & Quality Assurance Verification

The backend test suite is located in `backend/tests/` and was executed on 2026-10-30:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-8.4.2, pluggy-1.6.0
rootdir: E:\ALL HACKTHONS\HackFusion-2.0-APP\backend
plugins: anyio-4.13.0, asyncio-1.1.0
collected 10 items

tests\test_dashboard.py .                                                [ 10%]
tests\test_emergency_alerts.py ...                                       [ 40%]
tests\test_health.py .                                                   [ 50%]
tests\test_incidents.py .                                                [ 60%]
tests\test_scan.py ....                                                  [100%]

======================= 10 passed, 30 warnings in 2.98s =======================
```

### Verified Test Coverage
1. `test_health_check`: Asserts `/api/v1/health` returns HTTP 200 with `status: healthy` and `database: connected`.
2. `test_dashboard_stats`: Validates metrics aggregation across scans and incidents.
3. `test_scan_url_low_risk`: Validates safe domain heuristic scoring.
4. `test_scan_url_malicious_ip_and_port`: Confirms critical detection on raw IP + port combos.
5. `test_scan_message_phishing`: Tests social engineering and keyword flagging.
6. `test_scan_qr_code`: Verifies QR target extraction.
7. `test_incident_lifecycle`: Tests incident submission $\rightarrow$ automated timeline logging $\rightarrow$ triage status transition.
8. `test_hierarchy_tree`: Verifies institutional multi-tier tree traversal.
9. `test_device_registration_and_list`: Tests PWA session token registration and retrieval.
10. `test_emergency_alert_broadcast_and_ack`: Tests Red Alert dispatch $\rightarrow$ device targeting $\rightarrow$ user acknowledgment hashing.

---

## 9. Known Limitations and Technical Debt

### Critical Priority
- **VAPID Web Push Dispatcher (PARTIAL):** Push tokens are registered in `device_registrations`, but hardware-level background push depends on binding production VAPID certificates in `alert_and_device_service.py`. Currently, in-app mesh polling handles delivery.

### High Priority
- **External Threat Intelligence Keys (OPTIONAL):** `threat_intelligence.py` uses heuristic threat indicators if `THREAT_INTELLIGENCE_API_KEY` (VirusTotal / SafeBrowsing) is not populated in `.env`.
- **Production Database Engine Migration:** System currently defaults to SQLite (`signalsafe.db`) for zero-configuration local runs. For concurrent production scaling, `DATABASE_URL` must point to Supabase PostgreSQL.

### Medium Priority
- **Python 3.14 UTC Deprecation Warnings:** SQLAlchemy and datetime calls utilize `datetime.utcnow()`, which is deprecated in Python 3.14 in favor of `datetime.now(datetime.UTC)`.
- **Large Frontend Bundle Chunks:** Production bundle is currently ~1.1MB uncompressed; dynamic code splitting via `React.lazy()` is recommended for optimization.

### Low Priority
- **Simulated SIEM & EDR Webhooks:** SIEM sync on `IncidentDetailPage.tsx` simulates HTTP 200 Splunk / SentinelOne REST ingestion unless enterprise webhooks are defined in backend config.

---

## 10. Development Roadmap & Implementation Status

| Milestone / Feature | Category | Implementation Status | Notes |
|---|---|---|---|
| Responsive React 19 Mobile PWA Shell | Frontend | **IMPLEMENTED** | Built, mobile drawer, bottom nav, installable PWA |
| Heuristic URL Risk Analyzer | Detection | **IMPLEMENTED** | IP checks, port flags, lookalike detection, explainable score |
| NLP Phishing Message Scanner | Detection | **IMPLEMENTED** | Urgency triggers, financial wire traps, bursar scam analysis |
| QR Guardian & Quishing Analyzer | Detection | **IMPLEMENTED** | In-browser camera decoding + official registry validation |
| Offline-First Incident Reporting | Response | **IMPLEMENTED** | Local encrypted sandbox storage with auto-sync on reconnect |
| Enterprise SOC Case Management | Triage | **IMPLEMENTED** | Status dropdown, containment playbook, signed forensic dossier |
| Threat DNA & Campaign Correlation | Intelligence | **IMPLEMENTED** | Structural token hashing, campaign cluster grouping |
| Campus Threat Cartography & Radar | Radar | **IMPLEMENTED** | 6-zone interactive proximity mesh with threat exposure indexes |
| Institutional Trust Graph | Identity | **IMPLEMENTED** | Verified registry directory with lookalike sender detection |
| Adaptive Cyber Defense Center | Awareness | **IMPLEMENTED** | NIST compliance assessment & forensic dossier export |
| Hierarchical Database Tree Architecture | Database | **IMPLEMENTED** | 4-tier tree: Institution $\rightarrow$ Campus $\rightarrow$ Dept $\rightarrow$ Groups |
| Authenticated Device Relay Mesh | Relay | **IMPLEMENTED** | Hardware registration, proximity zone mapping, token heartbeat |
| Emergency RED ALERT Broadcast Engine | Emergency | **IMPLEMENTED** | Mesh broadcast, delivery counter, SHA-256 acknowledgment hash |
| YODHRA Brand Identity & Emblem System | Branding | **IMPLEMENTED** | High-tech emblem, responsive `<Logo />` component, favicons |
| VAPID Hardware Push Dispatcher | Push | **PLANNED** | Scheduled for external FCM/APNS worker binding |
| Cloud Production PostgreSQL Migration | Database | **PLANNED** | Switch `DATABASE_URL` to Supabase connection pooler |

---

*Documentation compiled and verified against codebase on 2026-10-30.*
*All 41 API endpoints, 20 database tables, and 15 frontend views inspected and validated directly from source code.*

