from datetime import date, datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    HealthIntegration,
    DailyActivity,
    ActivitySync
)

from app.schemas import (
    HealthProvider,
    HealthIntegrationConnect,
    HealthIntegrationResponse,
    DailyActivityResponse,
    ActivitySyncResponse
)


router = APIRouter(
    prefix="/health-integrations",
    tags=["Health Integrations"]
)


# ==========================================
# 1. REGISTER HEALTH PROVIDER
# ==========================================

@router.post(
    "/providers/register",
    response_model=HealthIntegrationResponse,
    status_code=status.HTTP_201_CREATED
)
def register_health_provider(
    provider_data: HealthIntegrationConnect,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    existing = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == provider_data.provider
    ).first()

    if existing:
        return existing

    integration = HealthIntegration(
        user_id=current_user.id,
        provider=provider_data.provider,
        status="DISCONNECTED"
    )

    db.add(integration)
    db.commit()
    db.refresh(integration)

    return integration


# ==========================================
# 2. GET REGISTERED HEALTH PROVIDERS
# ==========================================

@router.get(
    "/providers",
    response_model=list[HealthIntegrationResponse]
)
def get_health_providers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return (
        db.query(HealthIntegration)
        .filter(
            HealthIntegration.user_id == current_user.id
        )
        .order_by(HealthIntegration.id.desc())
        .all()
    )


# ==========================================
# 3. DISCONNECT HEALTH PROVIDER
# ==========================================

@router.put(
    "/providers/{provider}/disconnect",
    response_model=HealthIntegrationResponse
)
def disconnect_health_provider(
    provider: HealthProvider,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    integration = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == provider
    ).first()

    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health provider registration not found"
        )

    integration.status = "DISCONNECTED"
    integration.connected_at = None

    db.commit()
    db.refresh(integration)

    return integration


# ==========================================
# 4. GET IMPORTED DAILY ACTIVITIES
# ==========================================

@router.get(
    "/activities",
    response_model=list[DailyActivityResponse]
)
def get_daily_activities(
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(default=30, ge=1, le=366),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date"
        )

    query = db.query(DailyActivity).filter(
        DailyActivity.user_id == current_user.id
    )

    if start_date:
        query = query.filter(
            DailyActivity.activity_date >= start_date
        )

    if end_date:
        query = query.filter(
            DailyActivity.activity_date <= end_date
        )

    return (
        query
        .order_by(DailyActivity.activity_date.desc())
        .limit(limit)
        .all()
    )


# ==========================================
# 5. GET ACTIVITY SYNCHRONIZATION HISTORY
# ==========================================

@router.get(
    "/syncs",
    response_model=list[ActivitySyncResponse]
)
def get_activity_sync_history(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return (
        db.query(ActivitySync)
        .filter(
            ActivitySync.user_id == current_user.id
        )
        .order_by(ActivitySync.started_at.desc())
        .limit(limit)
        .all()
    )



# ==========================================
# 6. SYNCHRONIZE DAILY ACTIVITIES
# ==========================================

@router.post(
    "/sync",
    response_model=ActivitySyncResponse
)
def sync_health_activities(
    payload: ActivitySyncRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    integration = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == payload.provider
    ).first()

    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Health provider is not registered"
        )

    if integration.status != "CONNECTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Health provider is not connected. "
                "Verify device permissions before syncing."
            )
        )

    sync_record = ActivitySync(
        user_id=current_user.id,
        provider=payload.provider,
        status="PENDING",
        records_synced=0
    )

    db.add(sync_record)
    db.commit()
    db.refresh(sync_record)

    sync_id = sync_record.id

    try:
        for activity in payload.activities:

            existing_activity = db.query(DailyActivity).filter(
                DailyActivity.user_id == current_user.id,
                DailyActivity.provider == payload.provider,
                DailyActivity.activity_date == activity.activity_date
            ).first()

            if existing_activity:
                existing_activity.steps = activity.steps
                existing_activity.active_minutes = activity.active_minutes
                existing_activity.calories_burned = activity.calories_burned
                existing_activity.distance_meters = activity.distance_meters

            else:
                new_activity = DailyActivity(
                    user_id=current_user.id,
                    provider=payload.provider,
                    activity_date=activity.activity_date,
                    steps=activity.steps,
                    active_minutes=activity.active_minutes,
                    calories_burned=activity.calories_burned,
                    distance_meters=activity.distance_meters
                )

                db.add(new_activity)

        db.flush()

        sync_record.status = "SUCCESS"
        sync_record.records_synced = len(payload.activities)
        sync_record.completed_at = datetime.utcnow()
        sync_record.error_message = None

        integration.last_sync_at = datetime.utcnow()

        db.commit()
        db.refresh(sync_record)

        return sync_record

    except Exception as exc:
        db.rollback()

        failed_sync = db.query(ActivitySync).filter(
            ActivitySync.id == sync_id,
            ActivitySync.user_id == current_user.id
        ).first()

        if failed_sync:
            failed_sync.status = "FAILED"
            failed_sync.records_synced = 0
            failed_sync.completed_at = datetime.utcnow()
            failed_sync.error_message = str(exc)[:500]

            try:
                db.commit()
            except Exception:
                db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Activity synchronization failed. "
                "No activity records were saved."
            )
        ) from exc

