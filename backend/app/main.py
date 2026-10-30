from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import init_db

# Route imports
from app.api.routes.health import router as health_router
from app.api.routes.scan import router as scan_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.threat_dna import router as threat_dna_router
from app.api.routes.cyber_radar import router as cyber_radar_router
from app.api.routes.qr_guardian import router as qr_guardian_router
from app.api.routes.trust_graph import router as trust_graph_router
from app.api.routes.timeline import router as timeline_router
from app.api.routes.coach import router as coach_router
from app.api.routes.immune_system import router as immune_system_router
from app.api.routes.devices import router as devices_router
from app.api.routes.emergency_alerts import router as emergency_alerts_router
from app.api.routes.campus import router as campus_router
from app.api.routes.investigation import router as investigation_router
from app.api.routes.iam import router as iam_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema
    print(f"[{settings.PROJECT_NAME}] Initializing database tables...")
    init_db()
    print(f"[{settings.PROJECT_NAME}] Database ready. Server running on port {settings.PORT}.")
    yield
    # Shutdown
    print(f"[{settings.PROJECT_NAME}] Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified campus cybersecurity backend platform for URL, message, and QR threat detection and incident management.",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^(https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Error] Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal cybersecurity engine error: {str(exc)}"}
    )


# API Routers mounted under /api/v1
app.include_router(health_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(incidents_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(threat_dna_router, prefix="/api/v1")
app.include_router(cyber_radar_router, prefix="/api/v1")
app.include_router(qr_guardian_router, prefix="/api/v1")
app.include_router(trust_graph_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")
app.include_router(coach_router, prefix="/api/v1")
app.include_router(immune_system_router, prefix="/api/v1")
app.include_router(devices_router, prefix="/api/v1")
app.include_router(emergency_alerts_router, prefix="/api/v1")
app.include_router(campus_router, prefix="/api/v1")
app.include_router(investigation_router, prefix="/api/v1")
app.include_router(iam_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
