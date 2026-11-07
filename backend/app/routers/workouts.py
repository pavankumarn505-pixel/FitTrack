
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Workout
from app.schemas import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse
)
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/workouts",
    tags=["Workout Management"]
)


# 1. Add Workout
@router.post(
    "/",
    response_model=WorkoutResponse,
    status_code=status.HTTP_201_CREATED
)
def create_workout(
    workout_data: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_workout = Workout(
        user_id=current_user.id,
        workout_name=workout_data.workout_name,
        category=workout_data.category,
        duration=workout_data.duration,
        calories_burned=workout_data.calories_burned,
        workout_date=workout_data.workout_date
    )

    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)

    return new_workout


# 2. Fetch All User Workouts
@router.get(
    "/",
    response_model=list[WorkoutResponse]
)
def get_workouts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.workout_date.desc())
        .all()
    )


# 3. Fetch Workout By ID
@router.get(
    "/{workout_id}",
    response_model=WorkoutResponse
)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    workout = (
        db.query(Workout)
        .filter(
            Workout.id == workout_id,
            Workout.user_id == current_user.id
        )
        .first()
    )

    if workout is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return workout


# 4. Update Workout
@router.put(
    "/{workout_id}",
    response_model=WorkoutResponse
)
def update_workout(
    workout_id: int,
    workout_data: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    workout = (
        db.query(Workout)
        .filter(
            Workout.id == workout_id,
            Workout.user_id == current_user.id
        )
        .first()
    )

    if workout is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    workout.workout_name = workout_data.workout_name
    workout.category = workout_data.category
    workout.duration = workout_data.duration
    workout.calories_burned = workout_data.calories_burned
    workout.workout_date = workout_data.workout_date

    db.commit()
    db.refresh(workout)

    return workout


# 5. Delete Workout
@router.delete("/{workout_id}")
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    workout = (
        db.query(Workout)
        .filter(
            Workout.id == workout_id,
            Workout.user_id == current_user.id
        )
        .first()
    )

    if workout is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    db.delete(workout)
    db.commit()

    return {
        "message": "Workout deleted successfully"
    }
