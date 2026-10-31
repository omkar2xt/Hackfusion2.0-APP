# YODHRA — ANDROID APK BUILD & DIRECT DISTRIBUTION ARCHITECTURE

## 1. Overview & Architecture
YODHRA Cyber Intelligence is packaged as a high-performance standalone Android application via Capacitor 8 integration over the React + Vite + TypeScript PWA core. It is built for **direct APK distribution** without publishing to the Google Play Store, allowing campus users, security operators, and faculty to download and install the official signed APK directly from the institution's web portal.

### Application Identity
- **Application ID / Package Name**: `com.yodhra.app`
- **Application Name**: `YODHRA – Cyber Intelligence`
- **Version**: `1.0.0`
- **Version Code**: `1`
- **Min Android SDK**: API Level 24 (Android 7.0 Nougat)
- **Target Android SDK**: API Level 36 (Android 15 / 16)
- **Compile Android SDK**: API Level 36
- **Firebase Project ID**: `yodhra` (Project Number: `884334760045`)

---

## 2. Cryptographic Signing & Keystore Specification
The official production release APK is signed with a dedicated RSA-2048 key using SHA-384 message digest:

- **Keystore File**: `mobile-pwa/android/app/release.keystore`
- **Key Alias**: `yodhra_release_key`
- **Key Algorithm**: RSA 2048-bit
- **Digest Algorithm**: SHA-384
- **Validity**: 10,000 days (approx. 27 years)
- **Subject DN**: `CN=YODHRA Security Lead, OU=Cyber Defense SOC, O=KLS VDIT Haliyal, L=Haliyal, ST=Karnataka, C=IN`

*(Note: Keystores are strictly excluded from version control via `.gitignore`)*

---

## 3. Generated Binaries & Checksums

| Package Type | File Name | Size | SHA-256 Checksum | Serving Endpoint |
|---|---|---|---|---|
| **Signed Production Release** | `YODHRA.apk` | 11.09 MB (11,629,683 bytes) | `3d8f587d4e736f5d93501bac7a4b276b0c16f7eadaa57cd783a44bd648a617f9` | `/downloads/YODHRA.apk` |
| **Debug / Developer Build** | `YODHRA-debug.apk` | 14.98 MB (15,710,203 bytes) | `82e7c6677b559f9cd0732f25bba49627252e69a1840f0ecbbedbc20f585fa89f` | `/downloads/YODHRA-debug.apk` |

### Integrity Verification (Windows PowerShell)
```powershell
Get-FileHash -Algorithm SHA256 backend/app/static/downloads/YODHRA.apk
# Output must match:
# 3D8F587D4E736F5D93501BAC7A4B276B0C16F7EADAA57CD783A44BD648A617F9
```

### Integrity Verification (Linux / macOS)
```bash
sha256sum backend/app/static/downloads/YODHRA.apk
# Output:
# 3d8f587d4e736f5d93501bac7a4b276b0c16f7eadaa57cd783a44bd648a617f9  YODHRA.apk
```

---

## 4. Android Manifest & Permissions

The Android application requests only verified essential permissions required for campus threat intelligence operations:

```xml
<!-- Network communication for intelligence telemetry -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera permission for QR Code Guardian scanning -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- Precise GPS and coarse location for Campus Proximity Mesh -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />

<!-- Emergency Red Alert push and local notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 5. Backend Distribution & In-App Update API

The FastAPI backend exposes dedicated distribution endpoints mounted under `/api/v1/app`:

- `GET /api/v1/app/version`: Returns version 1.0.0 metadata, release notes, exact file size in bytes, minimum Android OS requirements, and dynamic SHA-256 verification hash.
- `GET /api/v1/app/download/release`: Direct download trigger for production `YODHRA.apk`.
- `GET /api/v1/app/download/debug`: Direct download trigger for developer `YODHRA-debug.apk`.
- Static files served from `backend/app/static/downloads/` mounted at `/downloads`.

---

## 6. Sideloading & Installation Instructions for Students & Faculty

1. **Download APK**: Visit `https://yodhra.klsvdit.edu.in/download` or click **Get APK** in the top navigation header.
2. **Allow Installation from Unknown Sources**:
   - Go to Android **Settings** → **Security** / **Privacy**.
   - Enable **Install unknown apps** for Chrome or your download browser.
3. **Open & Install**: Tap the downloaded `YODHRA.apk` file from notifications or downloads folder and tap **Install**.
4. **Grant Permissions**: Upon first launch, grant Camera (for QR scanning) and Location (for Campus Proximity Radar) when prompted.

---

## 7. iOS Safari Installation (Alternative for iPhone Users)

Since iOS does not support sideloaded APK files, iPhone users can run YODHRA via Progressive Web App (PWA):
1. Open Safari and navigate to `https://yodhra.klsvdit.edu.in`.
2. Tap the **Share** button in the Safari toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Launch YODHRA directly from your Home Screen with full native-like fullscreen experience.

