
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Meal

from app.schemas import (
    MealCreate,
    MealUpdate,
    MealResponse
)


router = APIRouter(
    prefix="/meals",
    tags=["Nutrition & Meal Tracking"]
)


# =====================================
# 1. CREATE MEAL
# =====================================

@router.post(
    "/",
    response_model=MealResponse,
    status_code=status.HTTP_201_CREATED
)
def create_meal(
    meal_data: MealCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    new_meal = Meal(
        user_id=current_user.id,
        meal_type=meal_data.meal_type,
        food_name=meal_data.food_name,
        calories=meal_data.calories,
        protein=meal_data.protein,
        carbs=meal_data.carbs,
        fats=meal_data.fats
    )

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal


# =====================================
# 2. GET ALL USER MEALS
# =====================================

@router.get(
    "/",
    response_model=list[MealResponse]
)
def get_meals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return (
        db.query(Meal)
        .filter(Meal.user_id == current_user.id)
        .order_by(Meal.created_at.desc())
        .all()
    )


# =====================================
# 3. DAILY NUTRITION SUMMARY
# IMPORTANT: Keep BEFORE /{meal_id}
# =====================================

@router.get("/daily-summary")
def get_daily_nutrition_summary(
    summary_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    target_date = summary_date or date.today()

    totals = (
        db.query(
            func.coalesce(
                func.sum(Meal.calories), 0
            ).label("total_calories"),

            func.coalesce(
                func.sum(Meal.protein), 0
            ).label("total_protein"),

            func.coalesce(
                func.sum(Meal.carbs), 0
            ).label("total_carbs"),

            func.coalesce(
                func.sum(Meal.fats), 0
            ).label("total_fats")
        )
        .filter(
            Meal.user_id == current_user.id,
            func.date(Meal.created_at) == target_date.isoformat()
        )
        .first()
    )

    return {
        "date": target_date,
        "total_calories": totals.total_calories,
        "total_protein": totals.total_protein,
        "total_carbs": totals.total_carbs,
        "total_fats": totals.total_fats
    }


# =====================================
# 4. GET MEAL BY ID
# =====================================

@router.get(
    "/{meal_id}",
    response_model=MealResponse
)
def get_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    meal = (
        db.query(Meal)
        .filter(
            Meal.id == meal_id,
            Meal.user_id == current_user.id
        )
        .first()
    )

    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    return meal


# =====================================
# 5. UPDATE MEAL
# =====================================

@router.put(
    "/{meal_id}",
    response_model=MealResponse
)
def update_meal(
    meal_id: int,
    meal_data: MealUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    meal = (
        db.query(Meal)
        .filter(
            Meal.id == meal_id,
            Meal.user_id == current_user.id
        )
        .first()
    )

    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    update_data = meal_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(meal, field, value)

    db.commit()
    db.refresh(meal)

    return meal


# =====================================
# 6. DELETE MEAL
# =====================================

@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    meal = (
        db.query(Meal)
        .filter(
            Meal.id == meal_id,
            Meal.user_id == current_user.id
        )
        .first()
    )

    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    db.delete(meal)
    db.commit()

    return {
        "message": "Meal deleted successfully"
    }
