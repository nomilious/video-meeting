import os

import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://config:config@localhost/config")
os.environ.setdefault("JWT_SECRET", "configuration-check-secret-only")

from app.config import Settings  # noqa: E402


def test_database_password_and_previous_prisma_url(monkeypatch):
    monkeypatch.delenv("DB_PASSWORD", raising=False)
    password = "strong@password/with#percent%"

    settings = Settings(_env_file=None, db_host="postgres", db_password=password)
    url = make_url(settings.database_url)

    assert url.password == password
    assert url.host == "postgres"
    assert url.drivername == "postgresql+asyncpg"

    previous = Settings(
        _env_file=None,
        database_url="postgresql://user:pass@localhost/db?schema=public",
    )
    assert previous.database_url == "postgresql+asyncpg://user:pass@localhost/db"

    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="sqlite:///db")
