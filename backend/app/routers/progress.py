
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Progress
from app.schemas import ProgressResponse
from app.progress_service import calculate_daily_progress


router = APIRouter(
    prefix="/progress",
    tags=["Daily Progress Tracking"]
)


# =====================================
# GET TODAY'S PROGRESS
# =====================================

@router.get("/today", response_model=ProgressResponse)
def get_today_progress(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    today = date.today()

    progress = calculate_daily_progress(
        db=db,
        user_id=current_user.id,
        progress_date=today
    )

    return progress


# =====================================
# GET PROGRESS FOR SPECIFIC DATE
# =====================================

@router.get("/date/{progress_date}", response_model=ProgressResponse)
def get_progress_by_date(
    progress_date: date,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    progress = calculate_daily_progress(
        db=db,
        user_id=current_user.id,
        progress_date=progress_date
    )

    return progress


# =====================================
# GET PROGRESS HISTORY
# =====================================

@router.get("/history", response_model=list[ProgressResponse])
def get_progress_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Recalculate dates that have existing workouts
    workout_dates = (
        db.query(Progress.date)
        .filter(Progress.user_id == current_user.id)
        .all()
    )

    for row in workout_dates:
        calculate_daily_progress(
            db=db,
            user_id=current_user.id,
            progress_date=row.date
        )

    return (
        db.query(Progress)
        .filter(Progress.user_id == current_user.id)
        .order_by(Progress.date.desc())
        .all()
    )


# =====================================
# CALCULATE / REFRESH DAILY PROGRESS
# =====================================

@router.post("/calculate", response_model=ProgressResponse)
def calculate_progress(
    progress_date: date,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return calculate_daily_progress(
        db=db,
        user_id=current_user.id,
        progress_date=progress_date
    )
