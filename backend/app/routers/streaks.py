
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Workout


router = APIRouter(
    prefix="/streaks",
    tags=["Streak Tracking"]
)


# =====================================
# HELPER: CALCULATE LONGEST STREAK
# =====================================

def calculate_longest_streak(workout_dates):

    if not workout_dates:
        return 0

    longest = 1
    current = 1

    for index in range(1, len(workout_dates)):

        difference = (
            workout_dates[index] - workout_dates[index - 1]
        ).days

        if difference == 1:
            current += 1
        else:
            current = 1

        longest = max(longest, current)

    return longest


# =====================================
# HELPER: CALCULATE CURRENT STREAK
# =====================================

def calculate_current_streak(workout_dates, today):

    if not workout_dates:
        return 0

    last_date = workout_dates[-1]

    # Streak expires after one missed day
    if last_date < today - timedelta(days=1):
        return 0

    streak = 1
    current_date = last_date

    for previous_date in reversed(workout_dates[:-1]):

        if previous_date == current_date - timedelta(days=1):
            streak += 1
            current_date = previous_date
        else:
            break

    return streak


# =====================================
# MODULE 10: GET STREAK SUMMARY
# =====================================

@router.get("/summary")
def get_streak_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    today = date.today()

    # Fetch unique workout dates for logged-in user
    workout_dates = [
        row[0]
        for row in (
            db.query(Workout.workout_date)
            .filter(
                Workout.user_id == current_user.id,
                Workout.workout_date <= today
            )
            .distinct()
            .order_by(Workout.workout_date.asc())
            .all()
        )
    ]

    current_streak = calculate_current_streak(
        workout_dates, today
    )

    longest_streak = calculate_longest_streak(
        workout_dates
    )

    last_workout_date = (
        workout_dates[-1] if workout_dates else None
    )

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_workout_date": last_workout_date,
        "worked_out_today": today in workout_dates,
        "total_active_days": len(workout_dates)
    }
