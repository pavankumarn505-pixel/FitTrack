
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
from app.models import WaterTracking, User

from app.schemas import (
    WaterTrackingCreate,
    WaterTrackingUpdate,
    WaterTrackingResponse,
    WaterDailySummary
)


router = APIRouter(
    prefix="/water",
    tags=["Nutrition & Water Tracking"]
)



# =====================================
# 1. CREATE WATER RECORD
# =====================================

@router.post(
    "/",
    response_model=WaterTrackingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_water_record(
    water_data: WaterTrackingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    new_record = WaterTracking(
        user_id=current_user.id,
        quantity=water_data.quantity,
        date=water_data.date
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# =====================================
# 2. GET ALL USER WATER RECORDS
# =====================================

@router.get(
    "/",
    response_model=list[WaterTrackingResponse]
)
def get_water_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return (
        db.query(WaterTracking)
        .filter(
            WaterTracking.user_id == current_user.id
        )
        .order_by(
            WaterTracking.date.desc(),
            WaterTracking.id.desc()
        )
        .all()
    )


# =====================================
# 3. DAILY WATER SUMMARY
# IMPORTANT: Keep BEFORE /{water_id}
# =====================================

@router.get(
    "/daily-summary",
    response_model=WaterDailySummary
)
def get_daily_water_summary(
    summary_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    target_date = summary_date or date.today()

    total_water = (
        db.query(
            func.coalesce(
                func.sum(WaterTracking.quantity),
                0
            )
        )
        .filter(
            WaterTracking.user_id == current_user.id,
            WaterTracking.date == target_date
        )
        .scalar()
    )

    daily_goal = current_user.daily_water_goal

    remaining_water = max(
        daily_goal - total_water,
        0
    )

    progress_percentage = round(
        (total_water / daily_goal) * 100,
        2
    )

    return {
        "date": target_date,
        "total_water": total_water,
        "daily_goal": daily_goal,
        "remaining_water": remaining_water,
        "progress_percentage": progress_percentage
    }


# =====================================
# 4. GET WATER RECORD BY ID
# =====================================

@router.get(
    "/{water_id}",
    response_model=WaterTrackingResponse
)
def get_water_record(
    water_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(WaterTracking)
        .filter(
            WaterTracking.id == water_id,
            WaterTracking.user_id == current_user.id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water record not found"
        )

    return record


# =====================================
# 5. UPDATE WATER RECORD
# =====================================

@router.put(
    "/{water_id}",
    response_model=WaterTrackingResponse
)
def update_water_record(
    water_id: int,
    water_data: WaterTrackingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(WaterTracking)
        .filter(
            WaterTracking.id == water_id,
            WaterTracking.user_id == current_user.id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water record not found"
        )

    update_data = water_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return record


# =====================================
# 6. DELETE WATER RECORD
# =====================================

@router.delete("/{water_id}")
def delete_water_record(
    water_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(WaterTracking)
        .filter(
            WaterTracking.id == water_id,
            WaterTracking.user_id == current_user.id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water record not found"
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Water record deleted successfully"
    }

