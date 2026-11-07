
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Workout, Achievement
from app.schemas import (
    AchievementResponse,
    AchievementProgress,
    AchievementSummary
)


router = APIRouter(
    prefix="/achievements",
    tags=["Achievement Badges"]
)


# =====================================
# BADGE DEFINITIONS
# =====================================

BADGES = [
    {
        "badge_code": "WORKOUT_WARRIOR",
        "badge_name": "Workout Warrior",
        "description": "Complete 10 workouts",
        "target_value": 10
    },
    {
        "badge_code": "CONSISTENCY_CHAMPION",
        "badge_name": "Consistency Champion",
        "description": "Maintain a 7-day workout streak",
        "target_value": 7
    },
    {
        "badge_code": "CALORIE_CRUSHER",
        "badge_name": "Calorie Crusher",
        "description": "Burn 5,000 calories",
        "target_value": 5000
    }
]


# =====================================
# CALCULATE WORKOUT STREAK
# =====================================

def calculate_streak(workout_dates):

    if not workout_dates:
        return 0

    longest = 1
    current = 1

    for index in range(1, len(workout_dates)):

        difference = (
            workout_dates[index] -
            workout_dates[index - 1]
        ).days

        if difference == 1:
            current += 1
        else:
            current = 1

        longest = max(longest, current)

    return longest


# =====================================
# GET USER WORKOUT STATISTICS
# =====================================

def get_user_stats(db, user_id):

    workouts = (
        db.query(
            func.count(Workout.id),
            func.coalesce(
                func.sum(Workout.calories_burned), 0
            )
        )
        .filter(Workout.user_id == user_id)
        .first()
    )

    total_workouts = workouts[0] or 0
    total_calories = workouts[1] or 0

    workout_dates = [
        row[0]
        for row in (
            db.query(Workout.workout_date)
            .filter(
                Workout.user_id == user_id,
                Workout.workout_date <= date.today()
            )
            .distinct()
            .order_by(Workout.workout_date.asc())
            .all()
        )
    ]

    longest_streak = calculate_streak(workout_dates)

    return {
        "total_workouts": total_workouts,
        "total_calories": total_calories,
        "longest_streak": longest_streak
    }


# =====================================
# CHECK AND UNLOCK ACHIEVEMENTS
# =====================================

def check_and_unlock_achievements(db, user_id):

    stats = get_user_stats(db, user_id)

    unlocked = (
        db.query(Achievement)
        .filter(Achievement.user_id == user_id)
        .all()
    )

    unlocked_codes = {
        achievement.badge_code
        for achievement in unlocked
    }

    values = {
        "WORKOUT_WARRIOR": stats["total_workouts"],
        "CONSISTENCY_CHAMPION": stats["longest_streak"],
        "CALORIE_CRUSHER": stats["total_calories"]
    }

    new_achievements = []

    for badge in BADGES:

        if badge["badge_code"] in unlocked_codes:
            continue

        if values[badge["badge_code"]] >= badge["target_value"]:

            achievement = Achievement(
                user_id=user_id,
                badge_code=badge["badge_code"],
                badge_name=badge["badge_name"],
                description=badge["description"]
            )

            db.add(achievement)
            new_achievements.append(achievement)

    if new_achievements:
        db.commit()

        for achievement in new_achievements:
            db.refresh(achievement)

    return new_achievements


# =====================================
# GET UNLOCKED ACHIEVEMENTS
# =====================================

@router.get(
    "/",
    response_model=list[AchievementResponse]
)
def get_achievements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    check_and_unlock_achievements(
        db, current_user.id
    )

    return (
        db.query(Achievement)
        .filter(Achievement.user_id == current_user.id)
        .order_by(Achievement.unlocked_at.desc())
        .all()
    )


# =====================================
# GET ACHIEVEMENT PROGRESS
# =====================================

@router.get(
    "/progress",
    response_model=AchievementSummary
)
def get_achievement_progress(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    check_and_unlock_achievements(
        db, current_user.id
    )

    stats = get_user_stats(
        db, current_user.id
    )

    unlocked = (
        db.query(Achievement)
        .filter(Achievement.user_id == current_user.id)
        .all()
    )

    unlocked_map = {
        achievement.badge_code: achievement
        for achievement in unlocked
    }

    values = {
        "WORKOUT_WARRIOR": stats["total_workouts"],
        "CONSISTENCY_CHAMPION": stats["longest_streak"],
        "CALORIE_CRUSHER": stats["total_calories"]
    }

    progress_items = []

    for badge in BADGES:

        achievement = unlocked_map.get(
            badge["badge_code"]
        )

        progress_items.append(
            AchievementProgress(
                badge_code=badge["badge_code"],
                badge_name=badge["badge_name"],
                description=badge["description"],
                current_value=min(
                    values[badge["badge_code"]],
                    badge["target_value"]
                ),
                target_value=badge["target_value"],
                is_unlocked=achievement is not None,
                unlocked_at=(
                    achievement.unlocked_at
                    if achievement else None
                )
            )
        )

    return AchievementSummary(
        total_badges=len(BADGES),
        unlocked_badges=len(unlocked),
        achievements=progress_items
    )


# =====================================
# MANUAL ACHIEVEMENT CHECK
# =====================================

@router.post(
    "/check",
    response_model=list[AchievementResponse]
)
def manually_check_achievements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return check_and_unlock_achievements(
        db, current_user.id
    )
