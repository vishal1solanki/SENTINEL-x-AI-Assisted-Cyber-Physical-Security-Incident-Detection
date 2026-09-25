from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.models import Device, Sensor, ResponseAction, Incident, Event, User
from ..engines.blindspot_engine import BlindSpotEngine
from ..services.security import log_audit_action
from ..websocket.connection_manager import ws_manager

class ResponseService:
    """
    Manages simulated quarantine, adaptive fallback, and device restoration.
    Strictly changes simulated device state within the application.
    """

    @classmethod
    async def quarantine_device(
        cls,
        device_id: str,
        reason: str,
        db: Session,
        incident_id: Optional[str] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            raise ValueError(f"Device '{device_id}' not found")

        # 1. Update device and sensor statuses
        device.status = "QUARANTINED"
        for sensor in device.sensors:
            sensor.status = "QUARANTINED"

        # 2. Record Response Action
        action = ResponseAction(
            incident_id=incident_id,
            device_id=device.id,
            action_type="QUARANTINE",
            status="COMPLETED",
            reason=reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(action)

        # 3. Create Event for Audit & Timeline
        event = Event(
            event_type="DEVICE_QUARANTINED",
            source_device_id=device.id,
            room_id=device.room_id,
            severity="HIGH",
            status="PROCESSED",
            metadata_json={
                "reason": reason,
                "triggered_by": user.email if user else "SOC_AUTOMATION",
                "simulated_isolation": True
            },
            trust_impact=0.0
        )
        db.add(event)
        db.commit()

        # 4. Audit Log
        log_audit_action(
            db=db,
            action="QUARANTINE_DEVICE",
            target_type="DEVICE",
            target_id=device.id,
            details={"reason": reason, "incident_id": incident_id},
            user_id=user.id if user else None
        )

        # 5. Recalculate room coverage and blind spots
        coverage_data = BlindSpotEngine.calculate_room_coverage(device.room_id, db)

        # 6. WebSocket notification
        quarantine_payload = {
            "device_id": device.id,
            "status": "QUARANTINED",
            "room_id": device.room_id,
            "reason": reason,
            "coverage": coverage_data
        }
        await ws_manager.broadcast_event("DEVICE_QUARANTINED", quarantine_payload)

        # Dispatch real-time alert to Telegram bot
        import asyncio
        from .telegram_service import TelegramNotifier
        asyncio.create_task(TelegramNotifier.notify_quarantine(device_id, reason, user.email if user else None))

        return {
            "status": "SUCCESS",
            "message": f"Device '{device.id}' has been placed in simulated quarantine.",
            "device": {
                "id": device.id,
                "name": device.name,
                "status": device.status,
                "room_id": device.room_id,
                "trust_score": device.trust_score
            },
            "coverage": coverage_data
        }

    @classmethod
    async def restore_device(
        cls,
        device_id: str,
        reason: str,
        db: Session,
        incident_id: Optional[str] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            raise ValueError(f"Device '{device_id}' not found")

        # 1. Update device and sensor statuses
        device.status = "ONLINE"
        for sensor in device.sensors:
            sensor.status = "ONLINE"
            if sensor.trust_score < 60.0:
                sensor.trust_score = 75.0  # restored to provisional baseline

        # 2. Record Response Action
        action = ResponseAction(
            incident_id=incident_id,
            device_id=device.id,
            action_type="RESTORE",
            status="COMPLETED",
            reason=reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(action)

        # 3. Create Event for Audit & Timeline
        event = Event(
            event_type="DEVICE_RESTORED",
            source_device_id=device.id,
            room_id=device.room_id,
            severity="INFO",
            status="PROCESSED",
            metadata_json={
                "reason": reason,
                "triggered_by": user.email if user else "SOC_ANALYST",
                "simulated_restoration": True
            },
            trust_impact=0.0
        )
        db.add(event)
        db.commit()

        # 4. Audit Log
        log_audit_action(
            db=db,
            action="RESTORE_DEVICE",
            target_type="DEVICE",
            target_id=device.id,
            details={"reason": reason, "incident_id": incident_id},
            user_id=user.id if user else None
        )

        # 5. Recalculate room coverage (resolves blind spots)
        coverage_data = BlindSpotEngine.calculate_room_coverage(device.room_id, db)

        # 6. WebSocket notification
        restore_payload = {
            "device_id": device.id,
            "status": "ONLINE",
            "room_id": device.room_id,
            "reason": reason,
            "coverage": coverage_data
        }
        await ws_manager.broadcast_event("DEVICE_RESTORED", restore_payload)

        return {
            "status": "SUCCESS",
            "message": f"Device '{device.id}' restored to ONLINE status.",
            "device": {
                "id": device.id,
                "name": device.name,
                "status": device.status,
                "room_id": device.room_id,
                "trust_score": device.trust_score
            },
            "coverage": coverage_data
        }
