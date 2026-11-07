
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Goal, User, Notification
from app.schemas import GoalCreate, GoalUpdate, GoalResponse


router = APIRouter(
    prefix="/goals",
    tags=["Goal Management"]
)


# =====================================
# HELPER: CHECK GOAL COMPLETION
# =====================================

def is_goal_completed(goal_type, current_value, target_value):

    if goal_type == "Weight Loss":
        return current_value <= target_value

    return current_value >= target_value


# =====================================
# CREATE GOAL
# =====================================

@router.post(
    "/",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_goal = Goal(
        user_id=current_user.id,
        goal_type=goal_data.goal_type,
        target_value=goal_data.target_value,
        current_value=goal_data.current_value,
        deadline=goal_data.deadline
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


# =====================================
# GET ALL GOALS
# =====================================

@router.get("/", response_model=list[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.created_at.desc())
        .all()
    )


# =====================================
# GET SINGLE GOAL
# =====================================

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    return goal


# =====================================
# UPDATE GOAL + PROGRESS NOTIFICATION
# =====================================

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    update_data = goal_data.model_dump(exclude_unset=True)

    if any(value is None for value in update_data.values()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Goal fields cannot be null"
        )

    old_current = goal.current_value
    old_target = goal.target_value

    new_current = update_data.get(
        "current_value",
        old_current
    )

    new_target = update_data.get(
        "target_value",
        old_target
    )

    new_deadline = update_data.get(
        "deadline",
        goal.deadline
    )

    if goal.goal_type == "Weight Loss" and new_current <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Current weight must be greater than zero"
        )

    if new_deadline < date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Deadline cannot be in the past"
        )

    # Determine whether actual progress was made.
    if goal.goal_type == "Weight Loss":
        progress_made = new_current < old_current
    else:
        progress_made = new_current > old_current

    previously_completed = is_goal_completed(
        goal.goal_type,
        old_current,
        old_target
    )

    for field, value in update_data.items():
        setattr(goal, field, value)

    # Create notification only when progress improves.
    if progress_made:

        now_completed = is_goal_completed(
            goal.goal_type,
            new_current,
            new_target
        )

        if now_completed and not previously_completed:

            notification = Notification(
                user_id=current_user.id,
                title="Goal Completed!",
                message=(
                    f"Congratulations! You completed your "
                    f"{goal.goal_type} goal."
                ),
                is_read=False
            )

        else:

            notification = Notification(
                user_id=current_user.id,
                title="Goal Progress Update",
                message=(
                    f"Great progress on your {goal.goal_type} goal! "
                    f"Your current value is {new_current}, "
                    f"and your target is {new_target}."
                ),
                is_read=False
            )

        db.add(notification)

    db.commit()
    db.refresh(goal)

    return goal


# =====================================
# DELETE GOAL
# =====================================

@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    db.delete(goal)
    db.commit()

    return None
