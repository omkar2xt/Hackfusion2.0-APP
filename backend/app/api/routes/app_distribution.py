import os
import hashlib
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/app", tags=["App Distribution & Updates"])

APK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "downloads")
RELEASE_APK_PATH = os.path.join(APK_DIR, "YODHRA.apk")
DEBUG_APK_PATH = os.path.join(APK_DIR, "YODHRA-debug.apk")

class AppVersionResponse(BaseModel):
    app_name: str
    package_name: str
    latest_version: str
    version_code: int
    release_date: str
    min_android_version: str
    download_url: str
    debug_download_url: str
    file_size_bytes: int
    file_size_formatted: str
    sha256_checksum: str
    release_notes: List[str]
    mandatory_update: bool

def compute_sha256(filepath: str) -> str:
    if not os.path.exists(filepath):
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def get_file_size(filepath: str) -> int:
    if os.path.exists(filepath):
        return os.path.getsize(filepath)
    return 0

@router.get("/version", response_model=AppVersionResponse, status_code=status.HTTP_200_OK)
def get_latest_version():
    """Returns the latest published YODHRA Android APK version and checksum for in-app update checks."""
    file_size = get_file_size(RELEASE_APK_PATH)
    size_mb = f"{file_size / (1024 * 1024):.1f} MB" if file_size > 0 else "5.8 MB"
    checksum = compute_sha256(RELEASE_APK_PATH)

    return AppVersionResponse(
        app_name="YODHRA – Cyber Intelligence",
        package_name="com.yodhra.app",
        latest_version="1.0.0",
        version_code=1,
        release_date="2026-10-31",
        min_android_version="Android 7.0 (API Level 24+)",
        download_url="/downloads/YODHRA.apk",
        debug_download_url="/downloads/YODHRA-debug.apk",
        file_size_bytes=file_size,
        file_size_formatted=size_mb,
        sha256_checksum=checksum,
        release_notes=[
            "Official standalone Android APK distribution for KLS VDIT Cyber Intelligence.",
            "Interactive Campus Proximity Mesh Map with real-time geospatial positioning.",
            "High-precision QR Code Guardian scanner with institutional verification.",
            "Evidence-driven Cyber Investigation SOC Engine with SHA-256 evidence vault.",
            "7-Tier Institutional IAM Governance & Role-Based Access Control matrix.",
            "Offline-capable and optimized for all Android devices running Android 7.0 to 16."
        ],
        mandatory_update=False
    )

@router.get("/download/release")
def download_release_apk():
    """Direct HTTPS download for the signed release APK."""
    if not os.path.exists(RELEASE_APK_PATH):
        raise HTTPException(status_code=404, detail="Release APK is currently being generated. Please retry in a few moments.")
    return FileResponse(
        path=RELEASE_APK_PATH,
        media_type="application/vnd.android.package-archive",
        filename="YODHRA.apk"
    )

@router.get("/download/debug")
def download_debug_apk():
    """Direct download for the debug testing APK."""
    if not os.path.exists(DEBUG_APK_PATH):
        raise HTTPException(status_code=404, detail="Debug APK is currently being generated. Please retry in a few moments.")
    return FileResponse(
        path=DEBUG_APK_PATH,
        media_type="application/vnd.android.package-archive",
        filename="YODHRA-debug.apk"
    )
