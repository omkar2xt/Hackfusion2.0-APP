from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.database.session import check_database_connection

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    """
    Active health check endpoint verifying server operational status and
    live database connectivity.
    """
    is_connected, db_message = check_database_connection()
    status_str = "healthy" if is_connected else "degraded"

    payload = {
        "status": status_str,
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected" if is_connected else "disconnected",
        "database_status": db_message
    }

    if not is_connected:
        payload["config_guidance"] = (
            "Verify that DATABASE_URL in Render Dashboard is set to a valid SQLAlchemy URI: "
            "postgresql+psycopg://postgres.wevmeqdidigchvkxmgkf:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
        )

    return payload
