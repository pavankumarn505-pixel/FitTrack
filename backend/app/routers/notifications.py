
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Notification, Workout, User
from app.schemas import (
    NotificationResponse,
    NotificationCountResponse
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# =====================================
# GET ALL NOTIFICATIONS
# =====================================

@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )


# =====================================
# GET UNREAD NOTIFICATION COUNT
# =====================================

@router.get(
    "/unread-count",
    response_model=NotificationCountResponse
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        )
        .count()
    )

    return {"unread_count": count}


# =====================================
# MARK SINGLE NOTIFICATION AS READ
# =====================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# =====================================
# MARK ALL NOTIFICATIONS AS READ
# =====================================

@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        )
        .update(
            {Notification.is_read: True},
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count
    }


# =====================================
# DAILY WORKOUT REMINDER
# =====================================

@router.post("/reminders/daily-workout")
def create_daily_workout_reminder(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    # Check whether the user logged a workout today.
    workout = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.workout_date == today
        )
        .first()
    )

    if workout is not None:
        return {
            "message": "You have already logged a workout today",
            "notification": None
        }

    # Prevent duplicate reminders for the same user and day.
    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.title == "Daily Workout Reminder",
            func.date(Notification.created_at) == today.isoformat()
        )
        .first()
    )

    if existing_notification is not None:
        return {
            "message": "Today's workout reminder already exists",
            "notification": existing_notification
        }

    notification = Notification(
        user_id=current_user.id,
        title="Daily Workout Reminder",
        message=(
            "You haven't logged a workout today. "
            "Stay active and complete your daily fitness goal!"
        ),
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Daily workout reminder created successfully",
        "notification": NotificationResponse.model_validate(
            notification
        )
    }
