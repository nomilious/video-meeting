"""Check both a fresh database and the former Prisma schema on PostgreSQL."""

import os
import subprocess
from pathlib import Path
from uuid import uuid4

import asyncpg
import bcrypt
import httpx
import pytest
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

if not os.environ.get("TEST_DATABASE_URL"):
    pytest.skip("Set TEST_DATABASE_URL to a dedicated PostgreSQL database", allow_module_level=True)

from app.database import get_session  # noqa: E402
from app.main import app  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.asyncio
@pytest.mark.parametrize("legacy", [False, True])
async def test_migrations_preserve_data_and_are_repeatable(legacy):
    base_url = make_url(os.environ["TEST_DATABASE_URL"])
    admin = await asyncpg.connect(base_url.set(drivername="postgresql").render_as_string(False))
    name = f"migration_{uuid4().hex}"
    await admin.execute(f'CREATE DATABASE "{name}"')
    url = base_url.set(database=name, drivername="postgresql+asyncpg")
    connection = await asyncpg.connect(url.set(drivername="postgresql").render_as_string(False))
    test_engine = create_async_engine(url)
    factory = async_sessionmaker(test_engine, expire_on_commit=False)
    password = "я" * 40  # Legacy Node bcrypt silently truncated to 72 bytes.
    try:
        if legacy:
            await connection.execute((ROOT / "tests/legacy_schema.sql").read_text())
            await connection.execute(
                """INSERT INTO "User"
                (id, email, "passwordHash", "updatedAt") VALUES ($1, $2, $3, NOW())""",
                "legacy-user",
                "legacy@example.com",
                bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode(),
            )
            await connection.execute("""INSERT INTO "Meeting"
                (id, title, date, participants, "ownerId", "updatedAt")
                VALUES ('legacy-meeting', '  ', '2026-10-15 14:30:00', ARRAY[''],
                        'legacy-user', NOW())""")

        env = dict(
            os.environ,
            DATABASE_URL=url.render_as_string(False),
            JWT_SECRET="migration-check-secret-only",
        )
        env.pop("DB_PASSWORD", None)
        for _ in range(2):
            result = subprocess.run(
                [str(ROOT / ".venv/bin/alembic"), "upgrade", "head"],
                cwd=ROOT,
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            assert result.returncode == 0, result.stderr
        assert await connection.fetchval("SELECT version_num FROM alembic_version") == "0002"
        assert (
            await connection.fetchval("""SELECT data_type FROM information_schema.columns
            WHERE table_name = 'Meeting' AND column_name = 'date' """)
            == "timestamp with time zone"
        )

        async def session_override():
            async with factory() as session:
                yield session

        app.dependency_overrides[get_session] = session_override
        if legacy:
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test"
            ) as client:
                login = await client.post(
                    "/auth/login", json={"email": "legacy@example.com", "password": password}
                )
                assert login.status_code == 200, login.text
                headers = {"Authorization": f"Bearer {login.json()['gvtToken']}"}
                response = await client.get("/meetings", headers=headers)
                assert response.status_code == 200, response.text
                assert response.json()[0]["id"] == "legacy-meeting"
                assert response.json()[0]["title"] == "  "
                assert response.json()[0]["date"] == "2026-10-15T14:30:00Z"
                assert (
                    await client.get("/meetings/legacy-meeting", headers=headers)
                ).status_code == 200
        else:
            assert await connection.fetchval('SELECT count(*) FROM "User"') == 0
        with pytest.raises(asyncpg.CheckViolationError):
            await connection.execute("""INSERT INTO "Meeting"
                (id, title, date, participants, "ownerId", "updatedAt")
                VALUES ('bad', '', NOW(), ARRAY[]::text[], 'missing', NOW())""")
    finally:
        app.dependency_overrides.pop(get_session, None)
        await test_engine.dispose()
        await connection.close()
        await admin.execute(f'DROP DATABASE "{name}"')
        await admin.close()
