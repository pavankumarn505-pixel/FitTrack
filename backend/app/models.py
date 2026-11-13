
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Time,
    Float,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ==============================
# USER MODEL
# ==============================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    daily_water_goal = Column(
        Integer,
        default=2000,
        nullable=False
    )

    # MODULE 19: USER TIMEZONE FOR REMINDERS
    timezone = Column(
        String(64),
        default="UTC",
        server_default="UTC",
        nullable=False
    )

    workouts = relationship(
        "Workout",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    progress_records = relationship(
        "Progress",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    goals = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # MODULE 19: REMINDER MANAGEMENT
    reminders = relationship(
        "Reminder",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # MODULE 7: WORKOUT PLANS
    workout_plans = relationship(
        "WorkoutPlan",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # MODULE 13: NUTRITION & MEAL TRACKING
    meals = relationship(
        "Meal",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # MODULE 14: WATER INTAKE TRACKER
    water_records = relationship(
        "WaterTracking",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # MODULE 17: HEALTH INTEGRATION
    health_integrations = relationship(
        "HealthIntegration",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    daily_activities = relationship(
        "DailyActivity",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    activity_syncs = relationship(
        "ActivitySync",
        back_populates="user",
        cascade="all, delete-orphan"
    )



# ==============================
# WORKOUT MODEL
# ==============================

class Workout(Base):
    __tablename__ = "workouts"

    __table_args__ = (
        CheckConstraint(
            "category IN ('Cardio', 'Strength', 'Yoga')",
            name="check_workout_category"
        ),
        CheckConstraint(
            "duration > 0",
            name="check_workout_duration"
        ),
        CheckConstraint(
            "calories_burned >= 0",
            name="check_workout_calories"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    workout_name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)
    duration = Column(Integer, nullable=False)
    calories_burned = Column(Integer, nullable=False)
    workout_date = Column(Date, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship("User", back_populates="workouts")


# ==============================
# PROGRESS MODEL
# ==============================

class Progress(Base):
    __tablename__ = "progress"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "date",
            name="uq_progress_user_date"
        ),
        CheckConstraint(
            "total_workouts >= 0",
            name="check_progress_workouts"
        ),
        CheckConstraint(
            "total_calories >= 0",
            name="check_progress_calories"
        ),
        CheckConstraint(
            "total_duration >= 0",
            name="check_progress_duration"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    total_workouts = Column(Integer, nullable=False, default=0)
    total_calories = Column(Integer, nullable=False, default=0)
    total_duration = Column(Integer, nullable=False, default=0)
    date = Column(Date, nullable=False)

    user = relationship("User", back_populates="progress_records")


# ==============================
# GOAL MODEL
# ==============================

class Goal(Base):
    __tablename__ = "goals"

    __table_args__ = (
        CheckConstraint(
            "goal_type IN ('Weight Loss', 'Muscle Gain', 'Steps')",
            name="check_goal_type"
        ),
        CheckConstraint(
            "target_value > 0",
            name="check_goal_target"
        ),
        CheckConstraint(
            "current_value >= 0",
            name="check_goal_current"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    goal_type = Column(String(30), nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False, default=0)
    deadline = Column(Date, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship("User", back_populates="goals")


# ==============================
# NOTIFICATION MODEL - MODULE 6
# ==============================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0",
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )


# ==============================
# WORKOUT PLAN MODEL - MODULE 7
# ==============================

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    __table_args__ = (
        CheckConstraint(
            "category IN ('Cardio', 'Strength', 'Yoga')",
            name="check_plan_category"
        ),
        CheckConstraint(
            "duration > 0",
            name="check_plan_duration"
        ),
        CheckConstraint(
            "status IN ('Scheduled', 'Completed', 'Cancelled')",
            name="check_plan_status"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    plan_name = Column(String(100), nullable=False)
    workout_name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)
    duration = Column(Integer, nullable=False)

    scheduled_date = Column(
        Date,
        nullable=False,
        index=True
    )

    scheduled_time = Column(Time, nullable=False)
    notes = Column(String(500), nullable=True)

    status = Column(
        String(20),
        nullable=False,
        default="Scheduled",
        server_default="Scheduled"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="workout_plans"
    )


# ==============================
# EXERCISE MODEL - MODULE 8
# ==============================

class Exercise(Base):
    __tablename__ = "exercises"

    __table_args__ = (
        CheckConstraint(
            "category IN ('Cardio', 'Strength', 'Yoga')",
            name="check_exercise_category"
        ),
        CheckConstraint(
            "duration > 0",
            name="check_exercise_duration"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False,
        index=True
    )

    category = Column(
        String(20),
        nullable=False,
        index=True
    )

    description = Column(String(500), nullable=False)
    duration = Column(Integer, nullable=False)


# ==============================
# MODULE 11: ACHIEVEMENT MODEL
# ==============================

class Achievement(Base):
    __tablename__ = "achievements"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "badge_code",
            name="uq_user_achievement"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    badge_code = Column(String(50), nullable=False)
    badge_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)

    unlocked_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        backref="achievements"
    )


# ==============================
# MODULE 13: NUTRITION & MEAL TRACKING
# ==============================

class Meal(Base):
    __tablename__ = "meals"

    __table_args__ = (
        CheckConstraint(
            "meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks')",
            name="check_meal_type"
        ),
        CheckConstraint(
            "calories >= 0",
            name="check_meal_calories"
        ),
        CheckConstraint(
            "protein >= 0",
            name="check_meal_protein"
        ),
        CheckConstraint(
            "carbs >= 0",
            name="check_meal_carbs"
        ),
        CheckConstraint(
            "fats >= 0",
            name="check_meal_fats"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    meal_type = Column(String(20), nullable=False)
    food_name = Column(String(150), nullable=False)

    calories = Column(Float, nullable=False)

    protein = Column(
        Float,
        nullable=False,
        default=0
    )

    carbs = Column(
        Float,
        nullable=False,
        default=0
    )

    fats = Column(
        Float,
        nullable=False,
        default=0
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="meals"
    )


# ==============================
# MODULE 14: WATER INTAKE TRACKER
# ==============================

class WaterTracking(Base):

    __tablename__ = "water_tracking"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="check_water_quantity"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    date = Column(
        Date,
        nullable=False,
        index=True
    )

    user = relationship(
        "User",
        back_populates="water_records"
    )



# ==========================================
# MODULE 17: THIRD-PARTY HEALTH INTEGRATION
# ==========================================

class HealthIntegration(Base):

    __tablename__ = "health_integrations"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "provider",
            name="uq_health_integration_user_provider"
        ),
        CheckConstraint(
            "provider IN ('HEALTH_CONNECT', 'APPLE_HEALTH')",
            name="check_health_integration_provider"
        ),
        CheckConstraint(
            "status IN ('CONNECTED', 'DISCONNECTED', 'PERMISSION_DENIED')",
            name="check_health_integration_status"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    provider = Column(String(30), nullable=False)
    status = Column(String(30), nullable=False, default="DISCONNECTED")

    connected_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User", back_populates="health_integrations")


class DailyActivity(Base):

    __tablename__ = "daily_activities"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "provider",
            "activity_date",
            name="uq_daily_activity_user_provider_date"
        ),
        CheckConstraint(
            "provider IN ('HEALTH_CONNECT', 'APPLE_HEALTH')",
            name="check_daily_activity_provider"
        ),
        CheckConstraint("steps >= 0", name="check_daily_activity_steps"),
        CheckConstraint(
            "active_minutes >= 0",
            name="check_daily_activity_active_minutes"
        ),
        CheckConstraint(
            "calories_burned >= 0",
            name="check_daily_activity_calories"
        ),
        CheckConstraint(
            "distance_meters >= 0",
            name="check_daily_activity_distance"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    provider = Column(String(30), nullable=False)
    activity_date = Column(Date, nullable=False, index=True)

    steps = Column(Integer, nullable=False, default=0)
    active_minutes = Column(Integer, nullable=False, default=0)
    calories_burned = Column(Float, nullable=False, default=0)
    distance_meters = Column(Float, nullable=False, default=0)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User", back_populates="daily_activities")


class ActivitySync(Base):

    __tablename__ = "activity_syncs"

    __table_args__ = (
        CheckConstraint(
            "provider IN ('HEALTH_CONNECT', 'APPLE_HEALTH')",
            name="check_activity_sync_provider"
        ),
        CheckConstraint(
            "status IN ('PENDING', 'SUCCESS', 'FAILED', 'PARTIAL')",
            name="check_activity_sync_status"
        ),
        CheckConstraint(
            "records_synced >= 0",
            name="check_activity_sync_records"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    provider = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    records_synced = Column(Integer, nullable=False, default=0)

    started_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(String(500), nullable=True)

    user = relationship("User", back_populates="activity_syncs")



# ==============================
# REMINDER MODEL - MODULE 19
# ==============================

class Reminder(Base):

    __tablename__ = "reminders"

    __table_args__ = (
        CheckConstraint(
            "reminder_type IN ('WORKOUT', 'MEAL', 'WATER')",
            name="check_reminder_type"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    reminder_type = Column(String(20), nullable=False)

    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)

    reminder_time = Column(Time, nullable=False)

    # Comma-separated weekday codes, e.g. MON,TUE,WED
    repeat_days = Column(String(100), nullable=False)

    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    is_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
        index=True
    )

    last_triggered_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="reminders"
    )
