import os
import re
import sys
import urllib.parse
from typing import Generator, Tuple
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url, URL
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.database.models import Base


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
    Safely encodes password characters (e.g. '@', ':', '#') which otherwise break
    standard RFC-1738 URL parsing in SQLAlchemy make_url().
    """
    if "://" not in url_str:
        return url_str
    scheme, rest = url_str.split("://", 1)
    if "@" in rest:
        userinfo, host_part = rest.rsplit("@", 1)
        if ":" in userinfo:
            user, pwd = userinfo.split(":", 1)
            # Unquote first to prevent double-encoding, then safely quote
            encoded_pwd = urllib.parse.quote(urllib.parse.unquote(pwd), safe="")
            return f"{scheme}://{user}:{encoded_pwd}@{host_part}"
    return url_str


def resolve_database_url() -> Tuple[str, str]:
    """
    Safely resolves, normalizes, and validates the database connection URL.
    Checks in order:
      1. settings.DATABASE_URL
      2. settings.SUPABASE_DATABASE_URL
      3. settings.INTERNAL_DATABASE_URL
      4. settings.POSTGRES_URL
      5. Fallback to local SQLite signalsafe.db
    Returns: (cleaned_url, source_variable_name)
    """
    candidates = [
        ("DATABASE_URL", settings.DATABASE_URL),
        ("SUPABASE_DATABASE_URL", settings.SUPABASE_DATABASE_URL),
        ("INTERNAL_DATABASE_URL", settings.INTERNAL_DATABASE_URL),
        ("POSTGRES_URL", settings.POSTGRES_URL),
    ]

    for var_name, candidate in candidates:
        if not candidate:
            continue
        # Strip surrounding whitespace and any accidental wrapping quotes (single or double)
        cleaned = candidate.strip().strip("'\"").strip()
        if cleaned and cleaned.lower() not in ("none", "null", "undefined"):
            return cleaned, var_name

    # If no candidate was provided, return local SQLite default
    return settings.default_sqlite_url, "default_sqlite_fallback"


def build_engine():
    raw_url, source_var = resolve_database_url()

    # Normalize driver / scheme prefixes
    normalized_url = raw_url
    if normalized_url.startswith("postgres://"):
        # Supabase and Render legacy prefix: convert postgres:// -> postgresql://
        normalized_url = "postgresql://" + normalized_url[len("postgres://"):]
    elif normalized_url.startswith("sqlite+aiosqlite:"):
        normalized_url = "sqlite:" + normalized_url[len("sqlite+aiosqlite:"):]

    # Safely encode credentials so special characters in passwords don't fail regex
    normalized_url = _safe_encode_url(normalized_url)

    # Validate that SQLAlchemy can parse the URL
    try:
        parsed_url = make_url(normalized_url)
    except Exception as parse_err:
        masked = _mask_url(raw_url)
        print(f"[ERROR] Could not parse database URL from '{source_var}': {masked}", file=sys.stderr)
        print(
            "[CONFIG ADVISORY] Expected format: postgresql://[user]:[password]@[host]:[port]/[database] "
            "or sqlite:///path/to/db. Ensure there are no surrounding quotes or whitespace in Render environment variables.",
            file=sys.stderr
        )
        if getattr(settings, "ENVIRONMENT", "").lower() == "production":
            raise ValueError(
                f"Could not parse database URL from environment variable '{source_var}'. "
                f"Value given: '{masked}'. Please check your Render environment configuration."
            ) from parse_err
        else:
            print("[FALLBACK] Reverting to local SQLite database in development mode...", file=sys.stderr)
            normalized_url = settings.default_sqlite_url
            parsed_url = make_url(normalized_url)
            source_var = "default_sqlite_fallback"

    # Engine connection arguments & pool tuning
    engine_kwargs = {
        "echo": False,
        "pool_pre_ping": True,  # Checks connection liveness before reuse (critical for Supabase poolers)
    }

    if parsed_url.drivername.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    elif parsed_url.drivername.startswith("postgresql"):
        # Supabase Session/Transaction poolers and Render PostgreSQL
        # Pool recycle prevents connection drops on cloud serverless infrastructure
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20

        # Auto-enforce SSL for remote cloud databases if not explicitly specified
        if "sslmode" not in parsed_url.query and not parsed_url.host.startswith(("127.0.0.1", "localhost")):
            engine_kwargs.setdefault("connect_args", {})["sslmode"] = "require"

    masked_target = parsed_url.render_as_string(hide_password=True)
    print(f"[{settings.PROJECT_NAME}] Database engine initialized using '{source_var}' -> {masked_target}")

    return create_engine(normalized_url, **engine_kwargs)


# Initialize SQLAlchemy engine with safe URL parsing and validation
engine = build_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def init_db() -> None:
    """Creates database tables synchronously on startup if they don't exist."""
    try:
        Base.metadata.create_all(bind=engine)
        print(f"[{settings.PROJECT_NAME}] Database schema verified and initialized.")
    except Exception as exc:
        masked = _mask_url(str(engine.url))
        print(f"[{settings.PROJECT_NAME}] [DATABASE WARNING] Could not verify schema on {masked}: {exc}", file=sys.stderr)
        print(
            f"[{settings.PROJECT_NAME}] [DATABASE RESILIENCE] Server will proceed with startup. "
            "Database connections will automatically reconnect upon client request.",
            file=sys.stderr
        )


def get_db() -> Generator[Session, None, None]:
    """Dependency providing a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
