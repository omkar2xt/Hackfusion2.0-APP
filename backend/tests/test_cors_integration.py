import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cors_production_vercel_domain():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://yodhra.vercel.app"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://yodhra.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_vercel_preview_subdomain():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://hackfusion-git-main-omkar2xt.vercel.app"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://hackfusion-git-main-omkar2xt.vercel.app"

def test_cors_capacitor_android_native():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "capacitor://localhost"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "capacitor://localhost"

def test_cors_options_preflight():
    response = client.options(
        "/api/v1/scan/url",
        headers={
            "Origin": "https://yodhra.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization, content-type, x-requested-with",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://yodhra.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")

def test_cors_disallowed_origin():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://malicious-actor.com"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None
