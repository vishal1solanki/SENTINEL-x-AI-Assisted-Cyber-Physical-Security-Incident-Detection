from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from ..models.models import Event, Sensor, Device

class ConsistencyEngine:
    """
    Evaluates physical sensor consistency to answer:
    'Can the security system itself still be trusted?'
    
    Distinguishes:
    - 'Physically consistent suspicious event sequence'
    - 'Physical telemetry inconsistency detected' (potential sensor tampering, fault, or spoofing)
    """

    @staticmethod
    def analyze_sensor_consistency(
        current_event: Event,
        recent_events: List[Event],
        db: Session
    ) -> Dict[str, Any]:
        result = {
            "is_inconsistent": False,
            "inconsistency_type": None,
            "description": None,
            "possible_explanations": [],
            "trust_deduction": 0.0,
            "suspect_sensor_ids": []
        }

        # Focus on room-level physical correlation
        room_id = current_event.room_id
        if not room_id:
            return result

        event_type = current_event.event_type

        # Case 1: Motion detected while Door is reported closed and no prior entry
        # If PIR says MOTION_DETECTED, check the latest door state in the room
        if event_type == "MOTION_DETECTED":
            door_events = [e for e in recent_events if e.event_type in ("DOOR_OPEN", "DOOR_CLOSED")]
            rfid_events = [e for e in recent_events if e.event_type in ("RFID_AUTHORIZED", "RFID_UNAUTHORIZED")]
            
            latest_door = door_events[0] if door_events else None
            latest_rfid = rfid_events[0] if rfid_events else None

            # Inconsistency: Door closed, RFID authorized or no entry, but motion inside
            if latest_door and latest_door.event_type == "DOOR_CLOSED":
                # Check if door closed recently without opening
                result["is_inconsistent"] = True
                result["inconsistency_type"] = "MOTION_WITH_CLOSED_DOOR"
                result["description"] = "PIR sensor registered movement while Door Contact reports door remained closed."
                result["possible_explanations"] = [
                    "PIR sensor false trigger / environmental interference (thermal draft)",
                    "Door contact switch fault or physical bypass",
                    "Unauthorized actor already inside perimeter before monitoring cycle",
                    "Simulated sensor telemetry manipulation"
                ]
                result["trust_deduction"] = 10.0
                if current_event.sensor_id:
                    result["suspect_sensor_ids"].append(current_event.sensor_id)
                if latest_door.sensor_id:
                    result["suspect_sensor_ids"].append(latest_door.sensor_id)

            # Inconsistency: RFID says AUTHORIZED, but door never opened and motion detected
            elif latest_rfid and latest_rfid.event_type == "RFID_AUTHORIZED" and (not latest_door or latest_door.event_type == "DOOR_CLOSED"):
                result["is_inconsistent"] = True
                result["inconsistency_type"] = "BADGE_PRESENTED_NO_DOOR_CYCLE"
                result["description"] = "Authorized RFID badge validated, but door contact did not cycle open."
                result["possible_explanations"] = [
                    "Door sensor contact failed to register physical latch retraction",
                    "Cardholder validated credential but aborted entry",
                    "Simulated relay desynchronization"
                ]
                result["trust_deduction"] = 8.0
                if latest_rfid.sensor_id:
                    result["suspect_sensor_ids"].append(latest_rfid.sensor_id)

        # Case 2: Door opened with NO badge event within 15 seconds
        elif event_type == "DOOR_OPEN":
            recent_rfid = [
                e for e in recent_events 
                if e.event_type in ("RFID_AUTHORIZED", "RFID_UNAUTHORIZED")
                and (current_event.timestamp - e.timestamp).total_seconds() <= 20
            ]
            if not recent_rfid:
                # Door forced open or sensor phantom open
                result["is_inconsistent"] = False # Physically possible breach (forced door)
                result["description"] = "Door contact opened without prior RFID badge presentation (Potential Forced Entry)."
                result["possible_explanations"] = [
                    "Physical forced entry or emergency door egress",
                    "Key cylinder bypass",
                    "Door reed switch misalignment"
                ]

        # Case 3: Telemetry anomaly explicitly reported
        elif event_type in ("TELEMETRY_ANOMALY", "SENSOR_INCONSISTENCY", "SENSOR_TAMPERING_SIMULATION"):
            result["is_inconsistent"] = True
            result["inconsistency_type"] = "EXPLICIT_SENSOR_ANOMALY"
            result["description"] = f"Abnormal sensor telemetry received: {event_type}"
            result["possible_explanations"] = [
                "Simulated packet injection / replay anomaly",
                "Firmware heartbeat timing desynchronization",
                "Sensor hardware electrical noise"
            ]
            result["trust_deduction"] = 20.0
            if current_event.sensor_id:
                result["suspect_sensor_ids"].append(current_event.sensor_id)

        return result
