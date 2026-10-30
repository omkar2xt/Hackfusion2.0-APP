# SignalSafe Campus – Mobile Application (PWA)

> **"Think Before You Click."**  
> Unified campus cybersecurity mobile platform for students, faculty, and administrative staff.

SignalSafe Campus is a mobile-first Progressive Web Application (PWA) built to detect and report campus cybersecurity threats: phishing links, malicious QR codes, fraudulent SMS/email communications, and credential harvesting attempts.

---

## 📱 Developer Role & Scope

- **Developer Role:** Developer 4 (Mobile Application & PWA Lead)
- **Central API Integration:** Integrates directly with the shared central FastAPI backend (Developer 1) and Supabase authentication.
- **Architecture:** Reuses Developer 1's central detection engine and database.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile-pwa
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate backend and Supabase credentials:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🛠 Technology Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, React Router v7
- **Hardware Integration:** `html5-qrcode` (camera QR decoding)
- **Authentication:** Supabase Auth (`@supabase/supabase-js`)
- **PWA Support:** Web App Manifest, Service Worker (`sw.js`), standalone mobile display
- **Backend API:** FastAPI REST API (Developer 1)

---

## 🛡 Features & Screens

1. **Splash / Onboarding (`/`):** SignalSafe Campus branding, tagline, quick entry.
2. **Authentication (`/login`, `/signup`, `/forgot-password`):** Supabase Auth with real-time password strength meter.
3. **Mobile Security Dashboard (`/dashboard`):** Security posture indicator, aggregate stats, quick action shortcuts, recent scan results, and incident updates.
4. **Threat Analysis / URL Scanner (`/scan`):** Link inspection via `POST /api/v1/scan/url`, explainable risk scoring, indicators, and recommendations.
5. **Message Analyzer (`/scan?tab=message`):** Phishing email/SMS text inspection via `POST /api/v1/scan/message`.
6. **QR Code Guard (`/qr-scanner`):** On-demand camera QR code scanner with `html5-qrcode`, destination preview without auto-browsing, inspection via `POST /api/v1/scan/qr`, and manual input fallback.
7. **Incident Reporting (`/report`):** Campus cyber threat reporting via `POST /api/v1/incidents` with severity levels and categories.
8. **My Reports & Lifecycle Tracking (`/reports`, `/reports/:id`):** 4-stage incident lifecycle tracking (`SUBMITTED` ➔ `TRIAGED` ➔ `INVESTIGATING` ➔ `RESOLVED`).
9. **User Profile & Security Settings (`/profile`):** Campus user info, granular notification toggles, privacy pledge, and secure sign out.

---

## 🔗 Integrated Backend Endpoints

- `POST /api/v1/scan/url` – URL threat inspection
- `POST /api/v1/scan/message` – Phishing message analysis
- `POST /api/v1/scan/qr` – Decoded QR target analysis
- `POST /api/v1/incidents` – Submit incident report
- `GET /api/v1/incidents` – List user incident reports
- `GET /api/v1/incidents/{id}` – Incident detail and resolution notes
- `GET /api/v1/dashboard/stats` – Aggregate metrics & recent activity feeds
