# CAMPUS GEOSPATIAL INTELLIGENCE RADAR IMPLEMENTATION

## 1. Executive Summary & Objective
Production-grade deployment of the **Campus Intelligence Radar** module inside the YODHRA Cyber Intelligence Platform, recreating the interactive campus mesh map, building markers, threat indicators, live user-location marker, real-time distance labels, threat information cards, and movement simulator matching the design reference.

The map is centered on verified geographical coordinates resolved from the provided Google Maps location:
- **Campus Institution:** KLS Vishwanathrao Deshpande Institute of Technology (KLS VDIT)
- **Location:** Dandeli Road, Haliyal, Karnataka 581329, India
- **Coordinates:** `15.3227274° N, 74.7549305° E`

---

## 2. Architecture & Tech Stack

### 2.1 Frontend (`mobile-pwa`)
- **Map Engine:** Leaflet `v1.9.4` with OpenStreetMap raster tiles
- **Geospatial Math:** `@turf/turf` (geodesic distance calculations, point-in-polygon & perimeter containment)
- **Custom UI Markers:** SVG-embedded `L.divIcon` styled to match the design reference:
  - Circular badge icon (Red Alert / Elevated / Secure)
  - White card pill displaying Facility Name, `[YOU]` badge when user is within range, active threat count, and primary threat vector
- **Live Device Tracking:** HTML5 Geolocation API (`navigator.geolocation.watchPosition`) with explicit user permissions, accuracy circle, recentering, and start/stop controls
- **Movement Simulator (`TEST MODE`):**
  - Walk mode (1.5 m/s) and Sprint mode (4.0 m/s)
  - Virtual D-pad (North, South, East, West) and step size selector
  - Separate simulated avatar marker on the map labeled `TEST MODE` (does not overwrite real GPS telemetry)
- **Audio/Visual Warnings:** Real-time Web Audio API synthesized alert chime upon perimeter breach into active critical zones (`RED_ALERT`)
- **Theme Compliance:** Fully integrated with YODHRA enterprise light theme tokens (`#F7F8FA`, `#FFFFFF`, `#202A35`, `#64748B`, `#315E63`, `#397C78`, `#E5E9ED`)

### 2.2 Backend (`FastAPI` & `SQLAlchemy`)
- **Endpoints Mounted at `/api/v1/campus`:**
  - `GET /api/v1/campus/buildings`: Fetches all verified campus buildings and perimeter configurations (seeds KLS VDIT verified coordinates if table is empty).
  - `POST /api/v1/campus/buildings`: Admin-only registration of new campus facilities.
  - `PUT /api/v1/campus/buildings/{id}`: Admin-only modification of building details or coordinates.
  - `POST /api/v1/campus/geofence-check`: Real-time endpoint evaluating device coordinates against campus facilities, perimeter radii, and threat vectors.
- **Database Models (`backend/app/database/models.py`):**
  - `CampusBuildingModel` (`campus_buildings`)
  - `CampusZoneModel` (`campus_zones`)
  - `IncidentLocationModel` (`incident_locations`)
  - `LocationAlertModel` (`location_alerts`)

---

## 3. Verified Campus Facility Directory (KLS VDIT)

| Building ID | Facility Name | Code | Lat / Long | Perimeter Radius | Threat Level | Primary Threat Vector |
|---|---|---|---|---|---|---|
| `bldg-cse-01` | Engineering & CS Quad | `ENG-QUAD` | 15.3225, 74.7552 | 150m | `RED_ALERT` | Credential Harvester |
| `bldg-admin-01` | Administration & Bursar Hub | `ADMIN-BURSAR` | 15.3228, 74.7548 | 120m | `RED_ALERT` | Impersonation Wire Phish |
| `bldg-lib-01` | Main Library Commons (Jnan Sudha) | `LIB-COMMONS` | 15.3221, 74.7549 | 180m | `ELEVATED` | Malicious QR Code |
| `bldg-canteen-01` | Student Life & Dining Hall | `STUDENT-UNION` | 15.3224, 74.7542 | 140m | `ELEVATED` | Phishing SMS |
| `bldg-ece-01` | Science & Bio-Research Tower (ECE Block) | `SCI-COMPLEX` | 15.3232, 74.7555 | 130m | `NORMAL` | Reconnaissance Scan |
| `bldg-hostel-01` | Residence Halls & Dorms | `RESIDENCE-HALLS` | 15.3212, 74.7538 | 200m | `NORMAL` | Smishing Link |
| `bldg-gate-01` | Main Campus Security Gate | `GATE-01` | 15.3239, 74.7542 | 100m | `NORMAL` | Perimeter Checkpoint |
| `bldg-med-01` | Health Center & Emergency Care | `MED-CARE` | 15.3230, 74.7540 | 90m | `NORMAL` | Emergency Bay |

---

## 4. Verification & Testing Results

1. **Frontend Compilation:**
   - Command: `cd mobile-pwa; npm run build`
   - Result: `✓ built in 2.38s` with zero TypeScript errors.
2. **Backend Server & Endpoints:**
   - Server: Running on `http://0.0.0.0:8000`
   - Verified `GET /api/v1/campus/buildings`: Returns 8 verified KLS VDIT facilities.
   - Verified `POST /api/v1/campus/geofence-check`: Correctly evaluates user position at `(15.3225, 74.7552)` as inside `Engineering & CS Quad` (`0.0m`), triggers `RED_ALERT`, and detects proximity to `Administration & Bursar Hub` (`54.3m`).
3. **PWA Dev Server:**
   - Server: Running on `http://localhost:5173`
