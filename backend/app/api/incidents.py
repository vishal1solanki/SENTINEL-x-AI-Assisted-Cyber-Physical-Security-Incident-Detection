from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.models import Incident, IncidentEvent, Event, Sensor, Room, Device, BlindSpot, User
from ..schemas.schemas import IncidentResponse, IncidentDetailResponse, EventResponse
from ..ai.investigator import AIInvestigator
from ..services.security import get_current_user, require_role, log_audit_action
from ..websocket.connection_manager import ws_manager

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    room_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if room_id:
        query = query.filter(Incident.room_id == room_id)

    incidents = query.order_by(Incident.started_at.desc()).all()
    results = []
    for inc in incidents:
        ev_count = len(inc.event_associations)
        # calculate sum of trust impacts from associated events
        impact = sum([assoc.event.trust_impact for assoc in inc.event_associations if assoc.event])
        res = IncidentResponse(
            id=inc.id,
            title=inc.title,
            incident_type=inc.incident_type,
            severity=inc.severity,
            risk_level=inc.risk_level,
            status=inc.status,
            room_id=inc.room_id,
            started_at=inc.started_at,
            resolved_at=inc.resolved_at,
            summary=inc.summary,
            ai_analysis=inc.ai_analysis,
            confidence=inc.confidence,
            evidence_count=ev_count,
            trust_impact=impact
        )
        results.append(res)
    return results

@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    events = [assoc.event for assoc in inc.event_associations if assoc.event]
    events_sorted = sorted(events, key=lambda e: e.timestamp)

    # Get affected sensors in the room
    sensors = db.query(Sensor).join(Device).filter(Device.room_id == inc.room_id).all()
    sensor_dicts = [
        {
            "id": s.id,
            "sensor_type": s.sensor_type,
            "status": s.status,
            "trust_score": s.trust_score,
            "device_id": s.device_id
        } for s in sensors
    ]

    # Get active blind spots
    blind_spots = db.query(BlindSpot).filter(
        BlindSpot.room_id == inc.room_id,
        BlindSpot.status == "ACTIVE"
    ).all()
    bs_dicts = [
        {
            "id": bs.id,
            "category": bs.category,
            "severity": bs.severity,
            "description": bs.description
        } for bs in blind_spots
    ]

    ev_responses = [EventResponse.model_validate(e) for e in events_sorted]
    impact = sum([e.trust_impact for e in events_sorted])

    return IncidentDetailResponse(
        id=inc.id,
        title=inc.title,
        incident_type=inc.incident_type,
        severity=inc.severity,
        risk_level=inc.risk_level,
        status=inc.status,
        room_id=inc.room_id,
        started_at=inc.started_at,
        resolved_at=inc.resolved_at,
        summary=inc.summary,
        ai_analysis=inc.ai_analysis,
        confidence=inc.confidence,
        evidence_count=len(events_sorted),
        trust_impact=impact,
        events=ev_responses,
        affected_sensors=sensor_dicts,
        blind_spots=bs_dicts
    )

@router.post("/{incident_id}/acknowledge")
async def acknowledge_incident(
    incident_id: str,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    inc.status = "ACKNOWLEDGED"
    db.commit()

    log_audit_action(
        db=db,
        action="ACKNOWLEDGE_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.id,
        details={"acknowledged_by": current_user.email},
        user_id=current_user.id
    )

    await ws_manager.broadcast_event("INCIDENT_ACKNOWLEDGED", {"id": inc.id, "status": "ACKNOWLEDGED"})
    return {"status": "SUCCESS", "message": f"Incident {inc.id} acknowledged."}

@router.post("/{incident_id}/investigate")
async def investigate_incident(
    incident_id: str,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    inc.status = "INVESTIGATING"

    events = [assoc.event for assoc in inc.event_associations if assoc.event]
    events_data = [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "event_type": e.event_type,
            "source_device_id": e.source_device_id,
            "severity": e.severity,
            "metadata": e.metadata_json
        } for e in events
    ]

    room = db.query(Room).filter(Room.id == inc.room_id).first()
    room_data = {"id": room.id, "name": room.name, "security_level": room.security_level} if room else {"id": inc.room_id, "name": inc.room_id}

    sensors = db.query(Sensor).join(Device).filter(Device.room_id == inc.room_id).all()
    sensors_data = [
        {"id": s.id, "sensor_type": s.sensor_type, "status": s.status, "trust_score": s.trust_score}
        for s in sensors
    ]

    blind_spots = db.query(BlindSpot).filter(BlindSpot.room_id == inc.room_id, BlindSpot.status == "ACTIVE").all()
    blind_spots_data = [{"id": bs.id, "category": bs.category, "description": bs.description} for bs in blind_spots]

    # Trigger AI Investigation (with demo fallback)
    ai_result = await AIInvestigator.investigate_incident(
        incident_data={"id": inc.id, "title": inc.title, "incident_type": inc.incident_type, "severity": inc.severity, "risk_level": inc.risk_level},
        events=events_data,
        room_data=room_data,
        sensors=sensors_data,
        blind_spots=blind_spots_data
    )

    inc.ai_analysis = ai_result
    if ai_result.get("risk_level"):
        inc.risk_level = ai_result["risk_level"]
    if ai_result.get("confidence"):
        inc.confidence = float(ai_result["confidence"])

    db.commit()

    log_audit_action(
        db=db,
        action="INVESTIGATE_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.id,
        details={"investigated_by": current_user.email, "engine": ai_result.get("investigator_engine")},
        user_id=current_user.id
    )

    await ws_manager.broadcast_event("INCIDENT_INVESTIGATED", {"id": inc.id, "ai_analysis": ai_result})
    return ai_result

@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    current_user: User = Depends(require_role(["ADMIN", "SOC_ANALYST"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    inc.status = "RESOLVED"
    inc.resolved_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_action(
        db=db,
        action="RESOLVE_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.id,
        details={"resolved_by": current_user.email},
        user_id=current_user.id
    )

    await ws_manager.broadcast_event("INCIDENT_RESOLVED", {"id": inc.id, "status": "RESOLVED"})
    return {"status": "SUCCESS", "message": f"Incident {inc.id} marked as RESOLVED."}

@router.get("/{incident_id}/timeline")
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    events = [assoc.event for assoc in inc.event_associations if assoc.event]
    events_sorted = sorted(events, key=lambda e: e.timestamp)

    timeline = []
    for e in events_sorted:
        timeline.append({
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "event_type": e.event_type,
            "source_device_id": e.source_device_id,
            "severity": e.severity,
            "trust_impact": e.trust_impact,
            "metadata": e.metadata_json
        })

    return {
        "incident_id": inc.id,
        "title": inc.title,
        "started_at": inc.started_at.isoformat(),
        "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
        "events": timeline
    }
