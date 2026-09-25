from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.session import get_db
from ..models.models import Room, Device, Incident
from ..schemas.schemas import RoomResponse
from ..engines.blindspot_engine import BlindSpotEngine

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    results = []
    for r in rooms:
        dev_count = db.query(Device).filter(Device.room_id == r.id).count()
        inc_count = db.query(Incident).filter(Incident.room_id == r.id, Incident.status != "RESOLVED").count()
        coverage = BlindSpotEngine.calculate_room_coverage(r.id, db)
        results.append(
            RoomResponse(
                id=r.id,
                name=r.name,
                description=r.description,
                security_level=r.security_level,
                created_at=r.created_at,
                device_count=dev_count,
                active_incidents_count=inc_count,
                coverage_score=coverage.get("overall_coverage", 100.0)
            )
        )
    return results

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: str, db: Session = Depends(get_db)):
    r = db.query(Room).filter(Room.id == room_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found")

    dev_count = db.query(Device).filter(Device.room_id == r.id).count()
    inc_count = db.query(Incident).filter(Incident.room_id == r.id, Incident.status != "RESOLVED").count()
    coverage = BlindSpotEngine.calculate_room_coverage(r.id, db)

    return RoomResponse(
        id=r.id,
        name=r.name,
        description=r.description,
        security_level=r.security_level,
        created_at=r.created_at,
        device_count=dev_count,
        active_incidents_count=inc_count,
        coverage_score=coverage.get("overall_coverage", 100.0)
    )
