from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from ..models.models import Sensor, Device, SensorTrustHistory, Event

class TrustEngine:
    """
    Calculates dynamic Sensor Trust Scores (0 - 100).
    Every score change includes an explicit explanation saved to SENSOR_TRUST_HISTORY.
    """

    @staticmethod
    def get_trust_category(score: float) -> str:
        if score >= 80.0:
            return "HIGH TRUST"
        elif score >= 60.0:
            return "MODERATE TRUST"
        elif score >= 40.0:
            return "LOW TRUST"
        else:
            return "CRITICAL TRUST CONCERN"

    @classmethod
    def apply_deduction(
        cls,
        sensor_id: str,
        deduction: float,
        reason: str,
        db: Session
    ) -> Optional[Sensor]:
        sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
        if not sensor:
            return None

        old_score = sensor.trust_score
        new_score = max(0.0, min(100.0, old_score - deduction))

        if abs(old_score - new_score) > 0.001:
            sensor.trust_score = round(new_score, 1)
            sensor.last_event = datetime.now(timezone.utc)
            if new_score < 40.0:
                sensor.status = "ANOMALY"

            # Record history
            history = SensorTrustHistory(
                sensor_id=sensor.id,
                old_score=round(old_score, 1),
                new_score=round(new_score, 1),
                reason=reason,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(history)

            # Update parent device trust score (average of its sensors)
            device = db.query(Device).filter(Device.id == sensor.device_id).first()
            if device and device.sensors:
                all_scores = [s.trust_score for s in device.sensors]
                device.trust_score = round(sum(all_scores) / len(all_scores), 1)

            db.commit()
            db.refresh(sensor)
        return sensor

    @classmethod
    def apply_recovery(
        cls,
        sensor_id: str,
        recovery_amount: float = 2.0,
        reason: str = "Consistent normal telemetry observed",
        db: Session = None
    ) -> Optional[Sensor]:
        sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
        if not sensor or sensor.status == "QUARANTINED":
            return sensor

        old_score = sensor.trust_score
        if old_score >= 100.0:
            return sensor

        new_score = min(100.0, old_score + recovery_amount)
        sensor.trust_score = round(new_score, 1)
        sensor.last_event = datetime.now(timezone.utc)
        if new_score >= 40.0 and sensor.status == "ANOMALY":
            sensor.status = "ONLINE"

        history = SensorTrustHistory(
            sensor_id=sensor.id,
            old_score=round(old_score, 1),
            new_score=round(new_score, 1),
            reason=reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(history)

        # Update parent device trust score
        device = db.query(Device).filter(Device.id == sensor.device_id).first()
        if device and device.sensors:
            all_scores = [s.trust_score for s in device.sensors]
            device.trust_score = round(sum(all_scores) / len(all_scores), 1)

        db.commit()
        db.refresh(sensor)
        return sensor

    @classmethod
    def evaluate_event(cls, event: Event, consistency_result: Dict[str, Any], db: Session) -> float:
        total_impact = 0.0
        event_type = event.event_type

        # 1. Direct deductions based on event type
        deduction_map = {
            "SENSOR_INCONSISTENCY": (10.0, "Contradictory physical reading detected"),
            "TELEMETRY_ANOMALY": (15.0, "Telemetry frequency or packet structure anomaly"),
            "SENSOR_TAMPERING_SIMULATION": (30.0, "Simulated physical or digital sensor manipulation"),
            "SENSOR_OFFLINE": (20.0, "Sensor heartbeat lost or connection dropped"),
        }

        if event_type in deduction_map:
            deduction, reason = deduction_map[event_type]
            if event.sensor_id:
                cls.apply_deduction(event.sensor_id, deduction, reason, db)
                total_impact += deduction

        # 2. Deductions from consistency engine
        if consistency_result.get("is_inconsistent") and consistency_result.get("trust_deduction", 0) > 0:
            c_deduction = consistency_result["trust_deduction"]
            c_reason = consistency_result.get("description", "Physical consistency violation")
            for suspect_id in consistency_result.get("suspect_sensor_ids", []):
                cls.apply_deduction(suspect_id, c_deduction, c_reason, db)
            total_impact += c_deduction

        # 3. Normal event recovery
        normal_events = ("SENSOR_HEARTBEAT", "RFID_AUTHORIZED", "DOOR_CLOSED", "MOTION_CLEARED")
        if event_type in normal_events and not consistency_result.get("is_inconsistent"):
            if event.sensor_id:
                cls.apply_recovery(event.sensor_id, recovery_amount=1.5, reason=f"Normal verified behavior ({event_type})", db=db)

        return total_impact
