from datetime import date

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

