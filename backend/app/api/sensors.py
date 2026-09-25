from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.session import get_db
from ..models.models import Sensor, SensorTrustHistory
from ..schemas.schemas import SensorResponse, SensorTrustHistoryResponse
from ..engines.trust_engine import TrustEngine

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])

@router.get("", response_model=List[SensorResponse])
def get_sensors(device_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Sensor)
    if device_id:
        query = query.filter(Sensor.device_id == device_id)
    sensors = query.all()
    results = []
    for s in sensors:
        cat = TrustEngine.get_trust_category(s.trust_score)
        res = SensorResponse(
            id=s.id,
            device_id=s.device_id,
            sensor_type=s.sensor_type,
            status=s.status,
            trust_score=s.trust_score,
            last_event=s.last_event,
            created_at=s.created_at,
            trust_category=cat
        )
        results.append(res)
    return results

@router.get("/{sensor_id}", response_model=SensorResponse)
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    s = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found")
    cat = TrustEngine.get_trust_category(s.trust_score)
    return SensorResponse(
        id=s.id,
        device_id=s.device_id,
        sensor_type=s.sensor_type,
        status=s.status,
        trust_score=s.trust_score,
        last_event=s.last_event,
        created_at=s.created_at,
        trust_category=cat
    )

@router.get("/{sensor_id}/trust")
def get_sensor_trust(sensor_id: str, db: Session = Depends(get_db)):
    s = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found")
    history = db.query(SensorTrustHistory).filter(
        SensorTrustHistory.sensor_id == sensor_id
    ).order_by(SensorTrustHistory.timestamp.desc()).limit(50).all()

    return {
        "sensor_id": s.id,
        "device_id": s.device_id,
        "trust_score": s.trust_score,
        "trust_category": TrustEngine.get_trust_category(s.trust_score),
        "status": s.status,
        "history": [
            {
                "id": h.id,
                "old_score": h.old_score,
                "new_score": h.new_score,
                "reason": h.reason,
                "timestamp": h.timestamp.isoformat()
            } for h in history
        ]
    }
