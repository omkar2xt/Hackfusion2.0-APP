import os
import urllib.parse
from sqlalchemy.engine import make_url
from app.database import session


def test_mask_url():
    url = "postgresql+psycopg://myuser:secretpassword123@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    masked = session._mask_url(url)
    assert "secretpassword123" not in masked
    assert "myuser" in masked
    assert "aws-1-eu-west-3.pooler.supabase.com" in masked


def test_safe_encode_url_special_chars():
    # Password with raw '@' and ':'
    raw_url = "postgresql+psycopg://user_admin:pass@word:123#@localhost:5432/mydb"
    encoded = session._safe_encode_url(raw_url)
    parsed = make_url(encoded)
    assert parsed.username == "user_admin"
    assert parsed.password == "pass@word:123#"
    assert parsed.host == "localhost"

    # Verify no double encoding if already percent-encoded
    double_test = f"postgresql+psycopg://user_admin:{urllib.parse.quote('pass@word:123#')}@localhost:5432/mydb"
    encoded_again = session._safe_encode_url(double_test)
    parsed_again = make_url(encoded_again)
    assert parsed_again.password == "pass@word:123#"


def test_parse_psql_command():
    cmd = "psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -d postgres -U postgres.wevmeqdidigchvkxmgkf"
    host, port, dbname, user = session._parse_psql_command(cmd)
    assert host == "aws-1-eu-west-3.pooler.supabase.com"
    assert port == "5432"
    assert dbname == "postgres"
    assert user == "postgres.wevmeqdidigchvkxmgkf"


def test_resolve_psql_command_without_password(monkeypatch):
    monkeypatch.setattr(session.settings, "DATABASE_URL", "psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -d postgres -U postgres.wevmeqdidigchvkxmgkf")
    monkeypatch.setattr(session.settings, "ENVIRONMENT", "production")
    monkeypatch.delenv("PGPASSWORD", raising=False)
    monkeypatch.delenv("SUPABASE_DB_PASSWORD", raising=False)

    resolved, source_var, err = session.resolve_database_url()
    assert resolved is None
    assert source_var == "DATABASE_URL"
    assert err is not None
    assert "contains a psql terminal command" in err
    assert "postgresql+psycopg://" in err


def test_resolve_psql_command_with_password(monkeypatch):
    monkeypatch.setattr(session.settings, "DATABASE_URL", "psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -d postgres -U postgres.wevmeqdidigchvkxmgkf")
    monkeypatch.setenv("PGPASSWORD", "SafeSupabasePass2026!")

    resolved, source_var, err = session.resolve_database_url()
    assert err is None
    assert resolved is not None
    assert resolved.startswith("postgresql+psycopg://postgres.wevmeqdidigchvkxmgkf:")
    assert "@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" in resolved
    parsed = make_url(resolved)
    assert parsed.username == "postgres.wevmeqdidigchvkxmgkf"
    assert parsed.password == "SafeSupabasePass2026!"


def test_resolve_missing_database_url_in_production(monkeypatch):
    monkeypatch.setattr(session.settings, "DATABASE_URL", None)
    monkeypatch.setattr(session.settings, "SUPABASE_DATABASE_URL", None)
    monkeypatch.setattr(session.settings, "INTERNAL_DATABASE_URL", None)
    monkeypatch.setattr(session.settings, "POSTGRES_URL", None)
    monkeypatch.setattr(session.settings, "ENVIRONMENT", "production")

    resolved, source_var, err = session.resolve_database_url()
    assert resolved is None
    assert err is not None
    assert "No DATABASE_URL environment variable configured in production" in err


def test_valid_postgresql_url_normalization(monkeypatch):
    raw_postgres = "postgres://postgres.user:dummy_pass@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    monkeypatch.setattr(session.settings, "DATABASE_URL", raw_postgres)

    resolved, source_var, err = session.resolve_database_url()
    assert err is None
    assert resolved.startswith("postgresql+psycopg://")
    parsed = make_url(resolved)
    assert parsed.drivername == "postgresql+psycopg"
    assert parsed.host == "aws-1-eu-west-3.pooler.supabase.com"
