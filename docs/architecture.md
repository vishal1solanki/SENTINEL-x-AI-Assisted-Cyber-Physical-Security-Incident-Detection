# SENTINEL-X System Architecture

**"Don't just detect the attack. Detect when the security system itself may no longer be trustworthy."**

## Architectural Diagram

```
                 +-----------------------------+
                 |       Wokwi ESP32           |
                 |  (PIR + RFID Sim + Buttons) |
                 +--------------+--------------+
                                | HTTP JSON Telemetry
                                v
                 +-----------------------------+
                 |       FastAPI Backend       |
                 |  (REST Endpoints + WS Bus)  |
                 +--------------+--------------+
                                |
                                v
                 +-----------------------------+
                 |     Event Correlation       |
                 |     & Consistency Engine    |
                 +--------------+--------------+
                                |
                                v
                 +-----------------------------+
                 |     Sensor Trust Engine     |
                 |   (Dynamic Score 0 - 100)   |
                 +--------------+--------------+
                                |
                                v
                 +-----------------------------+
                 |     Security Blind Spot     |
                 |       Coverage Engine       |
                 +--------------+--------------+
                                |
                  +-------------+-------------+
                  |                           |
                  v                           v
     +--------------------------+  +----------------------+
     |   n8n Webhook Pipeline   |  |   AI Investigator    |
     |   (Automation Engine)    |  |  (OpenAI / Demo AI)  |
     +------------+-------------+  +----------+-----------+
                  |                           |
                  +-------------+-------------+
                                |
                                v
                 +-----------------------------+
                 |      Real-Time Dispatch     |
                 |       (WebSocket Bus)       |
                 +--------------+--------------+
                                |
            +-------------------+-------------------+
            |                                       |
            v                                       v
+-----------------------+               +-----------------------+
|   Web SOC Dashboard   |               |   Mobile IR App       |
|  (React + TypeScript) |               |  (React Native Expo)  |
+-----------+-----------+               +-----------+-----------+
            |                                       |
            +-------------------+-------------------+
                                |
                                v
                 +-----------------------------+
                 |       Response Engine       |
                 |  (Simulated Quarantine &    |
                 |      Adaptive Fallback)     |
                 +-----------------------------+
```

## System Components

### 1. Edge & Hardware Simulation (Wokwi ESP32)
- Microcontroller: ESP32 DevKit v4 running FreeRTOS/Arduino C++ (`wokwi/sketch.ino`).
- Sensors: PIR Motion Sensor (GPIO 13), RFID reader pushbuttons (GPIO 14 Auth / GPIO 27 Unauth), Door reed contact switch (GPIO 26).
- Annunciators: Visual green/red status LEDs and audio piezo buzzer.
- Ingestion Protocol: Transmits structured JSON payloads over HTTP POST to `/api/events`.

### 2. Backend & Ingestion API (FastAPI)
- Application Framework: Python 3.11+ / FastAPI with Pydantic v2 validation.
- Persistence: SQLAlchemy 2.0 ORM with SQLite database (PostgreSQL compatible).
- Concurrency: Async event loop and thread-safe session pooling (`StaticPool` in testing).

### 3. Event Correlation & Consistency Engines
- **Consistency Engine**: Analyzes co-located physical sensors to answer: "Can the security system itself still be trusted?" Identifies impossible physics (e.g. motion detected while door contact confirms door remained closed).
- **Correlation Engine**: Temporal sliding-window correlation (90s window) paired with room spatial boundaries. Correlates physical breach progression with simultaneous or subsequent cyber anomalies (e.g. unauthorized console logins or API bursts).

### 4. Sensor Trust Engine
- Assigns a dynamic score $S \in [0, 100]$ to every sensor.
- Standard Deductions:
  - Contradictory event: $-10$
  - Telemetry anomaly: $-15$
  - Repeated anomaly: $-10$
  - Missing heartbeat: $-20$
  - Simulated manipulation: $-30$
- Recovery: $+1.5$ to $+2.0$ upon verified normal telemetry.
- Categorization: High (80-100), Moderate (60-79), Low (40-59), Critical Concern (0-39).
- Immutable auditing: Every score adjustment records old score, new score, and explanatory reason in `sensor_trust_history`.

### 5. Blind Spot Coverage Engine
- Assesses 4 core telemetry pillars:
  1. Access Control (RFID)
  2. Door Contact Monitoring
  3. Motion Telemetry (PIR)
  4. Cyber Telemetry (Gateway / Auth)
- Computes "Prototype Security Coverage" percentage for every room.
- Automatically generates an active `BLIND_SPOT` record when a sensor drops offline or enters quarantine.

### 6. AI Investigator Layer
- **Cloud AI**: Queries OpenAI-compatible models (e.g. `gpt-4o-mini`) using strict JSON schema output.
- **Demo AI Fallback**: Deterministic, rule-based investigator running 100% locally offline. Synthesizes timeline, identifies contradictions, evaluates sensor trust drops, and provides safe advisory responses without external API keys.

### 7. User Interfaces
- **Web SOC Dashboard**: React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts. Features dark SOC aesthetic, interactive attack graphs, live WebSocket feed, and one-click demo controls.
- **Mobile Incident Response App**: React Native + Expo app for on-the-go triage, alert notifications, and device quarantine.

### 8. Adaptive Response & Simulated Quarantine
- When an operator or policy isolates a compromised node, its simulated status changes to `QUARANTINED`.
- Quarantined telemetry is flagged or ignored, preventing lateral spoofing.
- The Blind Spot Engine immediately flags the coverage reduction and highlights secondary fallback sensors.
- Restoration returns the device to `ONLINE` and resolves active blind spots.
