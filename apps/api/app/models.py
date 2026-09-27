from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class User(Timestamps, Base):
    __tablename__ = "User"
    id: Mapped[str] = mapped_column(Text, primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", Text)


class Meeting(Timestamps, Base):
    __tablename__ = "Meeting"
    __table_args__ = (
        Index("Meeting_ownerId_idx", "ownerId"),
        CheckConstraint("cardinality(participants) > 0", name="Meeting_participants_nonempty"),
        CheckConstraint("length(trim(title)) > 0", name="Meeting_title_nonempty"),
    )
    id: Mapped[str] = mapped_column(Text, primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(Text)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    participants: Mapped[list[str]] = mapped_column(ARRAY(Text))
    owner_id: Mapped[str] = mapped_column(
        "ownerId", ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE")
    )
