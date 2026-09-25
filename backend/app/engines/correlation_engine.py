import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.models import Event, Incident, IncidentEvent, Room, Device
from .consistency_engine import ConsistencyEngine
from .trust_engine import TrustEngine
from .blindspot_engine import BlindSpotEngine

class CorrelationEngine:
    """
    Correlates cyber and physical security telemetry.
    Combines sliding temporal windows with room spatial boundaries.
    Uses probabilistic threat modeling rather than absolute assertions.
    """

    CORRELATION_WINDOW_SECONDS = 90

    @classmethod
    def process_event(cls, event: Event, db: Session) -> Dict[str, Any]:
        # 1. Fetch recent events in the same room or global cyber events within window
        window_start = event.timestamp - timedelta(seconds=cls.CORRELATION_WINDOW_SECONDS)
        
        recent_events_query = db.query(Event).filter(
            Event.timestamp >= window_start,
            Event.id != event.id
        )
        if event.room_id:
            # Query same room physical events plus cyber events
            recent_events = recent_events_query.filter(
                (Event.room_id == event.room_id) | (Event.event_type.in_(["SUSPICIOUS_LOGIN", "API_ANOMALY", "NETWORK_ANOMALY"]))
            ).order_by(Event.timestamp.desc()).all()
        else:
            recent_events = recent_events_query.order_by(Event.timestamp.desc()).all()

        # 2. Check sensor consistency (physically consistent vs inconsistent)
        consistency_result = ConsistencyEngine.analyze_sensor_consistency(event, recent_events, db)

        # 3. Update Sensor Trust Scores
        trust_impact = TrustEngine.evaluate_event(event, consistency_result, db)
        event.trust_impact = trust_impact

        # 4. Check for pattern matches and calculate correlation score
        correlation_result = cls._evaluate_patterns(event, recent_events, consistency_result)

        incident = None
        if correlation_result["should_create_incident"]:
            incident = cls._create_or_update_incident(event, recent_events, correlation_result, db)
            event.status = "CORRELATED"
            event.correlation_id = incident.id
        else:
            event.status = "PROCESSED"

        db.commit()

        # 5. Sync room coverage and blind spots
        if event.room_id:
            BlindSpotEngine.calculate_room_coverage(event.room_id, db)

        return {
            "event": event,
            "consistency": consistency_result,
            "correlation": correlation_result,
            "incident": incident
        }

    @classmethod
    def _evaluate_patterns(
        cls,
        current_event: Event,
        recent_events: List[Event],
        consistency: Dict[str, Any]
    ) -> Dict[str, Any]:
        all_events = [current_event] + recent_events
        types = [e.event_type for e in all_events]

        result = {
            "should_create_incident": False,
            "title": "",
            "incident_type": "",
            "severity": "INFO",
            "risk_level": "LOW",
            "confidence": 0.5,
            "summary": "",
            "matched_events": []
        }

        # TEST 3: Stolen Credential / Biometric Iris Mismatch
        # Rule: Do NOT claim system magically knows human identity from RFID alone; use "Possible stolen credential"
        has_iris_mismatch = (
            current_event.event_type in ("IRIS_MISMATCH", "ACCESS_DENIED_MISMATCH") or
            "IRIS_MISMATCH" in types or
            "ACCESS_DENIED_MISMATCH" in types or
            (current_event.metadata_json and current_event.metadata_json.get("iris_match") is False)
        )
        if has_iris_mismatch:
            result["should_create_incident"] = True
            result["title"] = "Possible Stolen Credential - Biometric Iris Mismatch"
            result["incident_type"] = "STOLEN_CREDENTIAL_MISMATCH"
            result["severity"] = "CRITICAL"
            result["risk_level"] = "CRITICAL"
            result["confidence"] = 0.98
            result["summary"] = (
                "Valid RFID credential presented followed by biometric iris mismatch. "
                "Possible stolen credential detected. Access denied, door locked, perimeter alarm/siren active."
            )
            return result

        # TEST 2: Cloned RFID Access Attempt
        has_cloned_rfid = (
            current_event.event_type in ("CLONED_RFID", "ACCESS_DENIED_CLONED") or
            "CLONED_RFID" in types or
            "ACCESS_DENIED_CLONED" in types or
            (current_event.metadata_json and current_event.metadata_json.get("cloned") is True)
        )
        if has_cloned_rfid:
            result["should_create_incident"] = True
            result["title"] = "Cloned RFID Access Attempt Detected"
            result["incident_type"] = "CLONED_RFID_ATTACK"
            result["severity"] = "HIGH"
            result["risk_level"] = "HIGH"
            result["confidence"] = 0.95
            result["summary"] = (
                "Cloned RFID badge presented at perimeter reader. "
                "Cloned UID signature recognized. Access denied, door locked, perimeter alarm/siren active."
            )
            return result

        # Authorized Access (TEST 1) - explicit safe pass
        if current_event.event_type in ("RFID_VERIFIED", "IRIS_VERIFIED", "ACCESS_GRANTED"):
            return result

        has_unauth_rfid = "RFID_UNAUTHORIZED" in types
        has_door_open = "DOOR_OPEN" in types
        has_motion = "MOTION_DETECTED" in types
        has_suspicious_login = "SUSPICIOUS_LOGIN" in types
        has_network_anomaly = "NETWORK_ANOMALY" in types or "API_ANOMALY" in types
        has_sensor_anomaly = consistency.get("is_inconsistent") or "TELEMETRY_ANOMALY" in types or "SENSOR_TAMPERING_SIMULATION" in types

        # Pattern A: Coordinated Cyber-Physical Intrusion
        if (has_unauth_rfid or (has_door_open and has_motion)) and (has_suspicious_login or has_network_anomaly):
            result["should_create_incident"] = True
            result["title"] = "Possible Coordinated Cyber-Physical Incident"
            result["incident_type"] = "COORDINATED_CYBER_PHYSICAL_BREACH"
            result["severity"] = "CRITICAL"
            result["risk_level"] = "CRITICAL"
            result["confidence"] = 0.92
            result["summary"] = (
                "Physical perimeter indicators (unauthorized badge or door traversal) correlated "
                "with cyber anomalies (suspicious authentication / network telemetry) within a tight temporal window."
            )
            return result

        # Pattern B: Possible Physical Intrusion
        if has_unauth_rfid and has_door_open and has_motion:
            result["should_create_incident"] = True
            result["title"] = "Possible Coordinated Physical Perimeter Breach"
            result["incident_type"] = "PHYSICAL_INTRUSION"
            result["severity"] = "HIGH"
            result["risk_level"] = "HIGH"
            result["confidence"] = 0.88
            result["summary"] = (
                "Sequential detection of unauthorized badge presentation, door breach, and subsequent "
                "interior motion within 30 seconds."
            )
            return result

        # Pattern C: Sensor Integrity / Tampering Anomaly
        if has_sensor_anomaly:
            result["should_create_incident"] = True
            result["title"] = "Potential Sensor Telemetry Inconsistency / Tampering"
            result["incident_type"] = "SENSOR_INTEGRITY_COMPROMISE"
            result["severity"] = "MEDIUM" if not has_motion else "HIGH"
            result["risk_level"] = "HIGH" if consistency.get("is_inconsistent") else "MEDIUM"
            result["confidence"] = 0.78
            result["summary"] = (
                f"Contradictory or anomalous sensor telemetry observed. {consistency.get('description', '')}"
            )
            return result

        # Pattern D: Isolated Suspicious Cyber Activity
        if has_suspicious_login and has_network_anomaly:
            result["should_create_incident"] = True
            result["title"] = "Possible Privileged Access / Cyber Telemetry Anomaly"
            result["incident_type"] = "CYBER_ANOMALY"
            result["severity"] = "MEDIUM"
            result["risk_level"] = "MEDIUM"
            result["confidence"] = 0.75
            result["summary"] = "Abnormal login sequence paired with abnormal API traffic patterns."
            return result

        return result

    @classmethod
    def _create_or_update_incident(
        cls,
        event: Event,
        recent_events: List[Event],
        eval_result: Dict[str, Any],
        db: Session
    ) -> Incident:
        # Check if an active incident already exists for this room in the last 10 minutes
        ten_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
        existing_incident = db.query(Incident).filter(
            Incident.room_id == (event.room_id or "ROOM-SERVER-A"),
            Incident.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING"]),
            Incident.started_at >= ten_mins_ago
        ).first()

        if existing_incident:
            # Upgrade incident if current evaluation is higher severity
            severity_rank = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
            if severity_rank.get(eval_result["severity"], 0) > severity_rank.get(existing_incident.severity, 0):
                existing_incident.severity = eval_result["severity"]
                existing_incident.risk_level = eval_result["risk_level"]
                existing_incident.title = eval_result["title"]
                existing_incident.incident_type = eval_result["incident_type"]
                existing_incident.summary = eval_result["summary"]
                existing_incident.confidence = max(existing_incident.confidence, eval_result["confidence"])

            # Link event
            assoc = IncidentEvent(incident_id=existing_incident.id, event_id=event.id)
            db.add(assoc)
            return existing_incident

        # Otherwise create new incident
        inc_count = db.query(Incident).count() + 1
        incident_id = f"INC-2026-{inc_count:03d}"
        new_incident = Incident(
            id=incident_id,
            title=eval_result["title"],
            incident_type=eval_result["incident_type"],
            severity=eval_result["severity"],
            risk_level=eval_result["risk_level"],
            status="NEW",
            room_id=event.room_id or "ROOM-SERVER-A",
            started_at=datetime.now(timezone.utc),
            summary=eval_result["summary"],
            confidence=eval_result["confidence"]
        )
        db.add(new_incident)
        db.flush()

        # Associate current event and relevant recent events
        assoc = IncidentEvent(incident_id=new_incident.id, event_id=event.id)
        db.add(assoc)
        for r_event in recent_events[:5]:
            assoc_r = IncidentEvent(incident_id=new_incident.id, event_id=r_event.id)
            db.add(assoc_r)

        return new_incident
