from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database.session import get_db
from ..models.models import BlindSpot, Room
from ..schemas.schemas import BlindSpotResponse
from ..engines.blindspot_engine import BlindSpotEngine

router = APIRouter(prefix="/api/blind-spots", tags=["Blind Spots"])

@router.get("")
def get_blind_spots(db: Session = Depends(get_db)):
    spots = db.query(BlindSpot).order_by(BlindSpot.detected_at.desc()).all()
    rooms = db.query(Room).all()

    room_coverages = []
    for r in rooms:
        cov = BlindSpotEngine.calculate_room_coverage(r.id, db)
        room_coverages.append(cov)

    active_count = db.query(BlindSpot).filter(BlindSpot.status == "ACTIVE").count()

    overall_avg = (
        round(sum([rc["overall_coverage"] for rc in room_coverages]) / len(room_coverages), 1)
        if room_coverages else 100.0
    )

    return {
        "active_blind_spots_count": active_count,
        "prototype_security_coverage": overall_avg,
        "room_coverages": room_coverages,
        "blind_spots": [
            {
                "id": bs.id,
                "room_id": bs.room_id,
                "category": bs.category,
                "severity": bs.severity,
                "description": bs.description,
                "detected_at": bs.detected_at.isoformat() if bs.detected_at else None,
                "resolved_at": bs.resolved_at.isoformat() if bs.resolved_at else None,
                "status": bs.status
            } for bs in spots
        ]
    }
