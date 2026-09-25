from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models.models import Room, Device, Sensor, BlindSpot

class BlindSpotEngine:
    """
    Evaluates telemetry coverage per room across 4 pillars:
    1. Access Control (RFID)
    2. Door Monitoring (Door contacts)
    3. Motion Monitoring (PIR)
    4. Cyber Telemetry (Gateway / Auth / Network)

    Generates 'Prototype Security Coverage' percentage and active Blind Spot alerts.
    """

    @classmethod
    def calculate_room_coverage(cls, room_id: str, db: Session) -> Dict[str, Any]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return {
                "room_id": room_id,
                "overall_coverage": 0.0,
                "pillars": {},
                "active_blind_spots": []
            }

        devices = db.query(Device).filter(Device.room_id == room_id).all()
        active_sensors = []
        for d in devices:
            if d.status != "QUARANTINED" and d.status != "OFFLINE":
                for s in d.sensors:
                    if s.status not in ("QUARANTINED", "OFFLINE") and s.trust_score >= 20.0:
                        active_sensors.append(s)

        sensor_types = {s.sensor_type for s in active_sensors}
        device_types = {d.device_type for d in devices if d.status not in ("QUARANTINED", "OFFLINE")}

        # Check the 4 Pillars
        access_control_score = 100.0 if ("RFID" in sensor_types or "RFID_READER" in device_types) else 0.0
        door_monitoring_score = 100.0 if ("DOOR_CONTACT" in sensor_types or "DOOR_CONTROLLER" in device_types) else 0.0
        motion_monitoring_score = 100.0 if ("PIR" in sensor_types or "PIR_SENSOR" in device_types) else 0.0
        cyber_telemetry_score = 100.0 if ("NETWORK" in sensor_types or "AUTH" in sensor_types or "GATEWAY" in device_types or "AUTH_SERVER" in device_types) else 0.0

        pillars = {
            "access_control": access_control_score,
            "door_monitoring": door_monitoring_score,
            "motion_monitoring": motion_monitoring_score,
            "cyber_telemetry": cyber_telemetry_score
        }

        overall_coverage = round(sum(pillars.values()) / len(pillars), 1)

        # Audit/Sync BlindSpot records in DB
        cls._sync_blind_spots(room_id, pillars, db)

        active_spots = db.query(BlindSpot).filter(
            BlindSpot.room_id == room_id,
            BlindSpot.status == "ACTIVE"
        ).all()

        return {
            "room_id": room_id,
            "room_name": room.name,
            "overall_coverage": overall_coverage,
            "label": "Prototype Security Coverage",
            "pillars": pillars,
            "active_blind_spots": [
                {
                    "id": bs.id,
                    "category": bs.category,
                    "severity": bs.severity,
                    "description": bs.description,
                    "detected_at": bs.detected_at.isoformat() if bs.detected_at else None
                } for bs in active_spots
            ]
        }

    @classmethod
    def _sync_blind_spots(cls, room_id: str, pillars: Dict[str, float], db: Session):
        pillar_categories = {
            "access_control": ("Access Control Blind Spot", "RFID access validation telemetry is unavailable or untrusted in this perimeter."),
            "door_monitoring": ("Perimeter Door Monitoring Blind Spot", "Physical door latch status cannot be verified."),
            "motion_monitoring": ("Motion Telemetry Blind Spot", "Movement inside room cannot currently be independently verified."),
            "cyber_telemetry": ("Cyber Telemetry Blind Spot", "Network gateway and authentication audit streams are degraded.")
        }

        for pillar_key, score in pillars.items():
            category, default_desc = pillar_categories[pillar_key]
            existing_spot = db.query(BlindSpot).filter(
                BlindSpot.room_id == room_id,
                BlindSpot.category == category,
                BlindSpot.status == "ACTIVE"
            ).first()

            if score == 0.0 and not existing_spot:
                # Create blind spot
                new_spot = BlindSpot(
                    room_id=room_id,
                    category=category,
                    severity="HIGH" if pillar_key in ("access_control", "motion_monitoring") else "MEDIUM",
                    description=default_desc,
                    detected_at=datetime.now(timezone.utc),
                    status="ACTIVE"
                )
                db.add(new_spot)
                db.commit()
            elif score > 0.0 and existing_spot:
                # Resolve blind spot
                existing_spot.status = "RESOLVED"
                existing_spot.resolved_at = datetime.now(timezone.utc)
                db.commit()
