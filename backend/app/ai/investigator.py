import os
import json
import httpx
from typing import Dict, Any, List
from .demo_ai import DemoAIInvestigator

class AIInvestigator:
    """
    AI-Assisted Cyber-Physical Incident Investigator.
    Uses configurable OpenAI-compatible API if AI_API_KEY is present,
    otherwise smoothly delegates to DemoAIInvestigator without crashing.
    Output is strictly structured JSON advisory information.
    """

    @classmethod
    async def investigate_incident(
        cls,
        incident_data: Dict[str, Any],
        events: List[Dict[str, Any]],
        room_data: Dict[str, Any],
        sensors: List[Dict[str, Any]],
        blind_spots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        api_key = os.getenv("AI_API_KEY", "").strip()
        provider = os.getenv("AI_PROVIDER", "openai").lower()
        model = os.getenv("AI_MODEL", "gpt-4o-mini")

        # If no API key configured, use deterministic Demo AI
        if not api_key:
            return DemoAIInvestigator.investigate(
                incident_data, events, room_data, sensors, blind_spots
            )

        # Attempt call to OpenAI-compatible endpoint
        try:
            prompt = cls._build_prompt(incident_data, events, room_data, sensors, blind_spots)
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are SENTINEL-X AI Investigator, an expert cyber-physical security analyst. "
                                    "Your job is to analyze security incidents, distinguish physically consistent attacks "
                                    "from sensor telemetry tampering or inconsistencies, evaluate sensor trust, identify blind spots, "
                                    "and recommend safe advisory response actions. Always output strict valid JSON only, "
                                    "with keys: incident_type, summary, risk_level, confidence, evidence, timeline, "
                                    "sensor_concerns, possible_explanations, recommended_actions, reasoning_summary."
                                )
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    parsed["investigator_engine"] = f"Cloud AI ({model})"
                    return parsed
                else:
                    print(f"[AI INVESTIGATOR] API returned status {response.status_code}, falling back to Demo AI.")
        except Exception as e:
            print(f"[AI INVESTIGATOR ERROR] Failed to query AI provider ({e}), falling back to Demo AI.")

        # Fallback
        return DemoAIInvestigator.investigate(
            incident_data, events, room_data, sensors, blind_spots
        )

    @classmethod
    def _build_prompt(cls, incident, events, room, sensors, blind_spots) -> str:
        return f"""
Analyze the following cyber-physical security incident:
INCIDENT:
ID: {incident.get('id')}
Title: {incident.get('title')}
Type: {incident.get('incident_type')}
Current Severity: {incident.get('severity')}
Room: {room.get('name')} (Level: {room.get('security_level')})

CORRELATED EVENTS:
{json.dumps(events, default=str, indent=2)}

ROOM SENSORS & TRUST SCORES:
{json.dumps(sensors, default=str, indent=2)}

ACTIVE BLIND SPOTS:
{json.dumps(blind_spots, default=str, indent=2)}

Respond with structured JSON analyzing:
1. What happened chronologically?
2. Did any sensors report contradictory or inconsistent telemetry?
3. Could any sensor be tampered with or experiencing a fault?
4. What are the active blind spots?
5. What safe simulated actions should the operator take?
"""
