import os
import sys
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .session import Base, engine, SessionLocal
from ..models.models import (
    User, Room, Device, Sensor, Event, Incident, IncidentEvent,
    SensorTrustHistory, BlindSpot, AttackScenario
)
from ..services.security import hash_password
from ..simulator.scenarios import SCENARIOS

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        if db.query(User).first():
            return

        print("[SEED] Seeding SENTINEL-X baseline demo data...")

        # 1. Demo Users
        users = [
            User(
                name="Security Administrator",
                email="admin@sentinel.local",
                password_hash=hash_password("Admin@SentinelX2026!"),
                role="ADMIN"
            ),
            User(
                name="Lead SOC Analyst",
                email="analyst@sentinel.local",
                password_hash=hash_password("Analyst@SentinelX2026!"),
                role="SOC_ANALYST"
            ),
            User(
                name="Auditor / Viewer",
                email="viewer@sentinel.local",
                password_hash=hash_password("Viewer@SentinelX2026!"),
                role="VIEWER"
            )
        ]
        db.add_all(users)
        db.commit()

        # 2. Rooms
        rooms = [
            Room(
                id="ROOM-SERVER-A",
                name="Server Room A",
                description="Primary compute cluster and core infrastructure perimeter.",
                security_level="CRITICAL"
            ),
            Room(
                id="ROOM-SEC-LAB",
                name="Security Lab",
                description="Research, hardware debugging, and telemetry simulation laboratory.",
                security_level="HIGH"
            )
        ]
        db.add_all(rooms)
        db.commit()

        # 3. Devices
        devices = [
            Device(id="RFID-GATE-01", name="Perimeter Badge Reader A", device_type="RFID_READER", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=96.0, firmware_version="v2.1.0"),
            Device(id="DOOR-A-01", name="Heavy Access Portal A", device_type="DOOR_CONTROLLER", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=94.0, firmware_version="v1.8.4"),
            Device(id="PIR-A-01", name="PIR Motion Sensor Alpha", device_type="PIR_SENSOR", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=85.0, firmware_version="v3.0.1"),
            Device(id="GATEWAY-A-01", name="Security Gateway Switch Alpha", device_type="GATEWAY", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=98.0, firmware_version="v4.2.0"),
            Device(id="CCTV-SIM-01", name="Optical Telemetry Node Alpha", device_type="CCTV", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=92.0, firmware_version="v1.1.2"),
            Device(id="AUTH-SERVER-01", name="Perimeter Domain Controller", device_type="AUTH_SERVER", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=99.0, firmware_version="v5.0.1"),
            Device(id="IRIS-SCANNER-01", name="Biometric Iris Scanner Alpha", device_type="BIOMETRIC_SCANNER", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=99.0, firmware_version="v2.0.4"),
            Device(id="ALARM-SIREN-01", name="Dual Perimeter Siren & Strobe", device_type="ALARM_SIREN", room_id="ROOM-SERVER-A", status="ONLINE", trust_score=100.0, firmware_version="v1.0.0"),
            Device(id="RFID-GATE-02", name="Lab Entry Card Reader", device_type="RFID_READER", room_id="ROOM-SEC-LAB", status="ONLINE", trust_score=100.0, firmware_version="v2.1.0"),
            Device(id="DOOR-B-01", name="Lab Magnetic Lock Contact", device_type="DOOR_CONTROLLER", room_id="ROOM-SEC-LAB", status="ONLINE", trust_score=100.0, firmware_version="v1.8.4"),
            Device(id="PIR-B-01", name="PIR Motion Sensor Bravo", device_type="PIR_SENSOR", room_id="ROOM-SEC-LAB", status="ONLINE", trust_score=100.0, firmware_version="v3.0.1"),
            Device(id="GATEWAY-B-01", name="Lab Switch Gateway Bravo", device_type="GATEWAY", room_id="ROOM-SEC-LAB", status="ONLINE", trust_score=100.0, firmware_version="v4.2.0")
        ]
        db.add_all(devices)
        db.commit()

        # 4. Attached Sensors
        sensors = [
            Sensor(id="SENSOR-RFID-A-01", device_id="RFID-GATE-01", sensor_type="RFID", status="ONLINE", trust_score=96.0),
            Sensor(id="SENSOR-DOOR-A-01", device_id="DOOR-A-01", sensor_type="DOOR_CONTACT", status="ONLINE", trust_score=94.0),
            Sensor(id="SENSOR-PIR-A-01", device_id="PIR-A-01", sensor_type="PIR", status="ONLINE", trust_score=85.0),
            Sensor(id="SENSOR-NET-A-01", device_id="GATEWAY-A-01", sensor_type="NETWORK", status="ONLINE", trust_score=98.0),
            Sensor(id="SENSOR-CCTV-01", device_id="CCTV-SIM-01", sensor_type="OPTICAL", status="ONLINE", trust_score=92.0),
            Sensor(id="SENSOR-AUTH-01", device_id="AUTH-SERVER-01", sensor_type="AUTH", status="ONLINE", trust_score=99.0),
            Sensor(id="SENSOR-IRIS-A-01", device_id="IRIS-SCANNER-01", sensor_type="BIOMETRIC", status="ONLINE", trust_score=99.0),
            Sensor(id="SENSOR-ALARM-A-01", device_id="ALARM-SIREN-01", sensor_type="ALARM", status="ONLINE", trust_score=100.0),
            Sensor(id="SENSOR-RFID-B-01", device_id="RFID-GATE-02", sensor_type="RFID", status="ONLINE", trust_score=100.0),
            Sensor(id="SENSOR-DOOR-B-01", device_id="DOOR-B-01", sensor_type="DOOR_CONTACT", status="ONLINE", trust_score=100.0),
            Sensor(id="SENSOR-PIR-B-01", device_id="PIR-B-01", sensor_type="PIR", status="ONLINE", trust_score=100.0),
            Sensor(id="SENSOR-NET-B-01", device_id="GATEWAY-B-01", sensor_type="NETWORK", status="ONLINE", trust_score=100.0)
        ]
        db.add_all(sensors)
        db.commit()

        # 5. Baseline Sensor Trust Histories
        now = datetime.now(timezone.utc)
        histories = [
            SensorTrustHistory(sensor_id="SENSOR-PIR-A-01", old_score=100.0, new_score=85.0, reason="Minor transient pulse anomaly recorded during test cycle", timestamp=now - timedelta(minutes=45)),
            SensorTrustHistory(sensor_id="SENSOR-RFID-A-01", old_score=100.0, new_score=96.0, reason="Periodic CRC checksum retry on badge coil", timestamp=now - timedelta(hours=2)),
            SensorTrustHistory(sensor_id="SENSOR-DOOR-A-01", old_score=100.0, new_score=94.0, reason="Mechanical latch contact rebound threshold reached", timestamp=now - timedelta(hours=1))
        ]
        db.add_all(histories)

        # 6. Attack Scenarios Catalog
        seen_scen_ids = set()
        for scen_key, data in SCENARIOS.items():
            if data["id"] in seen_scen_ids:
                continue
            seen_scen_ids.add(data["id"])
            scen_obj = AttackScenario(
                id=data["id"],
                name=data["name"],
                description=data["description"],
                events=data["steps"]
            )
            db.add(scen_obj)

        # 7. Initial Baseline Normal Events
        baseline_events = [
            Event(
                timestamp=now - timedelta(minutes=25),
                event_type="SENSOR_HEARTBEAT",
                source_device_id="GATEWAY-A-01",
                sensor_id="SENSOR-NET-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"uptime_seconds": 86400, "status": "NOMINAL"},
                trust_impact=0.0
            ),
            Event(
                timestamp=now - timedelta(minutes=15),
                event_type="RFID_AUTHORIZED",
                source_device_id="RFID-GATE-01",
                sensor_id="SENSOR-RFID-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"card_id": "BADGE_SEC_004", "holder": "Dr. V. Solanki", "authorized": True},
                trust_impact=0.0
            ),
            Event(
                timestamp=now - timedelta(minutes=14, seconds=55),
                event_type="DOOR_OPEN",
                source_device_id="DOOR-A-01",
                sensor_id="SENSOR-DOOR-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"dwell_time": 4.2},
                trust_impact=0.0
            ),
            Event(
                timestamp=now - timedelta(minutes=14, seconds=45),
                event_type="MOTION_DETECTED",
                source_device_id="PIR-A-01",
                sensor_id="SENSOR-PIR-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"zone": "ENTRY_FOYER"},
                trust_impact=0.0
            ),
            Event(
                timestamp=now - timedelta(minutes=14, seconds=35),
                event_type="DOOR_CLOSED",
                source_device_id="DOOR-A-01",
                sensor_id="SENSOR-DOOR-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"latched": True},
                trust_impact=0.0
            ),
            Event(
                timestamp=now - timedelta(minutes=10),
                event_type="MOTION_CLEARED",
                source_device_id="PIR-A-01",
                sensor_id="SENSOR-PIR-A-01",
                room_id="ROOM-SERVER-A",
                severity="INFO",
                status="PROCESSED",
                metadata_json={"zone": "ENTRY_FOYER"},
                trust_impact=0.0
            )
        ]
        db.add_all(baseline_events)
        db.commit()

        print("[SEED] Baseline database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Seeding failed: {e}")
        raise
    finally:
        if close_at_end:
            db.close()
