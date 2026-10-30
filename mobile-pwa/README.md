# SignalSafe Campus – Mobile App (PWA)

> **"Think Before You Click."**  
> Proactive mobile cybersecurity platform for campus students, faculty, and administrative staff.

SignalSafe Campus is a mobile-first Progressive Web Application (PWA) built to combat campus-targeted cyber threats: phishing portals, malicious QR code stickers on noticeboards, fraudulent SMS/email communications, and credential harvesting schemes.

---

## 📱 Developer Role & Scope

- **Developer Role:** Developer 4 (Mobile Application & PWA Lead)
- **Central API Integration:** Integrates with the shared FastAPI backend (Developer 1) and central Supabase authentication.
- **Detection Engine:** Leverages the centralized detection APIs. Does not maintain a separate detection engine or secondary database.

---

## 🛠 Technology Stack

- **Framework:** React 19 + TypeScript (Strict Type Checking)
- **Tooling & Bundler:** Vite 6 + Tailwind CSS v4
- **Iconography:** Lucide React
- **Routing:** React Router v7
- **Hardware Integration:** `html5-qrcode` (camera QR decoding on-demand)
- **Authentication:** Supabase Auth (`@supabase/supabase-js`)
- **PWA Features:** Standalone display manifest, offline static asset service worker (`sw.js`), adaptive app icons
- **Target Platforms:** Android Chrome, iOS Safari, Desktop browsers

---

## 🛡 Key Features & Modules

### 1. Splash & Onboarding (`/`)
- Cybersecurity brand identity with animated grid matrix and glowing shield.
- Instant routing to sign-in or exploratory dashboard.

### 2. Authentication (`/login`, `/signup`, `/forgot-password`)
- Supabase Auth integration with secure session token storage in `localStorage`.
- Real-time password strength verification (length, uppercase, numerical requirements).
- Password visibility toggles and email validation.

### 3. Mobile Security Dashboard (`/dashboard`)
- Security status card: dynamic *Protected* or *Alert* indicator based on scan telemetry.
- Real-time metric cards: Total Scans, Suspicious Findings, Reported Incidents.
- Quick action shortcuts for instant URL scanning, text analysis, QR verification, and incident reporting.
- Feed of recent scan outcomes and active campus security incident reports with pull-to-refresh.

### 4. Threat Analysis (`/scan`)
- **URL Scanner:** Validates submitted URLs, checks against threat intelligence via `POST /api/v1/scan/url`.
- **Message Analyzer:** Analyzes suspicious emails, SMS texts, and urgent student alerts via `POST /api/v1/scan/message`.
- **Explainable Results:** Displays risk score (0–100 circular gauge), verdict (`MALICIOUS`, `SUSPICIOUS`, `LOW_RISK`, `UNKNOWN`), risk level badge, threat indicators, and mitigation recommendations.
- **Copy & Report:** One-click copy and one-click incident prefill.

### 5. QR Code Guard (`/qr-scanner`)
- **On-Demand Camera Access:** Camera stream activates *only* after explicit user tap.
- **Local Frame Decoding:** Decoded payload is displayed as text without automated browsing.
- **Automatic Threat Inspection:** Sends decoded destination to `POST /api/v1/scan/qr`.
- **Manual Input Fallback:** Fallback input for camera-denied or non-camera devices.

### 6. Incident Reporting (`/report`)
- Formal campus incident reporting form with categories: Phishing, Malware, Data Breach, Unauthorized Access, Suspicious Email, Social Engineering, and Other.
- Severity levels: Low, Medium, High, Critical.
- Sends structured report to `POST /api/v1/incidents`.
- Generates a tracking reference ID and informs the user of the triage lifecycle.

### 7. My Reports & Incident Tracking (`/reports`, `/reports/:id`)
- Real-time incident tracking through 4-stage lifecycle:
  `SUBMITTED` ➔ `TRIAGED` ➔ `INVESTIGATING` ➔ `RESOLVED / CLOSED`
- Horizontal status filters (`All`, `Submitted`, `Triaged`, `Investigating`, `Resolved`).
- Interactive timeline indicator and administrative resolution notes display.

### 8. User Profile & Security Settings (`/profile`)
- User identification and campus role badge.
- Granular notification preferences for high-risk alerts and security broadcasts.
- Transparent privacy guidelines: strict no-surveillance pledge and zero password caching.
- Safe logout and session revocation.

---

## 🔒 Security Principles Followed

1. **Explicit Submission Only:** Scans only content voluntarily submitted by the student/staff member.
2. **Never Auto-Open Links:** QR destinations and scanned URLs are never automatically opened in a browser.
3. **No False Guarantees:** Explicit notice that `LOW_RISK` is not a guarantee of absolute safety.
4. **No Plaintext Passwords in Storage:** Handled exclusively via Supabase Auth token persistence.
5. **No Secrets Exposed:** Threat intelligence API keys and Supabase service role keys reside on Developer 1's backend.

---

## 🚀 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Central FastAPI backend URL (Developer 1) | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | `your-anon-key-here` |

---

## 💻 Local Development Instructions

### 1. Install Dependencies
```bash
cd mobile-pwa
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build & Type Check
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Push this repository to GitHub.
2. Import project in Vercel.
3. Set the Root Directory to `mobile-pwa`.
4. Add Environment Variables:
   - `VITE_API_BASE_URL` (e.g. `https://signalsafe-api.onrender.com`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

---

## 🔗 Integrated Backend Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/scan/url` | Inspects submitted URL destination |
| `POST` | `/api/v1/scan/message` | Analyzes text / email for phishing |
| `POST` | `/api/v1/scan/qr` | Evaluates decoded QR code target |
| `POST` | `/api/v1/incidents` | Files a new campus incident report |
| `GET` | `/api/v1/incidents` | Lists user's submitted incidents |
| `GET` | `/api/v1/incidents/{id}` | Fetches individual incident timeline & notes |
| `GET` | `/api/v1/dashboard/stats` | Fetches aggregate metrics & recent feeds |
