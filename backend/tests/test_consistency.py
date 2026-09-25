import uuid
from datetime import datetime, timezone
from app.models.models import Event
from app.engines.consistency_engine import ConsistencyEngine

def test_sensor_inconsistency_detection(db_session):
    now = datetime.now(timezone.utc)
    # Door closed event
    door_event = Event(
        id=str(uuid.uuid4()),
        timestamp=now,
        event_type="DOOR_CLOSED",
        source_device_id="DOOR-A-01",
        sensor_id="SENSOR-DOOR-A-01",
        room_id="ROOM-SERVER-A",
        severity="INFO"
    )

    # PIR motion event inside room with closed door
    motion_event = Event(
        id=str(uuid.uuid4()),
        timestamp=now,
        event_type="MOTION_DETECTED",
        source_device_id="PIR-A-01",
        sensor_id="SENSOR-PIR-A-01",
        room_id="ROOM-SERVER-A",
        severity="HIGH"
    )

    result = ConsistencyEngine.analyze_sensor_consistency(motion_event, [door_event], db_session)
    assert result["is_inconsistent"] is True
    assert result["inconsistency_type"] == "MOTION_WITH_CLOSED_DOOR"
    assert "SENSOR-PIR-A-01" in result["suspect_sensor_ids"]
