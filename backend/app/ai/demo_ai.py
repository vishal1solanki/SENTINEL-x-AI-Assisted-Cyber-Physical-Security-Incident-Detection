from typing import Dict, Any, List
from datetime import datetime

class DemoAIInvestigator:
    """
    Deterministic rule-based AI Investigator fallback.
    Operates 100% offline without external API keys.
    Synthesizes cyber-physical correlation, telemetry consistency, sensor trust drops, and blind spots.
    """

    @classmethod
    def investigate(
        cls,
        incident_data: Dict[str, Any],
        events: List[Dict[str, Any]],
        room_data: Dict[str, Any],
        sensors: List[Dict[str, Any]],
        blind_spots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        event_types = [e.get("event_type") for e in events]
        incident_type = incident_data.get("incident_type", "CYBER_PHYSICAL_INCIDENT")

        # 1. Compile chronological timeline
        timeline_entries = []
        for e in sorted(events, key=lambda x: x.get("timestamp", "")):
            ts = e.get("timestamp", "")
            if isinstance(ts, datetime):
                ts = ts.strftime("%H:%M:%S")
            elif isinstance(ts, str) and "T" in ts:
                ts = ts.split("T")[1][:8]
            timeline_entries.append(f"[{ts}] {e.get('source_device_id')}: {e.get('event_type')} (Severity: {e.get('severity')})")

        # 2. Identify sensor trust concerns
        low_trust_sensors = [s for s in sensors if s.get("trust_score", 100) < 60]
        sensor_concerns = []
        for s in low_trust_sensors:
            sensor_concerns.append(
                f"Sensor '{s.get('id')}' ({s.get('sensor_type')}) trust score dropped to {s.get('trust_score')}% "
                f"[{s.get('status')}]. Reliability questionable."
            )
        if not sensor_concerns:
            sensor_concerns.append("All primary perimeter sensors currently maintain baseline trust levels (>60%).")

        # 3. Detect contradictions & evidence
        evidence = []
        possible_explanations = []

        if "RFID_UNAUTHORIZED" in event_types:
            evidence.append("Unauthorized credential scan rejected at perimeter badge reader.")
        if "DOOR_OPEN" in event_types:
            evidence.append("Physical perimeter door latch contact registered door open.")
        if "MOTION_DETECTED" in event_types:
            evidence.append("Interior PIR sensor confirmed movement inside restricted area.")
        if "SUSPICIOUS_LOGIN" in event_types:
            evidence.append("Cyber telemetry registered abnormal login attempt on critical system.")
        if "NETWORK_ANOMALY" in event_types or "API_ANOMALY" in event_types:
            evidence.append("Anomalous high-frequency payload traversal observed on local gateway.")
        if "SENSOR_INCONSISTENCY" in event_types or any("inconsistent" in e.get("summary", "").lower() for e in [incident_data]):
            evidence.append("Contradictory physical readings: PIR motion registered without expected door cycle.")
            possible_explanations.append("PIR sensor false trigger / environmental thermal draft.")
            possible_explanations.append("Door contact switch failure, physical bypass, or magnetic tampering.")
            possible_explanations.append("Simulated sensor telemetry replay or packet injection.")

        # Default hypotheses if none added
        if not possible_explanations:
            possible_explanations = [
                "Coordinated cyber-physical intrusion by unauthorized actor.",
                "Authorized personnel tailgating during physical entry accompanied by misconfigured badge.",
                "Security sensor hardware desynchronization during network latency spike."
            ]

        # 4. Assess risk level & confidence
        risk_level = incident_data.get("risk_level", "MEDIUM")
        confidence = 0.85
        if "SUSPICIOUS_LOGIN" in event_types and "MOTION_DETECTED" in event_types:
            risk_level = "CRITICAL"
            confidence = 0.93
        elif len(low_trust_sensors) > 0:
            risk_level = "HIGH"
            confidence = 0.88

        # 5. Formulate safe recommended actions
        recommended_actions = [
            "Operator manual review of perimeter video surveillance feed.",
            "Dispatch physical security guard to inspect perimeter door latch.",
            "Review authentication server logs for anomalous session tokens."
        ]
        if low_trust_sensors:
            suspect_names = ", ".join([s.get("id") for s in low_trust_sensors])
            recommended_actions.append(f"Execute simulated quarantine on suspect device(s): [{suspect_names}].")
            recommended_actions.append("Engage secondary fallback monitoring sensors to cover perimeter blind spots.")

        summary = (
            f"Demo AI Investigator correlated {len(events)} events in {room_data.get('name', 'Perimeter')}. "
            f"Physical progression matched with cyber anomalies indicates a {risk_level} risk incident. "
            f"Sensor trust analysis identified {len(low_trust_sensors)} degraded sensors."
        )

        reasoning_summary = (
            f"Correlated temporal alignment between physical access telemetry and cyber authentication. "
            f"Confidence {confidence*100:.0f}% based on multi-sensor corroboration. "
            f"Active blind spots: {len(blind_spots)}. Recommended simulated isolation to prevent potential lateral spoofing."
        )

        return {
            "incident_type": incident_type,
            "summary": summary,
            "risk_level": risk_level,
            "confidence": confidence,
            "evidence": evidence or ["Correlated sequential security telemetry."],
            "timeline": timeline_entries,
            "sensor_concerns": sensor_concerns,
            "possible_explanations": possible_explanations,
            "recommended_actions": recommended_actions,
            "reasoning_summary": reasoning_summary,
            "investigator_engine": "Demo AI Investigator (Rule-Based Fallback)"
        }
