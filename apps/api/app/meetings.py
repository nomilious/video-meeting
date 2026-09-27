from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from .auth import CurrentUser, Session
from .models import Meeting
from .schemas import MeetingCreate, MeetingResponse

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=MeetingResponse, status_code=201)
async def create(body: MeetingCreate, user: CurrentUser, session: Session) -> Meeting:
    meeting = Meeting(**body.model_dump(), owner_id=user.id)
    session.add(meeting)
    await session.commit()

    return meeting


@router.get("", response_model=list[MeetingResponse])
async def list_meetings(
    user: CurrentUser,
    session: Session,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int | None, Query(ge=1, le=100)] = None,
) -> list[Meeting]:
    query = (
        select(Meeting)
        .where(Meeting.owner_id == user.id)
        .order_by(Meeting.date, Meeting.id)
        .offset(offset)
        .limit(limit)
    )

    # Preserve the previous array contract; clients can opt into pagination.
    meetings = await session.scalars(query)
    return list(meetings.all())


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str, user: CurrentUser, session: Session) -> Meeting:
    meeting = await session.scalar(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.owner_id == user.id)
    )

    if meeting is None:
        raise HTTPException(404, "Встреча не найдена")

    return meeting
