from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
from ..database.session import get_db
from ..models.models import Incident, Sensor, Device, BlindSpot, ResponseAction
from ..services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{incident_id}")
def get_incident_report(
    incident_id: str,
    format: str = Query(default="json", description="json | html"),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

    events = [assoc.event for assoc in inc.event_associations if assoc.event]
    events_data = [
        {
            "id": e.id,
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": e.event_type,
            "source_device_id": e.source_device_id,
            "severity": e.severity,
            "metadata": e.metadata_json
        } for e in sorted(events, key=lambda x: x.timestamp)
    ]

    sensors = db.query(Sensor).join(Device).filter(Device.room_id == inc.room_id).all()
    sensors_data = [
        {"id": s.id, "sensor_type": s.sensor_type, "status": s.status, "trust_score": s.trust_score}
        for s in sensors
    ]

    blind_spots = db.query(BlindSpot).filter(BlindSpot.room_id == inc.room_id).all()
    bs_data = [
        {"id": bs.id, "category": bs.category, "severity": bs.severity, "description": bs.description, "status": bs.status}
        for bs in blind_spots
    ]

    actions = db.query(ResponseAction).filter(ResponseAction.incident_id == inc.id).all()
    actions_data = [
        {
            "id": a.id,
            "device_id": a.device_id,
            "action_type": a.action_type,
            "status": a.status,
            "reason": a.reason,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for a in actions
    ]

    report_payload = {
        "incident": {
            "id": inc.id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "risk_level": inc.risk_level,
            "status": inc.status,
            "room_id": inc.room_id,
            "started_at": inc.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            "resolved_at": inc.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if inc.resolved_at else None,
            "summary": inc.summary,
            "ai_analysis": inc.ai_analysis,
            "confidence": inc.confidence
        },
        "events": events_data,
        "sensors": sensors_data,
        "blind_spots": bs_data,
        "response_actions": actions_data
    }

    if format.lower() == "html":
        html_content = ReportService.generate_html_report(report_payload)
        return HTMLResponse(content=html_content, status_code=200)

    return report_payload
