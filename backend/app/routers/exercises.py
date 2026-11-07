
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Exercise
from app.schemas import (
    ExerciseCreate,
    ExerciseResponse
)
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/exercises",
    tags=["Exercise Library"]
)


# =====================================
# MODULE 8: EXERCISE LIBRARY
# =====================================


# 1. Get All Exercises
# Supports search and category filtering

@router.get(
    "/",
    response_model=list[ExerciseResponse]
)
def get_exercises(
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    query = db.query(Exercise)

    # Search by exercise name or description
    if search and search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            (Exercise.name.ilike(search_term)) |
            (Exercise.description.ilike(search_term))
        )

    # Filter by category
    if category:
        allowed_categories = ["Cardio", "Strength", "Yoga"]

        if category not in allowed_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category. Choose Cardio, Strength, or Yoga."
            )

        query = query.filter(
            Exercise.category == category
        )

    return query.order_by(Exercise.name.asc()).all()


# 2. Get Exercise By ID

@router.get(
    "/{exercise_id}",
    response_model=ExerciseResponse
)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id)
        .first()
    )

    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )

    return exercise


# 3. Add New Exercise

@router.post(
    "/",
    response_model=ExerciseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_exercise(
    exercise_data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    new_exercise = Exercise(
        name=exercise_data.name,
        category=exercise_data.category,
        description=exercise_data.description,
        duration=exercise_data.duration
    )

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise
