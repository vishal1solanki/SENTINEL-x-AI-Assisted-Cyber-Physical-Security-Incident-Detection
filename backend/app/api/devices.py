from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.session import get_db
from ..models.models import Device, User
from ..schemas.schemas import DeviceResponse
from ..services.security import get_current_user, require_role
from ..services.response_service import ResponseService

router = APIRouter(prefix="/api/devices", tags=["Devices"])

@router.get("", response_model=List[DeviceResponse])
def get_devices(room_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Device)
    if room_id:
        query = query.filter(Device.room_id == room_id)
    return query.all()

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found")
    return dev

@router.post("/{device_id}/quarantine")
async def quarantine_device(
    device_id: str,
    reason: str = Body(default="Operator initiated simulated quarantine", embed=True),
    incident_id: Optional[str] = Body(default=None, embed=True),
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    try:
        result = await ResponseService.quarantine_device(
            device_id=device_id,
            reason=reason,
            db=db,
            incident_id=incident_id,
            user=current_user
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{device_id}/restore")
async def restore_device(
    device_id: str,
    reason: str = Body(default="Operator initiated simulated device restoration", embed=True),
    incident_id: Optional[str] = Body(default=None, embed=True),
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    try:
        result = await ResponseService.restore_device(
            device_id=device_id,
            reason=reason,
            db=db,
            incident_id=incident_id,
            user=current_user
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
