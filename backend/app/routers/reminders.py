from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Reminder, User
from app.schemas import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse
)


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


# =====================================
# HELPER: GET USER-OWNED REMINDER
# =====================================

def get_owned_reminder(
    db: Session,
    reminder_id: int,
    user_id: int
):
    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id
        )
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    return reminder


# =====================================
# CREATE REMINDER
# =====================================

@router.post(
    "/",
    response_model=ReminderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    data = reminder_data.model_dump()

    reminder = Reminder(
        user_id=current_user.id,
        reminder_type=data["reminder_type"],
        title=data["title"],
        message=data["message"],
        reminder_time=data["reminder_time"],
        repeat_days=",".join(data["repeat_days"]),
        start_date=data["start_date"],
        end_date=data["end_date"],
        is_enabled=data["is_enabled"]
    )

    try:
        db.add(reminder)
        db.commit()
        db.refresh(reminder)

    except Exception:
        db.rollback()
        raise

    return reminder


# =====================================
# GET ALL USER REMINDERS
# =====================================

@router.get(
    "/",
    response_model=list[ReminderResponse]
)
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id
        )
        .order_by(Reminder.created_at.desc())
        .all()
    )


# =====================================
# GET SINGLE REMINDER
# =====================================

@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse
)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return get_owned_reminder(
        db,
        reminder_id,
        current_user.id
    )


# =====================================
# UPDATE REMINDER
# =====================================

@router.put(
    "/{reminder_id}",
    response_model=ReminderResponse
)
def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    reminder = get_owned_reminder(
        db,
        reminder_id,
        current_user.id
    )

    updates = reminder_data.model_dump(
        exclude_unset=True
    )

    # Required database fields cannot be explicitly null.
    required_fields = {
        "reminder_type",
        "title",
        "message",
        "reminder_time",
        "repeat_days",
        "is_enabled"
    }

    for field in required_fields:
        if field in updates and updates[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null"
            )

    # Validate the combined date range, including
    # existing values that were not supplied.
    effective_start_date = updates.get(
        "start_date",
        reminder.start_date
    )

    effective_end_date = updates.get(
        "end_date",
        reminder.end_date
    )

    if (
        effective_start_date is not None
        and effective_end_date is not None
        and effective_end_date < effective_start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="End date cannot be earlier than start date"
        )

    # Convert weekday list into database string.
    if "repeat_days" in updates:
        updates["repeat_days"] = ",".join(
            updates["repeat_days"]
        )

    for field, value in updates.items():
        setattr(reminder, field, value)

    try:
        db.commit()
        db.refresh(reminder)

    except Exception:
        db.rollback()
        raise

    return reminder


# =====================================
# DELETE REMINDER
# =====================================

@router.delete(
    "/{reminder_id}"
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    reminder = get_owned_reminder(
        db,
        reminder_id,
        current_user.id
    )

    try:
        db.delete(reminder)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Reminder deleted successfully",
        "reminder_id": reminder_id
    }
