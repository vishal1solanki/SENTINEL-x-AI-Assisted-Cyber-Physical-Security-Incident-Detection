import uuid
from datetime import datetime, timezone
from app.models.models import Event, Incident
from app.engines.correlation_engine import CorrelationEngine

def test_physical_intrusion_correlation(db_session):
    now = datetime.now(timezone.utc)
    # 1. Unauthorized RFID
    e1 = Event(
        id=str(uuid.uuid4()),
        timestamp=now,
        event_type="RFID_UNAUTHORIZED",
        source_device_id="RFID-GATE-01",
        sensor_id="SENSOR-RFID-A-01",
        room_id="ROOM-SERVER-A",
        severity="LOW"
    )
    db_session.add(e1)
    db_session.commit()
    CorrelationEngine.process_event(e1, db_session)

    # 2. Door Open
    e2 = Event(
        id=str(uuid.uuid4()),
        timestamp=now,
        event_type="DOOR_OPEN",
        source_device_id="DOOR-A-01",
        sensor_id="SENSOR-DOOR-A-01",
        room_id="ROOM-SERVER-A",
        severity="MEDIUM"
    )
    db_session.add(e2)
    db_session.commit()
    CorrelationEngine.process_event(e2, db_session)

    # 3. Motion Detected
    e3 = Event(
        id=str(uuid.uuid4()),
        timestamp=now,
        event_type="MOTION_DETECTED",
        source_device_id="PIR-A-01",
        sensor_id="SENSOR-PIR-A-01",
        room_id="ROOM-SERVER-A",
        severity="HIGH"
    )
    db_session.add(e3)
    db_session.commit()
    res = CorrelationEngine.process_event(e3, db_session)

    assert res["incident"] is not None
    assert "Physical" in res["incident"].title
    assert res["incident"].severity in ("HIGH", "CRITICAL")
