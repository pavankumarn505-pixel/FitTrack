
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import WorkoutPlan
from app.schemas import (
    WorkoutPlanCreate,
    WorkoutPlanUpdate,
    WorkoutPlanResponse
)


# =====================================
# ROUTER CONFIGURATION
# =====================================

router = APIRouter(
    prefix="/workout-plans",
    tags=["Workout Plans & Scheduling"]
)


# =====================================
# CREATE WORKOUT PLAN
# =====================================

@router.post(
    "/",
    response_model=WorkoutPlanResponse,
    status_code=status.HTTP_201_CREATED
)
def create_workout_plan(
    plan_data: WorkoutPlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    new_plan = WorkoutPlan(
        **plan_data.model_dump(),
        user_id=current_user.id
    )

    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return new_plan


# =====================================
# GET ALL WORKOUT PLANS
# =====================================

@router.get(
    "/",
    response_model=list[WorkoutPlanResponse]
)
def get_workout_plans(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    plans = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.user_id == current_user.id
        )
        .order_by(
            WorkoutPlan.scheduled_date,
            WorkoutPlan.scheduled_time
        )
        .all()
    )

    return plans


# =====================================
# GET UPCOMING WORKOUT PLANS
# =====================================

@router.get(
    "/upcoming",
    response_model=list[WorkoutPlanResponse]
)
def get_upcoming_workout_plans(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    plans = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.user_id == current_user.id,
            WorkoutPlan.scheduled_date >= date.today(),
            WorkoutPlan.status == "Scheduled"
        )
        .order_by(
            WorkoutPlan.scheduled_date,
            WorkoutPlan.scheduled_time
        )
        .all()
    )

    return plans


# =====================================
# GET WORKOUT PLAN BY ID
# =====================================

@router.get(
    "/{plan_id}",
    response_model=WorkoutPlanResponse
)
def get_workout_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    plan = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.id == plan_id,
            WorkoutPlan.user_id == current_user.id
        )
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout plan not found"
        )

    return plan


# =====================================
# UPDATE WORKOUT PLAN
# =====================================

@router.patch(
    "/{plan_id}",
    response_model=WorkoutPlanResponse
)
def update_workout_plan(
    plan_id: int,
    plan_data: WorkoutPlanUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    plan = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.id == plan_id,
            WorkoutPlan.user_id == current_user.id
        )
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout plan not found"
        )

    update_data = plan_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)

    return plan


# =====================================
# DELETE WORKOUT PLAN
# =====================================

@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_200_OK
)
def delete_workout_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    plan = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.id == plan_id,
            WorkoutPlan.user_id == current_user.id
        )
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout plan not found"
        )

    db.delete(plan)
    db.commit()

    return {
        "message": "Workout plan deleted successfully"
    }
