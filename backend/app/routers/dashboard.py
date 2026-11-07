
from datetime import date, timedelta
import calendar

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    Workout,
    Goal,
    Achievement,
    WorkoutPlan
)

from app.schemas import (
    GoalResponse,
    AchievementResponse,
    AchievementProgress,
    AchievementSummary,
    WorkoutPlanResponse
)

from app.routers.streaks import (
    calculate_current_streak,
    calculate_longest_streak
)

from app.routers.achievements import (
    BADGES,
    get_user_stats,
    check_and_unlock_achievements
)

from app.routers.analytics import (
    get_analytics_overview,
    fetch_user_workouts,
    build_daily_breakdown,
    WeeklyReport,
    MonthlyReport
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Personalized Dashboard"]
)


# =====================================
# MODULE 12: PERSONALIZED DASHBOARD
# =====================================

@router.get("/personalized")
def get_personalized_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    today = date.today()

    # =================================
    # 1. WORKOUT STREAK
    # =================================

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

    streak = {
        "current_streak": calculate_current_streak(
            workout_dates, today
        ),
        "longest_streak": calculate_longest_streak(
            workout_dates
        ),
        "last_workout_date": (
            workout_dates[-1] if workout_dates else None
        ),
        "worked_out_today": today in workout_dates,
        "total_active_days": len(workout_dates)
    }

    # =================================
    # 2. ACHIEVEMENTS
    # =================================

    check_and_unlock_achievements(
        db, current_user.id
    )

    unlocked = (
        db.query(Achievement)
        .filter(
            Achievement.user_id == current_user.id
        )
        .order_by(Achievement.unlocked_at.desc())
        .all()
    )

    achievements = [
        AchievementResponse.model_validate(item)
        for item in unlocked
    ]

    # =================================
    # 3. ACHIEVEMENT PROGRESS
    # =================================

    stats = get_user_stats(
        db, current_user.id
    )

    unlocked_map = {
        item.badge_code: item
        for item in unlocked
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

    achievement_progress = AchievementSummary(
        total_badges=len(BADGES),
        unlocked_badges=len(unlocked),
        achievements=progress_items
    )

    # =================================
    # 4. UPCOMING WORKOUTS
    # =================================

    upcoming_plans = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.user_id == current_user.id,
            WorkoutPlan.scheduled_date >= today,
            WorkoutPlan.status == "Scheduled"
        )
        .order_by(
            WorkoutPlan.scheduled_date,
            WorkoutPlan.scheduled_time
        )
        .all()
    )

    upcoming_workouts = [
        WorkoutPlanResponse.model_validate(plan)
        for plan in upcoming_plans
    ]

    # =================================
    # 5. OVERALL ANALYTICS
    # =================================

    analytics = get_analytics_overview(
        db, current_user
    )

    # =================================
    # 6. WEEKLY STATISTICS
    # =================================

    week_start = today - timedelta(
        days=today.weekday()
    )

    week_end = week_start + timedelta(days=6)

    weekly_workouts = fetch_user_workouts(
        db,
        current_user.id,
        week_start,
        week_end
    )

    weekly_statistics = WeeklyReport(
        start_date=week_start,
        end_date=week_end,
        total_workouts=len(weekly_workouts),
        total_calories=sum(
            w.calories_burned for w in weekly_workouts
        ),
        total_duration=sum(
            w.duration for w in weekly_workouts
        ),
        daily_breakdown=build_daily_breakdown(
            weekly_workouts,
            week_start,
            week_end
        )
    )

    # =================================
    # 7. MONTHLY STATISTICS
    # =================================

    month_start = today.replace(day=1)

    month_end = date(
        today.year,
        today.month,
        calendar.monthrange(
            today.year,
            today.month
        )[1]
    )

    monthly_workouts = fetch_user_workouts(
        db,
        current_user.id,
        month_start,
        month_end
    )

    monthly_statistics = MonthlyReport(
        year=today.year,
        month=today.month,
        month_name=calendar.month_name[today.month],
        total_workouts=len(monthly_workouts),
        total_calories=sum(
            w.calories_burned for w in monthly_workouts
        ),
        total_duration=sum(
            w.duration for w in monthly_workouts
        ),
        daily_breakdown=build_daily_breakdown(
            monthly_workouts,
            month_start,
            month_end
        )
    )

    # =================================
    # 8. GOAL PROGRESS
    # =================================

    user_goals = (
        db.query(Goal)
        .filter(
            Goal.user_id == current_user.id
        )
        .order_by(Goal.created_at.desc())
        .all()
    )

    goals = [
        GoalResponse.model_validate(goal)
        for goal in user_goals
    ]

    # =================================
    # FINAL DASHBOARD RESPONSE
    # =================================

    return {
        "streak": streak,
        "achievements": achievements,
        "achievement_progress": achievement_progress,
        "upcoming_workouts": upcoming_workouts,
        "analytics": analytics,
        "weekly_statistics": weekly_statistics,
        "monthly_statistics": monthly_statistics,
        "goals": goals
    }
