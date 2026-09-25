import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.models import Event, Device, Sensor
from ..schemas.schemas import EventCreate, EventResponse
from ..engines.correlation_engine import CorrelationEngine
from ..websocket.connection_manager import ws_manager

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=List[EventResponse])
def get_events(
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    room_id: Optional[str] = None,
    source_device_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if severity:
        query = query.filter(Event.severity == severity)
    if room_id:
        query = query.filter(Event.room_id == room_id)
    if source_device_id:
        query = query.filter(Event.source_device_id == source_device_id)

    return query.order_by(Event.timestamp.desc()).offset(offset).limit(limit).all()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    # Auto-resolve room_id if missing from device
    room_id = event_in.room_id
    if not room_id:
        device = db.query(Device).filter(Device.id == event_in.source_device_id).first()
        if device:
            room_id = device.room_id

    event = Event(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        event_type=event_in.event_type,
        source_device_id=event_in.source_device_id,
        sensor_id=event_in.sensor_id,
        room_id=room_id,
        severity=event_in.severity,
        status="PENDING",
        metadata_json=event_in.metadata,
        correlation_id=event_in.correlation_id,
        trust_impact=event_in.trust_impact
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Correlation, Consistency, Trust engines processing
    processed = CorrelationEngine.process_event(event, db)

    # Real-time WebSocket broadcast
    event_dict = {
        "id": event.id,
        "timestamp": event.timestamp.isoformat(),
        "event_type": event.event_type,
        "source_device_id": event.source_device_id,
        "sensor_id": event.sensor_id,
        "room_id": event.room_id,
        "severity": event.severity,
        "status": event.status,
        "metadata": event.metadata_json,
        "correlation_id": event.correlation_id,
        "trust_impact": event.trust_impact
    }
    await ws_manager.broadcast_event("NEW_EVENT", event_dict)

    # Forward to n8n webhook workflow
    import asyncio
    from ..services.telegram_service import TelegramNotifier, forward_to_n8n
    asyncio.create_task(forward_to_n8n(event_dict))

    if processed.get("incident"):
        inc = processed["incident"]
        incident_dict = {
            "id": inc.id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "risk_level": inc.risk_level,
            "status": inc.status,
            "room_id": inc.room_id,
            "started_at": inc.started_at.isoformat(),
            "summary": inc.summary,
            "confidence": inc.confidence
        }
        await ws_manager.broadcast_event("INCIDENT_UPDATED", incident_dict)

        # Dispatch real-time alert to Telegram bot
        asyncio.create_task(TelegramNotifier.notify_incident(incident_dict, event_dict))

    return event
