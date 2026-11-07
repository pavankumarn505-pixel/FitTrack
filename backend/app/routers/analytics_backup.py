
from datetime import date, timedelta
import calendar

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Workout


router = APIRouter(
    prefix="/analytics",
    tags=["Reports & Analytics"]
)


# =====================================
# RESPONSE SCHEMAS
# =====================================

class DailyAnalytics(BaseModel):
    date: date
    total_workouts: int
    total_calories: int
    total_duration: int


class WeeklyReport(BaseModel):
    start_date: date
    end_date: date
    total_workouts: int
    total_calories: int
    total_duration: int
    daily_breakdown: list[DailyAnalytics]


class MonthlyReport(BaseModel):
    year: int
    month: int
    month_name: str
    total_workouts: int
    total_calories: int
    total_duration: int
    daily_breakdown: list[DailyAnalytics]


class CaloriesReport(BaseModel):
    start_date: date
    end_date: date
    total_calories: int
    daily_breakdown: list[DailyAnalytics]


class AnalyticsOverview(BaseModel):
    total_workouts: int
    total_calories: int
    total_duration: int
    weekly_workouts: int
    weekly_calories: int
    monthly_workouts: int
    monthly_calories: int


# =====================================
# HELPER: BUILD DAILY BREAKDOWN
# =====================================

def build_daily_breakdown(workouts, start_date, end_date):
    daily_data = {}

    current_date = start_date

    while current_date <= end_date:
        daily_data[current_date] = {
            "total_workouts": 0,
            "total_calories": 0,
            "total_duration": 0
        }
        current_date += timedelta(days=1)

    for workout in workouts:
        day = workout.workout_date

        if day not in daily_data:
            continue

        daily_data[day]["total_workouts"] += 1
        daily_data[day]["total_calories"] += workout.calories_burned
        daily_data[day]["total_duration"] += workout.duration

    return [
        DailyAnalytics(
            date=day,
            **values
        )
        for day, values in sorted(daily_data.items())
    ]


# =====================================
# HELPER: FETCH USER WORKOUTS
# =====================================

def fetch_user_workouts(db, user_id, start_date, end_date):
    return (
        db.query(Workout)
        .filter(
            Workout.user_id == user_id,
            Workout.workout_date >= start_date,
            Workout.workout_date <= end_date
        )
        .order_by(Workout.workout_date.asc())
        .all()
    )


# =====================================
# 1. WEEKLY WORKOUT SUMMARY
# =====================================

@router.get("/weekly", response_model=WeeklyReport)
def get_weekly_report(
    start_date: date | None = Query(
        default=None,
        description="Monday date of the requested week"
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = date.today()

    if start_date is None:
        start_date = today - timedelta(days=today.weekday())

    if start_date.weekday() != 0:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=422,
            detail="start_date must be a Monday"
        )

    end_date = start_date + timedelta(days=6)

    workouts = fetch_user_workouts(
        db,
        current_user.id,
        start_date,
        end_date
    )

    daily = build_daily_breakdown(
        workouts,
        start_date,
        end_date
    )

    return WeeklyReport(
        start_date=start_date,
        end_date=end_date,
        total_workouts=len(workouts),
        total_calories=sum(w.calories_burned for w in workouts),
        total_duration=sum(w.duration for w in workouts),
        daily_breakdown=daily
    )


# =====================================
# 2. MONTHLY PROGRESS REPORT
# =====================================

@router.get("/monthly", response_model=MonthlyReport)
def get_monthly_report(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = date.today()

    selected_year = year if year is not None else today.year
    selected_month = month if month is not None else today.month

    last_day = calendar.monthrange(
        selected_year,
        selected_month
    )[1]

    start_date = date(selected_year, selected_month, 1)
    end_date = date(selected_year, selected_month, last_day)

    workouts = fetch_user_workouts(
        db,
        current_user.id,
        start_date,
        end_date
    )

    daily = build_daily_breakdown(
        workouts,
        start_date,
        end_date
    )

    return MonthlyReport(
        year=selected_year,
        month=selected_month,
        month_name=calendar.month_name[selected_month],
        total_workouts=len(workouts),
        total_calories=sum(w.calories_burned for w in workouts),
        total_duration=sum(w.duration for w in workouts),
        daily_breakdown=daily
    )


# =====================================
# 3. CALORIES TRACKING REPORT
# =====================================

@router.get("/calories", response_model=CaloriesReport)
def get_calories_report(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    workouts = fetch_user_workouts(
        db,
        current_user.id,
        start_date,
        end_date
    )

    daily = build_daily_breakdown(
        workouts,
        start_date,
        end_date
    )

    return CaloriesReport(
        start_date=start_date,
        end_date=end_date,
        total_calories=sum(w.calories_burned for w in workouts),
        daily_breakdown=daily
    )


# =====================================
# 4. ANALYTICS OVERVIEW
# =====================================

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = date.today()

    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    all_workouts = (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .all()
    )

    weekly_workouts = [
        w for w in all_workouts
        if week_start <= w.workout_date <= today
    ]

    monthly_workouts = [
        w for w in all_workouts
        if month_start <= w.workout_date <= today
    ]

    return AnalyticsOverview(
        total_workouts=len(all_workouts),
        total_calories=sum(
            w.calories_burned for w in all_workouts
        ),
        total_duration=sum(
            w.duration for w in all_workouts
        ),
        weekly_workouts=len(weekly_workouts),
        weekly_calories=sum(
            w.calories_burned for w in weekly_workouts
        ),
        monthly_workouts=len(monthly_workouts),
        monthly_calories=sum(
            w.calories_burned for w in monthly_workouts
        )
    )
