from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from .config import settings
from .database import get_session
from .models import User
from .schemas import Credentials, RegistrationCredentials, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
Session = Annotated[AsyncSession, Depends(get_session)]
bearer = HTTPBearer(auto_error=False)
Bearer = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]


def token_for(user: User) -> TokenResponse:
    now = datetime.now(UTC)
    return TokenResponse(
        gvtToken=jwt.encode(
            {"sub": user.id, "email": user.email, "iat": now, "exp": now + timedelta(hours=1)},
            settings.jwt_secret,
            algorithm="HS256",
        )
    )


async def current_user(credentials: Bearer, session: Session) -> User:
    unauthorized = HTTPException(
        401, "Требуется вход в аккаунт", headers={"WWW-Authenticate": "Bearer"}
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"require": ["sub", "exp"]},
        )
    except jwt.InvalidTokenError:
        raise unauthorized from None
    user = await session.get(User, payload["sub"])
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(current_user)]


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegistrationCredentials, session: Session) -> TokenResponse:
    if await session.scalar(select(User.id).where(User.email == body.email)):
        raise HTTPException(409, "Пользователь с таким email уже существует")
    password_hash = await run_in_threadpool(
        bcrypt.hashpw, body.password.encode(), bcrypt.gensalt(12)
    )
    user = User(email=body.email, password_hash=password_hash.decode())
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Пользователь с таким email уже существует") from None
    return token_for(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: Credentials, session: Session) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == body.email))
    # Keep password hashing off the event loop, including the unknown-user path.
    hashed = user.password_hash.encode() if user else DUMMY_HASH
    # Node bcrypt truncated at 72 bytes; keep existing long-password accounts usable.
    valid = await run_in_threadpool(bcrypt.checkpw, body.password.encode()[:72], hashed)
    if user is None or not valid:
        raise HTTPException(401, "Неверный email или пароль")
    return token_for(user)


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser) -> User:
    return user


DUMMY_HASH = b"$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxuUxTkU/P3WgxTq0S9PbbZJ3Vy"
