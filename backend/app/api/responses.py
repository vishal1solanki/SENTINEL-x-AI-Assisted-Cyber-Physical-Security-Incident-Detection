from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.session import get_db
from ..models.models import ResponseAction, User
from ..schemas.schemas import ResponseActionCreate, ResponseActionResponse
from ..services.response_service import ResponseService
from ..services.security import get_current_user, require_role

router = APIRouter(prefix="/api/responses", tags=["Response Center"])

@router.get("", response_model=List[ResponseActionResponse])
def get_responses(incident_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ResponseAction)
    if incident_id:
        query = query.filter(ResponseAction.incident_id == incident_id)
    return query.order_by(ResponseAction.timestamp.desc()).all()

@router.post("/simulate", response_model=ResponseActionResponse)
async def simulate_response(
    action_in: ResponseActionCreate,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    action_type = action_in.action_type.upper()
    if action_type == "QUARANTINE":
        res = await ResponseService.quarantine_device(
            device_id=action_in.device_id,
            reason=action_in.reason,
            db=db,
            incident_id=action_in.incident_id,
            user=current_user
        )
    elif action_type == "RESTORE":
        res = await ResponseService.restore_device(
            device_id=action_in.device_id,
            reason=action_in.reason,
            db=db,
            incident_id=action_in.incident_id,
            user=current_user
        )
    else:
        # Generic response action
        import uuid
        from datetime import datetime, timezone
        from ..models.models import ResponseAction as RAModel
        rec = RAModel(
            id=str(uuid.uuid4()),
            incident_id=action_in.incident_id,
            device_id=action_in.device_id,
            action_type=action_type,
            status="COMPLETED",
            reason=action_in.reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    # Fetch newly created response action
    action_record = db.query(ResponseAction).filter(
        ResponseAction.device_id == action_in.device_id
    ).order_by(ResponseAction.timestamp.desc()).first()
    return action_record
