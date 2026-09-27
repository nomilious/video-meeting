"""Check the Users CQRS handlers against a dedicated PostgreSQL database."""

import asyncio
import os
from uuid import uuid4

import pytest
from sqlalchemy import delete

if not os.environ.get("TEST_DATABASE_URL"):
    pytest.skip("Set TEST_DATABASE_URL to a dedicated PostgreSQL database", allow_module_level=True)

os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ["JWT_SECRET"] = "integration-test-secret-never-use-in-production"

from app.database import engine, session_factory  # noqa: E402
from app.models import User  # noqa: E402
from app.users import (  # noqa: E402
    CreateUserCommand,
    FindUserByEmailQuery,
    FindUserByIdQuery,
    UserAlreadyExistsError,
    handle_create_user,
    handle_find_user_by_email,
    handle_find_user_by_id,
)


async def test_user_commands_and_queries():
    email = f"users-{uuid4()}@example.com"
    command = CreateUserCommand(email, "stored-password-hash")
    try:
        async with session_factory() as first, session_factory() as second:
            assert await handle_find_user_by_email(FindUserByEmailQuery(email), first) is None
            assert await handle_find_user_by_id(FindUserByIdQuery(str(uuid4())), first) is None

            results = await asyncio.gather(
                handle_create_user(command, first),
                handle_create_user(command, second),
                return_exceptions=True,
            )
            users = [result for result in results if isinstance(result, User)]
            conflicts = [result for result in results if isinstance(result, UserAlreadyExistsError)]
            assert len(users) == len(conflicts) == 1, results
            user = users[0]

            for session in (first, second):
                found = await handle_find_user_by_email(FindUserByEmailQuery(email), session)
                assert found is not None
                assert found.id == user.id
                assert found.password_hash == command.password_hash
                assert await handle_find_user_by_id(FindUserByIdQuery(user.id), session) is found
                with pytest.raises(UserAlreadyExistsError):
                    await handle_create_user(command, session)
    finally:
        async with session_factory() as session:
            await session.execute(delete(User).where(User.email == email))
            await session.commit()
        await engine.dispose()
