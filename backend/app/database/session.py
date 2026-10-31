import os
import re
import sys
import shlex
import urllib.parse
from typing import Generator, Tuple, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url, Engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.database.models import Base


# Global database state indicators for health and lifecycle checks
db_connection_status: str = "uninitialized"
db_connection_error: Optional[str] = None
db_config_error: Optional[str] = None


def _mask_url(url_str: str) -> str:
    """Masks database passwords for safe error reporting and logging without exposing credentials."""
    if not url_str:
        return "<empty>"
    try:
        parsed = make_url(url_str)
        return parsed.render_as_string(hide_password=True)
    except Exception:
        # Fallback regex masking if URL cannot be parsed
        return re.sub(r':([^@/\s]+)@', ':****@', url_str)


def _safe_encode_url(url_str: str) -> str:
    """
    Safely encodes password characters (e.g. '@', ':', '#', '$', '%') which otherwise break
    standard RFC-1738 URL parsing in SQLAlchemy make_url().
    Unquotes first to prevent double-encoding.
    """
    if "://" not in url_str:
        return url_str
    scheme, rest = url_str.split("://", 1)
    if "@" in rest:
        userinfo, host_part = rest.rsplit("@", 1)
        if ":" in userinfo:
            user, pwd = userinfo.split(":", 1)
            # Unquote first to prevent double-encoding (%40 -> @ -> %40), then safely quote
            encoded_pwd = urllib.parse.quote(urllib.parse.unquote(pwd), safe="")
            return f"{scheme}://{user}:{encoded_pwd}@{host_part}"
    return url_str


