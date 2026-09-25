from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database.session import get_db
from ..models.models import Sensor, SensorTrustHistory
from ..engines.trust_engine import TrustEngine

router = APIRouter(prefix="/api/trust", tags=["Sensor Trust"])

@router.get("")
def get_trust_overview(db: Session = Depends(get_db)):
    sensors = db.query(Sensor).all()
    if not sensors:
        return {
            "average_trust": 100.0,
            "total_sensors": 0,
            "distribution": {"high": 0, "moderate": 0, "low": 0, "critical": 0},
            "sensors": []
        }

    scores = [s.trust_score for s in sensors]
    avg_trust = round(sum(scores) / len(scores), 1)

    distribution = {"high": 0, "moderate": 0, "low": 0, "critical": 0}
    sensor_list = []

    for s in sensors:
        cat = TrustEngine.get_trust_category(s.trust_score)
        if cat == "HIGH TRUST":
            distribution["high"] += 1
        elif cat == "MODERATE TRUST":
            distribution["moderate"] += 1
        elif cat == "LOW TRUST":
            distribution["low"] += 1
        else:
            distribution["critical"] += 1

        sensor_list.append({
            "id": s.id,
            "device_id": s.device_id,
            "sensor_type": s.sensor_type,
            "status": s.status,
            "trust_score": s.trust_score,
            "trust_category": cat,
            "last_event": s.last_event.isoformat() if s.last_event else None
        })

    return {
        "average_trust": avg_trust,
        "total_sensors": len(sensors),
        "distribution": distribution,
        "sensors": sorted(sensor_list, key=lambda x: x["trust_score"])
    }

@router.get("/history/{sensor_id}")
def get_sensor_trust_history(sensor_id: str, db: Session = Depends(get_db)):
    s = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found")

    history = db.query(SensorTrustHistory).filter(
        SensorTrustHistory.sensor_id == sensor_id
    ).order_by(SensorTrustHistory.timestamp.asc()).all()

    return {
        "sensor_id": s.id,
        "current_score": s.trust_score,
        "category": TrustEngine.get_trust_category(s.trust_score),
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
