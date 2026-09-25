# SENTINEL-X REST & WebSocket API Reference

The backend exposes an interactive OpenAPI specification at `http://localhost:8000/docs`.
This document outlines core endpoints with request and response payloads.

---

## 1. System Endpoints

### `GET /health`
Returns backend health status.
```json
{
  "status": "HEALTHY",
  "service": "SENTINEL-X Backend",
  "version": "1.0.0",
  "timestamp": "2026-09-21T10:00:00.000Z"
}
```

### `GET /api/system/status`
Returns platform microservice diagnostics (backend, database, n8n, AI provider, WebSocket, Wokwi).
```json
{
  "backend": "ONLINE",
  "database": "ONLINE",
  "n8n": "ONLINE",
  "ai_provider": "openai",
  "ai_status": "Demo AI Investigator Active (Rule-Based Fallback)",
  "websocket": "ONLINE",
  "simulator": "ONLINE",
  "wokwi": "READY",
  "timestamp": "2026-09-21T10:00:00.000Z"
}
```

---

## 2. Authentication

### `POST /api/auth/login`
Authenticates user and issues JWT bearer token.
- **Request**:
```json
{
  "email": "analyst@sentinel.local",
  "password": "Analyst@SentinelX2026!"
}
```
- **Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "SOC_ANALYST",
  "user_id": "usr-123",
  "name": "Lead SOC Analyst"
}
```

### `GET /api/auth/me`
Returns current authenticated user profile. Requires `Authorization: Bearer <token>`.

---

## 3. Telemetry Events

### `POST /api/events`
Ingests an event from Wokwi ESP32, n8n, or simulator, runs correlation, updates trust, and broadcasts over WebSocket.
- **Request**:
```json
{
  "event_type": "MOTION_DETECTED",
  "source_device_id": "PIR-A-01",
  "sensor_id": "SENSOR-PIR-A-01",
  "room_id": "ROOM-SERVER-A",
  "severity": "HIGH",
  "metadata": {
    "simulated": true,
    "infrared_level": 89.2
  }
}
```
- **Response** (`201 Created`):
```json
{
  "id": "e4a2d81f-7b9c-4f1e-9a3d-123456789abc",
  "timestamp": "2026-09-21T10:05:00.000Z",
  "event_type": "MOTION_DETECTED",
  "source_device_id": "PIR-A-01",
  "sensor_id": "SENSOR-PIR-A-01",
  "room_id": "ROOM-SERVER-A",
  "severity": "HIGH",
  "status": "CORRELATED",
  "metadata": { "simulated": true, "infrared_level": 89.2 },
  "correlation_id": "INC-2026-001",
  "trust_impact": 0.0
}
```

### `GET /api/events`
Query events with optional query parameters:
- `event_type`: filter by type (e.g. `RFID_UNAUTHORIZED`)
- `severity`: filter by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`)
- `room_id`: filter by room
- `limit`: page size (default 50, max 500)
- `offset`: pagination offset

---

## 4. Incidents & AI Investigation

### `GET /api/incidents`
Returns list of recorded security incidents.

### `GET /api/incidents/{id}`
Returns incident details, correlated events, affected sensors, and active blind spots.

### `POST /api/incidents/{id}/investigate`
Triggers the AI Investigator (or Demo AI Fallback).
- **Response**:
```json
{
  "incident_type": "COORDINATED_CYBER_PHYSICAL_BREACH",
  "summary": "Demo AI Investigator correlated 4 events in Server Room A...",
  "risk_level": "CRITICAL",
  "confidence": 0.92,
  "evidence": [
    "Unauthorized credential scan rejected at perimeter badge reader.",
    "Physical perimeter door latch contact registered door open.",
    "Interior PIR sensor confirmed movement inside restricted area.",
    "Cyber telemetry registered abnormal login attempt on critical system."
  ],
  "timeline": [
    "[10:01:00] RFID-GATE-01: RFID_UNAUTHORIZED (Severity: LOW)",
    "[10:01:04] DOOR-A-01: DOOR_OPEN (Severity: MEDIUM)",
    "[10:01:06] PIR-A-01: MOTION_DETECTED (Severity: HIGH)",
    "[10:01:09] AUTH-SERVER-01: SUSPICIOUS_LOGIN (Severity: CRITICAL)"
  ],
  "sensor_concerns": [
    "Sensor 'SENSOR-PIR-A-01' trust score dropped to 38% [ANOMALY]."
  ],
  "possible_explanations": [
    "Coordinated cyber-physical intrusion by unauthorized actor.",
    "Simulated sensor telemetry replay or packet injection."
  ],
  "recommended_actions": [
    "Execute simulated quarantine on suspect device(s): [SENSOR-PIR-A-01].",
    "Engage secondary fallback monitoring sensors to cover perimeter blind spots."
  ],
  "reasoning_summary": "Correlated temporal alignment between physical access telemetry and cyber authentication.",
  "investigator_engine": "Demo AI Investigator (Rule-Based Fallback)"
}
```

### `POST /api/incidents/{id}/acknowledge`
Marks incident status as `ACKNOWLEDGED`.

### `POST /api/incidents/{id}/resolve`
Marks incident status as `RESOLVED`.

---

## 5. Devices & Simulated Quarantine

### `POST /api/devices/{id}/quarantine`
Places a device and its attached sensors into simulated quarantine.
- **Request**:
```json
{
  "reason": "Simulated tampering detected during incident investigation"
}
```
- **Response**:
```json
{
  "status": "SUCCESS",
  "message": "Device 'PIR-A-01' has been placed in simulated quarantine.",
  "device": {
    "id": "PIR-A-01",
    "status": "QUARANTINED",
    "trust_score": 38.0
  },
  "coverage": {
    "room_id": "ROOM-SERVER-A",
    "overall_coverage": 75.0,
    "active_blind_spots": [
      {
        "category": "Motion Telemetry Blind Spot",
        "description": "Movement inside room cannot currently be independently verified."
      }
    ]
  }
}
```

### `POST /api/devices/{id}/restore`
Restores a quarantined device to `ONLINE` status.

---

## 6. Sensor Trust & Blind Spots

### `GET /api/trust`
Returns global trust overview, average score, and tier breakdown.

### `GET /api/trust/history/{sensor_id}`
Returns chronological audit log of score adjustments with explanations.

### `GET /api/blind-spots`
Returns 4-pillar coverage breakdown per room and active blind spots.

---

## 7. Attack Simulator & Demo

### `POST /api/simulator/attack`
Triggers a synthetic scenario (`COORDINATED_INTRUSION`, `UNAUTHORIZED_RFID`, `SENSOR_INCONSISTENCY`, `SENSOR_MANIPULATION`, `NETWORK_ANOMALY`, `BLIND_SPOT`).

### `POST /api/simulator/demo`
Executes the full 13-step Enterprise Security Demonstration Scenario.

### `POST /api/simulator/reset`
Resets all sensors to 100% trust, restores quarantined devices, and clears active demo incidents.

---

## 8. WebSocket Stream

### `WS /ws/events`
Real-time JSON event stream.
- **Event Types**: `NEW_EVENT`, `INCIDENT_UPDATED`, `INCIDENT_ACKNOWLEDGED`, `INCIDENT_RESOLVED`, `DEVICE_QUARANTINED`, `DEVICE_RESTORED`, `DEMO_LOADED`, `DEMO_RESET`.
- **Heartbeat**: Send `"ping"`, server replies with `"pong"`.