def _parse_psql_command(cmd_str: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Extracts host, port, dbname, and user from a psql CLI command string.
    Example: psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -d postgres -U postgres.wevmeqdidigchvkxmgkf
    """
    host = None
    port = "5432"
    dbname = "postgres"
    user = None

    try:
        # Use regex to reliably match common psql flags
        h_match = re.search(r'(?:-h|--host)[=\s]+([^\s]+)', cmd_str)
        if h_match:
            host = h_match.group(1).strip("'\"")

        p_match = re.search(r'(?:-p|--port)[=\s]+([^\s]+)', cmd_str)
        if p_match:
            port = p_match.group(1).strip("'\"")

        d_match = re.search(r'(?:-d|--dbname)[=\s]+([^\s]+)', cmd_str)
        if d_match:
            dbname = d_match.group(1).strip("'\"")

        u_match = re.search(r'(?:-U|--username)[=\s]+([^\s]+)', cmd_str)
        if u_match:
            user = u_match.group(1).strip("'\"")
    except Exception:
        pass

    return host, port, dbname, user


def resolve_database_url() -> Tuple[Optional[str], str, Optional[str]]:
    """
    Safely resolves, normalizes, and validates the database connection URL.
    Checks candidate environment variables in order:
      1. settings.DATABASE_URL
      2. settings.SUPABASE_DATABASE_URL
      3. settings.INTERNAL_DATABASE_URL
      4. settings.POSTGRES_URL

    Rejects and explains psql CLI commands.
    In development, falls back to local SQLite if no candidate is provided.
    In production, rejects missing or invalid URLs without silently falling back to SQLite.

    Returns: (cleaned_url_or_none, source_variable_name, error_message_or_none)
    """
    candidates = [
        ("DATABASE_URL", settings.DATABASE_URL),
        ("SUPABASE_DATABASE_URL", settings.SUPABASE_DATABASE_URL),
        ("INTERNAL_DATABASE_URL", settings.INTERNAL_DATABASE_URL),
        ("POSTGRES_URL", settings.POSTGRES_URL),
    ]

    selected_raw = None
    source_var = "none"

    for var_name, candidate in candidates:
        if not candidate:
            continue
        cleaned = candidate.strip().strip("'\"").strip()
        if cleaned and cleaned.lower() not in ("none", "null", "undefined"):
            selected_raw = cleaned
            source_var = var_name
            break

    # If no database URL was supplied in environment
    if not selected_raw:
        if settings.ENVIRONMENT.lower() == "production":
            err = (
                "No DATABASE_URL environment variable configured in production. "
                "Please configure DATABASE_URL in your Render Dashboard -> Environment settings."
            )
            return None, source_var, err
        return settings.default_sqlite_url, "default_sqlite_fallback", None

    # Check if user accidentally pasted a psql CLI command
    if selected_raw.lower().startswith("psql ") or re.match(r"^psql\b", selected_raw, re.IGNORECASE):
        host, port, dbname, user = _parse_psql_command(selected_raw)
        
        # Check if password is provided in auxiliary environment variables
        pwd = (
            os.getenv("PGPASSWORD")
            or os.getenv("SUPABASE_DB_PASSWORD")
            or os.getenv("SUPABASE_PASSWORD")
            or os.getenv("DATABASE_PASSWORD")
            or os.getenv("DB_PASSWORD")
        )
        if pwd and host and user:
            encoded_pwd = urllib.parse.quote(pwd, safe="")
            assembled_url = f"postgresql+psycopg://{user}:{encoded_pwd}@{host}:{port}/{dbname}"
            print(
                f"[{settings.PROJECT_NAME}] [CONFIG ADVISORY] Automatically converted psql command "
                f"from '{source_var}' into valid SQLAlchemy URI using host '{host}' and user '{user}'.",
                file=sys.stderr
            )
            return assembled_url, source_var, None

        # If password is not found in env, provide exact guidance
        host_disp = host or "aws-1-eu-west-3.pooler.supabase.com"
        port_disp = port or "5432"
        db_disp = dbname or "postgres"
        user_disp = user or "postgres.wevmeqdidigchvkxmgkf"

        err = (
            f"Environment variable '{source_var}' contains a psql terminal command, not a connection URI: '{selected_raw}'. "
            f"To fix: In Render Dashboard -> Environment, set DATABASE_URL to: "
            f"postgresql+psycopg://{user_disp}:[YOUR_PASSWORD]@{host_disp}:{port_disp}/{db_disp}"
        )
        print(f"[{settings.PROJECT_NAME}] [DATABASE CONFIG ERROR]\n{err}", file=sys.stderr)
        return None, source_var, err

    # Normalize driver / scheme prefixes
    normalized_url = selected_raw
    if normalized_url.startswith("postgres://"):
        normalized_url = "postgresql+psycopg://" + normalized_url[len("postgres://"):]
    elif normalized_url.startswith("postgresql://"):
        normalized_url = "postgresql+psycopg://" + normalized_url[len("postgresql://"):]
    elif normalized_url.startswith("sqlite+aiosqlite:"):
        normalized_url = "sqlite:" + normalized_url[len("sqlite+aiosqlite:"):]

    # Safely encode credentials
    normalized_url = _safe_encode_url(normalized_url)

    # Validate syntax via SQLAlchemy make_url
    try:
        make_url(normalized_url)
        return normalized_url, source_var, None
    except Exception as parse_err:
        masked = _mask_url(selected_raw)
        err = (
            f"Could not parse database URL from '{source_var}': '{masked}'. "
            "Expected format: postgresql+psycopg://[user]:[password]@[host]:[port]/[database] "
            "or sqlite:///path/to/db."
        )
        print(f"[{settings.PROJECT_NAME}] [DATABASE PARSE ERROR] {err}", file=sys.stderr)
        return None, source_var, err


def build_engine() -> Tuple[Optional[Engine], Optional[sessionmaker], Optional[str]]:
    """
    Constructs the SQLAlchemy Engine and Session factory.
    Never throws uncaught exceptions during module import so Uvicorn can bind ports.
    """
    resolved_url, source_var, err = resolve_database_url()

    if err or not resolved_url:
        return None, None, err

    try:
        parsed_url = make_url(resolved_url)

        # Connection pool tuning
        engine_kwargs = {
            "echo": False,
            "pool_pre_ping": True,  # Critical for Supabase poolers: checks connection before reuse
        }

        if parsed_url.drivername.startswith("sqlite"):
            engine_kwargs["connect_args"] = {"check_same_thread": False}
        elif parsed_url.drivername.startswith("postgresql"):
            # Supabase Session pooler configuration
            engine_kwargs["pool_recycle"] = 300  # Discard idle pool connections before Supabase PgBouncer closes them
            engine_kwargs["pool_size"] = 10
            engine_kwargs["max_overflow"] = 20

            # Connection timeout & auto-enforce SSL for remote cloud databases
            connect_args = engine_kwargs.setdefault("connect_args", {})
            connect_args.setdefault("connect_timeout", 5)

            if parsed_url.host and not parsed_url.host.startswith(("127.0.0.1", "localhost")):
                if "sslmode" not in parsed_url.query:
                    connect_args["sslmode"] = "require"

        new_engine = create_engine(resolved_url, **engine_kwargs)
        new_sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=new_engine)

        masked_target = parsed_url.render_as_string(hide_password=True)
        print(f"[{settings.PROJECT_NAME}] Database engine created using '{source_var}' -> {masked_target}")
        return new_engine, new_sessionmaker, None

    except Exception as exc:
        masked = _mask_url(resolved_url)
        create_err = f"Failed to initialize database engine on {masked}: {str(exc)}"
        print(f"[{settings.PROJECT_NAME}] [DATABASE ENGINE ERROR] {create_err}", file=sys.stderr)
        return None, None, create_err


# Initialize SQLAlchemy engine and sessionmaker safely on import
engine, SessionLocal, db_config_error = build_engine()
if db_config_error:
    db_connection_status = "unconfigured"
    db_connection_error = db_config_error
else:
    db_connection_status = "initialized"


def check_database_connection(timeout_seconds: int = 5) -> Tuple[bool, str]:
    """
    Actively tests connection liveness by executing a lightweight SELECT 1.
    Returns (is_connected: bool, message: str).
    """
    global db_connection_status, db_connection_error

    if engine is None or SessionLocal is None:
        db_connection_status = "unconfigured"
        msg = db_config_error or "Database engine not configured."
        db_connection_error = msg
        return False, msg

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_connection_status = "connected"
        db_connection_error = None
        return True, "Database connection active and responsive"
    except Exception as exc:
        db_connection_status = "disconnected"
        masked = _mask_url(str(engine.url))
        err_msg = f"Connection failed on {masked}: {str(exc)}"
        db_connection_error = err_msg
        return False, err_msg


def init_db() -> bool:
    """
    Initializes database schema synchronously on FastAPI startup.
    Returns True if successful, False otherwise without crashing process.
    """
    global db_connection_status, db_connection_error

    if engine is None:
        print(f"[{settings.PROJECT_NAME}] [STARTUP NOTICE] Schema verification skipped: {db_config_error}", file=sys.stderr)
        return False

    try:
        Base.metadata.create_all(bind=engine)
        db_connection_status = "connected"
        db_connection_error = None
        print(f"[{settings.PROJECT_NAME}] Database schema verified and initialized.")
        return True
    except Exception as exc:
        masked = _mask_url(str(engine.url))
        db_connection_status = "disconnected"
        db_connection_error = str(exc)
        print(f"[{settings.PROJECT_NAME}] [DATABASE WARNING] Could not verify schema on {masked}: {exc}", file=sys.stderr)
        print(
            f"[{settings.PROJECT_NAME}] [RESILIENCE NOTICE] Server startup continuing to bind HTTP port. "
            "Database connections will re-attempt upon client requests.",
            file=sys.stderr
        )
        return False


def close_db() -> None:
    """Closes all database pool connections during application shutdown."""
    global engine
    if engine is not None:
        try:
            engine.dispose()
            print(f"[{settings.PROJECT_NAME}] Database engine connections disposed successfully.")
        except Exception as exc:
            print(f"[{settings.PROJECT_NAME}] Error disposing database engine: {exc}", file=sys.stderr)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency providing a transactional database session.
    Raises HTTP 503 Service Unavailable with secret-safe guidance if database is not configured.
    """
    if SessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database service is currently unavailable. "
                "Please verify that DATABASE_URL in Render Dashboard is set to a valid PostgreSQL URI "
                "(e.g., postgresql+psycopg://username:password@host:port/database)."
            )
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_optional() -> Generator[Optional[Session], None, None]:
    """
    FastAPI dependency providing an optional transactional database session.
    Yields None if the database is unconfigured or degraded, preventing full endpoint crashes.
    """
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
