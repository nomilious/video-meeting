"""Integration check against a migrated, dedicated PostgreSQL test database."""

import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import httpx
import jwt
import pytest
from sqlalchemy import delete

if not os.environ.get("TEST_DATABASE_URL"):
    pytest.skip("Set TEST_DATABASE_URL to a dedicated PostgreSQL database", allow_module_level=True)

os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ["JWT_SECRET"] = "integration-test-secret-never-use-in-production"

from app.config import settings  # noqa: E402
from app.database import engine, session_factory  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402


@pytest.mark.asyncio
async def test_auth_and_meeting_isolation():
    emails = [f"api-{uuid4()}@example.com" for _ in range(2)]
    password = "SecurePassword123!"
    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            assert (await client.get("/health")).status_code == 200
            assert (await client.get("/meetings")).status_code == 401
            assert (await client.post("/meetings", json={})).status_code == 401
            assert (await client.get("/meetings/missing")).status_code == 401

            response = await client.post(
                "/auth/login", json={"email": emails[0], "password": password}
            )
            assert response.status_code == 401

            response = await client.post(
                "/auth/register", json={"email": "invalid", "password": "short"}
            )
            assert response.status_code == 422

            response = await client.post(
                "/auth/register", json={"email": emails[0], "password": "я" * 40}
            )
            assert response.status_code == 422

            tokens = []
            for email in emails:
                response = await client.post(
                    "/auth/register", json={"email": email.upper(), "password": password}
                )
                assert response.status_code == 201, response.text
                tokens.append(response.json()["gvtToken"])

            response = await client.post(
                "/auth/register", json={"email": emails[0], "password": password}
            )
            assert response.status_code == 409

            response = await client.post(
                "/auth/login", json={"email": emails[0], "password": "wrong-password"}
            )
            assert response.status_code == 401

            response = await client.post(
                "/auth/login", json={"email": emails[0], "password": password}
            )
            assert response.status_code == 200

            headers = {"Authorization": f"Bearer {tokens[0]}"}
            other_headers = {"Authorization": f"Bearer {tokens[1]}"}
            identity = (await client.get("/auth/me", headers=headers)).json()
            assert identity["email"] == emails[0]
            assert set(identity) == {"id", "email"}

            expired = jwt.encode(
                {"sub": identity["id"], "exp": datetime.now(UTC) - timedelta(seconds=1)},
                settings.jwt_secret,
                algorithm="HS256",
            )
            for token in [
                expired,
                "invalid-token",
                jwt.encode({"sub": identity["id"]}, settings.jwt_secret, algorithm="HS256"),
            ]:
                response = await client.get(
                    "/meetings", headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 401

            body = {
                "title": "Team sync",
                "date": "2026-10-15T17:30:00+03:00",
                "participants": ["alice@example.com"],
            }
            for invalid in [
                {"title": " "},
                {"date": "invalid"},
                {"participants": []},
                {"participants": [" "]},
            ]:
                response = await client.post("/meetings", headers=headers, json=body | invalid)
                assert response.status_code == 422, response.text

            response = await client.post("/meetings", headers=headers, json=body)
            assert response.status_code == 201, response.text
            meeting = response.json()
            assert set(meeting) == {"id", "title", "date", "participants"}
            assert datetime.fromisoformat(meeting["date"]) == datetime(
                2026, 10, 15, 14, 30, tzinfo=UTC
            )

            path = f"/meetings/{meeting['id']}"
            assert (await client.get(path, headers=headers)).json() == meeting
            assert (await client.get(path, headers=other_headers)).status_code == 404
            assert (await client.get("/meetings/missing", headers=headers)).status_code == 404
            assert (await client.get("/meetings", headers=other_headers)).json() == []
            assert (await client.get("/meetings", headers=headers)).json() == [meeting]
            assert (await client.get("/meetings?offset=1&limit=1", headers=headers)).json() == []
            assert (await client.get("/meetings?limit=0", headers=headers)).status_code == 422
    finally:
        async with session_factory() as session:
            await session.execute(delete(User).where(User.email.in_(emails)))
            await session.commit()
        await engine.dispose()
