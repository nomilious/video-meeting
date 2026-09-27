from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

NonemptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class RegistrationCredentials(Credentials):
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode()) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class TokenResponse(BaseModel):
    gvtToken: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str


class MeetingCreate(BaseModel):
    title: NonemptyString
    date: datetime
    participants: list[NonemptyString] = Field(min_length=1)

    @field_validator("date")
    @classmethod
    def normalize_date(cls, value: datetime) -> datetime:
        # Previous API accepted ISO dates without an offset as UTC.
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    date: datetime
    participants: list[str]
