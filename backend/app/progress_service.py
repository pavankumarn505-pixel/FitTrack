
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Workout, Progress


def calculate_daily_progress(
    db: Session,
    user_id: int,
    progress_date: date
):
    # Calculate statistics directly from workout records
    statistics = (
        db.query(
            func.count(Workout.id).label("total_workouts"),
            func.coalesce(
                func.sum(Workout.calories_burned), 0
            ).label("total_calories"),
            func.coalesce(
                func.sum(Workout.duration), 0
            ).label("total_duration")
        )
        .filter(
            Workout.user_id == user_id,
            Workout.workout_date == progress_date
        )
        .one()
    )

    # Find existing daily progress record
    progress = (
        db.query(Progress)
        .filter(
            Progress.user_id == user_id,
            Progress.date == progress_date
        )
        .first()
    )

    # Create a new record if one does not exist
    if progress is None:

        progress = Progress(
            user_id=user_id,
            date=progress_date,
            total_workouts=statistics.total_workouts,
            total_calories=statistics.total_calories,
            total_duration=statistics.total_duration
        )

        db.add(progress)

    else:
        # Refresh existing daily statistics
        progress.total_workouts = statistics.total_workouts
        progress.total_calories = statistics.total_calories
        progress.total_duration = statistics.total_duration

    db.commit()
    db.refresh(progress)

    return progress
