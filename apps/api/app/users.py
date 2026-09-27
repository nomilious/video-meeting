from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .models import User


class UserAlreadyExistsError(Exception):
    pass


@dataclass(frozen=True)
class CreateUserCommand:
    email: str
    password_hash: str


@dataclass(frozen=True)
class FindUserByEmailQuery:
    email: str


@dataclass(frozen=True)
class FindUserByIdQuery:
    user_id: str


async def handle_find_user_by_email(
    query: FindUserByEmailQuery, session: AsyncSession
) -> User | None:
    return await session.scalar(select(User).where(User.email == query.email))


async def handle_find_user_by_id(query: FindUserByIdQuery, session: AsyncSession) -> User | None:
    return await session.get(User, query.user_id)


async def handle_create_user(command: CreateUserCommand, session: AsyncSession) -> User:
    if await handle_find_user_by_email(FindUserByEmailQuery(command.email), session):
        raise UserAlreadyExistsError(command.email)

    user = User(email=command.email, password_hash=command.password_hash)
    session.add(user)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise UserAlreadyExistsError(command.email) from None

    return user
