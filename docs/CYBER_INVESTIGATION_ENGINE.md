# YODHRA — Advanced Threat Detection & Cyber Investigation Engine

## 1. Executive Overview
The **Cyber Investigation Center** transforms the YODHRA platform from a scanning utility into an evidence-driven, enterprise-grade forensic investigation system. The previous shared scanning logic has been replaced with separate, specialized intelligence engines for **URL Intelligence** and **QR Intelligence**, backed by an immutable **Evidence Vault (SHA-256)**, **Multi-Incident Correlation**, a rigorous **4-Tier Attribution Matrix**, and an automated **Forensic Investigation Report Generator**.

---

## 2. Dedicated URL Intelligence Pipeline
Located in `backend/app/services/url_intelligence_service.py` & accessible via `POST /api/v1/investigation/url`:
- **URL Normalization & Deconstruction**: Strict URI decomposition into scheme, host, port, path, and parsed query parameter dictionary.
- **SSRF & Private Network Defense**:
  - Automatically identifies and isolates loopback (`127.0.0.0/8`, `::1`), RFC 1918 private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata IP (`169.254.169.254`).
  - Sets `ssrf_safe: False` and halts internal requests if an adversary targets campus intranet assets.
- **Typosquatting & Brand Impersonation**: Uses Levenshtein distance calculations against institutional and tech domains (`klsvdit.edu.in`, `vdit.edu.in`, `vtu.ac.in`, `sbi.co.in`, `microsoft.com`, `google.com`).
- **Punycode & Obfuscation Detection**: Flags `xn--` homograph attacks, excessive `%`-encoding, null-bytes, and embedded `@` authority tricks.
- **Credential Harvesting Heuristics**: Regex detection for authentication keywords (`login`, `signin`, `sso`, `portal`, `password`, `duo`, `verify`).
- **Infrastructure Profiling**: Synthesizes and queries DNS records (`A`, `NS`, `MX`), Autonomous System Numbers (ASN), hosting provider, TLS certificate issuer, validity, and SHA-256 fingerprint.
- **URL Shortener Analysis**: Detects masking services (`bit.ly`, `tinyurl.com`, `t.co`, etc.) and traces safe simulated redirect chains.

---

## 3. Dedicated QR Intelligence Pipeline
Located in `backend/app/services/qr_intelligence_service.py` & accessible via `POST /api/v1/investigation/qr`:
- **Structure-Aware Payload Classification**:
  - `URL`: Forwarded into the deep URL intelligence pipeline.
  - `WIFI`: Parses `WIFI:S:SSID;T:sec;P:pass;;` — flags unencrypted open rogue networks (`NOPASS`/`OPEN`) and campus SSID impersonation (`KLS_VDIT_CAMPUS_FREE`).
  - `PAYMENT`: Parses UPI/payment URIs — checks payee VPA against the certified university treasury registry (`fees@vdit`, `bursar@sbi`).
  - `VCARD_CONTACT`: Scans embedded contact cards for social engineering and contact insertion risks.
  - `TEXT_PLAIN` & `APP_DEEP_LINK`: Analyzed for execution attempts.
- **Cryptographic Evidence Sealing**: Computes SHA-256 hashes for both the decoded payload text and the raw QR image.
- **Campus-Wide Payload Reuse Tracking**: Queries historical database reports to identify recurring QR campaigns on campus.
- **Physical Placement Context**: Clear explanations that distinguish digital redirection risks from verified physical tampering.

---

## 4. Cyber Investigation Center Modules

### 4.1 Multi-Incident Evidence Correlation
- **Endpoint:** `GET /api/v1/investigation/correlation`
- Links disparate reports across campus using shared technical indicators:
  - `SAME_DOMAIN`: Shared phishing destination hostname.
  - `SAME_IP`: Shared hosting IP or drop-server.
  - `SAME_CERT_FINGERPRINT`: Shared TLS certificate.
  - `SAME_REDIRECT_CHAIN`: Shared redirect hops.
  - `SIMILAR_CAMPAIGN`: Heuristic structural similarity.
- Categorizes match strength into **CONFIRMED_MATCH** vs **WEAK_SIMILARITY** with explicit technical reasons.

### 4.2 4-Tier Attribution Matrix
Strict separation of evidentiary confidence to prevent false accusations:
1. **Observed Facts**: Raw telemetry (Source IP, Port, Timestamp, User-Agent, Firewall logs).
2. **Technical Inferences**: Infrastructure observations (ASN hosting provider, registrar pattern, TLS issuer).
3. **Unverified Hypotheses**: Suspected threat group motives or campaign objectives requiring further corroboration.
4. **Confirmed Findings**: Validated IOCs matching internal security logs.
- **Strict Privacy Guardrail**: Attribution is restricted to network artifacts; individual human identities are never claimed without authorized legal/forensic proof.

### 4.3 Evidence Vault
- **Models:** `EvidenceVaultModel` (`evidence_vault`)
- **Endpoints:** `GET /api/v1/investigation/vault`, `POST /api/v1/investigation/vault`
- Stores original payloads, images, server logs, and reporter screenshots with SHA-256 cryptographic hashes and timestamped chain-of-custody audit logs (`INGESTED` ➔ `CRYPTOGRAPHIC_SEAL` ➔ `ANALYSIS_LOCK`).

### 4.4 Forensic Report Generator
- **Endpoint:** `GET /api/v1/investigation/report/{incident_id}`
- Generates an institutional investigation dossier containing:
  - Incident Summary & Attack Type
  - Chronological Incident Timeline
  - Deep URL/QR Analysis Breakdown & Technical Indicators
  - Affected Users, Devices & Campus Departments
  - Evidence Vault References & Related Incident Links
  - Attribution Breakdown with Limitations Disclaimer
  - Actionable Containment Steps
  - Formatted Print & PDF Export support in the PWA interface.

---

## 5. Verification & Live Endpoints
- **Frontend URL:** `http://localhost:5173/investigation`
- **Backend API:** `http://localhost:8000/api/v1/investigation/...`
- **Build Status:** `tsc -b && vite build` built in 3.96s with zero errors.
- **Backend Reloader:** Running live with FastAPI and active reloader on port 8000.
