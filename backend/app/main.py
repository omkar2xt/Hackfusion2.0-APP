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
    allow_origin_regex=r"^https://.*\.vercel\.app$",
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
