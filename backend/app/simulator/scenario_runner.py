import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.models import Event, Incident, Sensor, Device, BlindSpot, SensorTrustHistory, ResponseAction
from ..engines.correlation_engine import CorrelationEngine
from ..engines.blindspot_engine import BlindSpotEngine
from ..websocket.connection_manager import ws_manager
from .scenarios import SCENARIOS, TEST_1_AUTHORIZED, TEST_2_CLONED_RFID, TEST_3_STOLEN_RFID

class ScenarioRunner:
    """
    Simulates physical-cyber access control scenarios safely inside the application domain.
    Emits events through the real correlation, trust, and WebSocket pipelines.
    Forwards events to n8n and dispatches Telegram notifications on incidents.
    """

    @classmethod
    async def run_scenario_step(
        cls,
        step_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        # 1. Create simulated Event
        event = Event(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            event_type=step_data["event_type"],
            source_device_id=step_data["source_device_id"],
            sensor_id=step_data.get("sensor_id"),
            room_id=step_data.get("room_id", "ROOM-SERVER-A"),
            severity=step_data.get("severity", "INFO"),
            status="PENDING",
            metadata_json=step_data.get("metadata", {}),
            trust_impact=0.0
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # 2. Process through Correlation and Trust Engines
        processed = CorrelationEngine.process_event(event, db)

        # 3. Broadcast real-time update over WebSocket
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
            "trust_impact": event.trust_impact,
            "step_description": step_data.get("description", ""),
            "phase": step_data.get("phase", "")
        }
        await ws_manager.broadcast_event("NEW_EVENT", event_dict)

        # 4. Asynchronously forward event to n8n webhook workflow
        from ..services.telegram_service import TelegramNotifier, forward_to_n8n
        asyncio.create_task(forward_to_n8n(event_dict))

        # 5. Dispatch Telegram incident alert if an incident was generated or updated
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
            asyncio.create_task(TelegramNotifier.notify_incident(incident_dict, event_dict))

        # 6. Dispatch Telegram quarantine / alerts on explicit isolation
        if event.event_type == "DEVICE_QUARANTINED":
            asyncio.create_task(
                TelegramNotifier.notify_quarantine(
                    event.source_device_id,
                    step_data.get("description", "Device quarantined by autonomous SOAR containment."),
                    "Autonomous Sentinel SOAR"
                )
            )

        return processed

    @classmethod
    async def run_test_flow(
        cls,
        test_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes one of the 3 canonical test flows:
        - "1" or "authorized": TEST 1 (Authorized RFID + Authorized Iris)
        - "2" or "cloned": TEST 2 (Cloned RFID)
        - "3" or "stolen": TEST 3 (Valid RFID + Wrong Iris / Stolen Credential)
        """
        key = str(test_id).strip().lower()
        if key in ("1", "test1", "authorized", "auth"):
            scenario = TEST_1_AUTHORIZED
        elif key in ("2", "test2", "cloned", "clone"):
            scenario = TEST_2_CLONED_RFID
        elif key in ("3", "test3", "stolen", "mismatch"):
            scenario = TEST_3_STOLEN_RFID
        else:
            scenario = SCENARIOS.get(test_id.upper()) or TEST_3_STOLEN_RFID

        # Broadcast test start
        await ws_manager.broadcast_event("TEST_STARTED", {
            "test_id": scenario["id"],
            "name": scenario["name"],
            "expected_result": scenario.get("expected_result", "")
        })

        executed_steps = []
        last_incident = None

        for step in scenario["steps"]:
            step_copy = dict(step)
            step_copy["room_id"] = "ROOM-SERVER-A"
            res = await cls.run_scenario_step(step_copy, db)
            executed_steps.append({
                "step": step["step"],
                "phase": step["phase"],
                "event_type": step["event_type"],
                "description": step["description"]
            })
            if res.get("incident"):
                last_incident = res["incident"]
            
            # Step delay for realistic animation cadence
            delay = step.get("delay_sec", 1.2)
            await asyncio.sleep(min(delay, 2.0))

        # Broadcast test complete
        await ws_manager.broadcast_event("TEST_COMPLETED", {
            "test_id": scenario["id"],
            "name": scenario["name"],
            "expected_result": scenario.get("expected_result", ""),
            "steps_count": len(executed_steps),
            "incident_id": last_incident.id if last_incident else None
        })

        return {
            "status": "SUCCESS",
            "test_id": scenario["id"],
            "name": scenario["name"],
            "expected_result": scenario.get("expected_result", ""),
            "steps_executed": len(executed_steps),
            "steps": executed_steps,
            "incident": {
                "id": last_incident.id,
                "title": last_incident.title,
                "severity": last_incident.severity,
                "summary": last_incident.summary
            } if last_incident else None
        }

    @classmethod
    async def trigger_scenario(
        cls,
        scenario_key: str,
        room_id: str,
        speed: float,
        db: Session
    ) -> List[Dict[str, Any]]:
        scenario = SCENARIOS.get(scenario_key) or SCENARIOS.get("TEST_3_STOLEN_RFID")
        if not scenario:
            raise ValueError(f"Scenario '{scenario_key}' not found.")

        results = []
        for step in scenario["steps"]:
            step_copy = dict(step)
            step_copy["room_id"] = room_id
            res = await cls.run_scenario_step(step_copy, db)
            results.append(res)
            delay = step_copy.get("delay_sec", 1.5) / max(0.1, speed)
            await asyncio.sleep(min(delay, 2.0))

        return results

    @classmethod
    async def load_full_scenario(cls, db: Session) -> Dict[str, Any]:
        """
        Executes TEST 3 (Valid RFID + Wrong Iris / Stolen Credential) as the primary demonstration.
        """
        return await cls.run_test_flow("3", db)

    @classmethod
    async def reset_demo(cls, db: Session) -> Dict[str, Any]:
        """
        Safely resets to clean baseline:
        - Restores all quarantined devices to ONLINE
        - Resets all sensor trust scores to 100.0%
        - Resolves all active blind spots
        - Marks incidents as RESOLVED
        - Broadcasts clean baseline to UI
        """
        from datetime import timedelta
        now = datetime.now(timezone.utc)

        devices = db.query(Device).all()
        for d in devices:
            d.status = "ONLINE"
            d.trust_score = 100.0

        sensors = db.query(Sensor).all()
        for s in sensors:
            s.status = "ONLINE"
            s.trust_score = 100.0

        blind_spots = db.query(BlindSpot).filter(BlindSpot.status == "ACTIVE").all()
        for bs in blind_spots:
            bs.status = "RESOLVED"
            bs.resolved_at = now

        active_incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
        for inc in active_incidents:
            inc.status = "RESOLVED"
            inc.resolved_at = now

        for s in sensors:
            h = SensorTrustHistory(
                sensor_id=s.id,
                old_score=s.trust_score,
                new_score=100.0,
                reason="Baseline Reset executed",
                timestamp=now
            )
            db.add(h)

        db.commit()

        BlindSpotEngine.calculate_room_coverage("ROOM-SERVER-A", db)
        BlindSpotEngine.calculate_room_coverage("ROOM-SEC-LAB", db)

        await ws_manager.broadcast_event("DEMO_RESET", {"status": "CLEAN_BASELINE_RESTORED"})
        return {"status": "SUCCESS", "message": "Baseline state restored with live timestamps"}
