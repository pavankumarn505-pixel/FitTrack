
from datetime import date, datetime, time
from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ConfigDict,
    model_validator,
    computed_field
)


# ==============================
# USER SCHEMAS
# ==============================

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ==============================
# WORKOUT SCHEMAS
# ==============================

class WorkoutCreate(BaseModel):
    workout_name: str = Field(min_length=2, max_length=100)
    category: Literal["Cardio", "Strength", "Yoga"]
    duration: int = Field(gt=0, le=1440)
    calories_burned: int = Field(ge=0, le=10000)
    workout_date: date


class WorkoutUpdate(BaseModel):
    workout_name: str = Field(min_length=2, max_length=100)
    category: Literal["Cardio", "Strength", "Yoga"]
    duration: int = Field(gt=0, le=1440)
    calories_burned: int = Field(ge=0, le=10000)
    workout_date: date


class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    workout_name: str
    category: str
    duration: int
    calories_burned: int
    workout_date: date
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==============================
# PROGRESS SCHEMAS
# ==============================

class ProgressResponse(BaseModel):
    id: int
    user_id: int
    total_workouts: int
    total_calories: int
    total_duration: int
    date: date

    model_config = ConfigDict(from_attributes=True)


# ==============================
# GOAL SCHEMAS - MODULE 4
# ==============================

GoalType = Literal[
    "Weight Loss",
    "Muscle Gain",
    "Steps"
]

GoalStatus = Literal[
    "NOT_STARTED",
    "IN_PROGRESS",
    "COMPLETED",
    "OVERDUE"
]


# CREATE GOAL

class GoalCreate(BaseModel):

    goal_type: GoalType

    target_value: float = Field(
        gt=0,
        le=10000000
    )

    current_value: float = Field(
        default=0,
        ge=0,
        le=10000000
    )

    deadline: date

    @model_validator(mode="after")
    def validate_goal_values(self):

        if (
            self.goal_type == "Weight Loss"
            and self.current_value <= 0
        ):
            raise ValueError(
                "Current weight must be greater than zero"
            )

        if self.deadline < date.today():
            raise ValueError(
                "Deadline cannot be in the past"
            )

        return self


# UPDATE GOAL

class GoalUpdate(BaseModel):

    target_value: float | None = Field(
        default=None,
        gt=0,
        le=10000000
    )

    current_value: float | None = Field(
        default=None,
        ge=0,
        le=10000000
    )

    deadline: date | None = None

    @model_validator(mode="after")
    def validate_update(self):

        if all(
            value is None
            for value in (
                self.target_value,
                self.current_value,
                self.deadline
            )
        ):
            raise ValueError(
                "At least one field must be provided"
            )

        if (
            self.deadline is not None
            and self.deadline < date.today()
        ):
            raise ValueError(
                "Deadline cannot be in the past"
            )

        return self


# GOAL RESPONSE

class GoalResponse(BaseModel):

    id: int
    user_id: int
    goal_type: GoalType
    target_value: float
    current_value: float
    deadline: date
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def status(self) -> GoalStatus:

        # Weight Loss: lower value means progress.
        if self.goal_type == "Weight Loss":

            if self.current_value <= self.target_value:
                return "COMPLETED"

        # Muscle Gain and Steps: higher value means progress.
        else:

            if self.current_value >= self.target_value:
                return "COMPLETED"

        if self.deadline < date.today():
            return "OVERDUE"

        if self.current_value > 0:
            return "IN_PROGRESS"

        return "NOT_STARTED"


# ==============================
# NOTIFICATION SCHEMAS - MODULE 6
# ==============================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationReadUpdate(BaseModel):
    is_read: bool = True


class NotificationCountResponse(BaseModel):
    unread_count: int




# ==============================
# WORKOUT PLAN SCHEMAS - MODULE 7
# ==============================

# Allowed values
WorkoutPlanCategory = Literal[
    "Cardio",
    "Strength",
    "Yoga"
]

WorkoutPlanStatus = Literal[
    "Scheduled",
    "Completed",
    "Cancelled"
]


# ==============================
# CREATE WORKOUT PLAN
# ==============================

class WorkoutPlanCreate(BaseModel):

    plan_name: str = Field(
        min_length=2,
        max_length=100
    )

    workout_name: str = Field(
        min_length=2,
        max_length=100
    )

    category: WorkoutPlanCategory

    duration: int = Field(
        gt=0,
        le=1440
    )

    scheduled_date: date

    scheduled_time: time

    notes: str | None = Field(
        default=None,
        max_length=500
    )

    @model_validator(mode="after")
    def validate_scheduled_date(self):

        if self.scheduled_date < date.today():
            raise ValueError(
                "Scheduled date cannot be in the past"
            )

        return self


# ==============================
# UPDATE WORKOUT PLAN
# ==============================

class WorkoutPlanUpdate(BaseModel):

    plan_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    workout_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    category: WorkoutPlanCategory | None = None

    duration: int | None = Field(
        default=None,
        gt=0,
        le=1440
    )

    scheduled_date: date | None = None

    scheduled_time: time | None = None

    notes: str | None = Field(
        default=None,
        max_length=500
    )

    status: WorkoutPlanStatus | None = None

    @model_validator(mode="after")
    def validate_update(self):

        if not self.model_fields_set:
            raise ValueError(
                "At least one field must be provided"
            )

        # Only notes can explicitly be set to null.
        for field in self.model_fields_set:
            if field != "notes" and getattr(self, field) is None:
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.scheduled_date is not None
            and self.scheduled_date < date.today()
        ):
            raise ValueError(
                "Scheduled date cannot be in the past"
            )

        return self


# ==============================
# WORKOUT PLAN RESPONSE
# ==============================

class WorkoutPlanResponse(BaseModel):

    id: int
    user_id: int

    plan_name: str
    workout_name: str

    category: WorkoutPlanCategory

    duration: int

    scheduled_date: date
    scheduled_time: time

    notes: str | None = None

    status: WorkoutPlanStatus

    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )




# ==============================
# MODULE 8: EXERCISE LIBRARY
# ==============================

ExerciseCategory = Literal[
    "Cardio",
    "Strength",
    "Yoga"
]


class ExerciseCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    category: ExerciseCategory

    description: str = Field(
        min_length=5,
        max_length=500
    )

    duration: int = Field(
        gt=0,
        le=300
    )


class ExerciseResponse(BaseModel):
    id: int
    name: str
    category: ExerciseCategory
    description: str
    duration: int

    model_config = ConfigDict(
        from_attributes=True
    )


# ==============================
# MODULE 11: ACHIEVEMENT SCHEMAS
# ==============================

class AchievementResponse(BaseModel):
    id: int
    user_id: int

    badge_code: str
    badge_name: str
    description: str

    unlocked_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AchievementProgress(BaseModel):
    badge_code: str
    badge_name: str
    description: str

    current_value: int
    target_value: int

    is_unlocked: bool
    unlocked_at: datetime | None = None


class AchievementSummary(BaseModel):
    total_badges: int
    unlocked_badges: int

    achievements: list[AchievementProgress]

    model_config = ConfigDict(
        from_attributes=True
    )