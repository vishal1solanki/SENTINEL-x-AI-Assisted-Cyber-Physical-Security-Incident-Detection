# SENTINEL-X Presentation Deck (7 Slides)

---

### Slide 1: The Problem
**Title: The Physical-Cyber Divide in Critical Infrastructure Defense**
- Traditional cybersecurity focuses purely on digital telemetry (logins, firewalls, packets).
- Traditional physical security focuses purely on access gates and camera monitoring.
- Real-world adversaries combine physical tampering with digital exploitation.
- Current SOC analysts lack a unified platform that correlates physical edge events with cybersecurity telemetry.

---

### Slide 2: The Critical Blind Spot
**Title: Why Existing Systems Fail: Blind Trust in Sensors**
- Existing SIEMs assume sensors never lie: *"If the door says closed, the door is closed."*
- Sensors can be bypassed (magnetic shims), spoofed (synthetic packet replay), or desynchronized.
- When an intrusion occurs simultaneously with a sensor anomaly, conventional alarms either generate hundreds of noisy false positives or miss the attack entirely.

---

### Slide 3: The SENTINEL-X Solution
**Title: SENTINEL-X: Cyber-Physical Incident Detection & Sensor Trust**
- **Tagline**: *"Don't just detect the attack. Detect when the security system itself may no longer be trustworthy."*
- Fuses physical RFID, door contacts, and PIR motion telemetry with cyber authentication events.
- Quantifies sensor integrity in real-time via a dynamic **Sensor Trust Score (0-100%)**.
- Distinguishes **"Physically Consistent Breaches"** from **"Sensor Inconsistencies & Tampering"**.

---

### Slide 4: Architecture & Correlation Engine
**Title: Under the Hood: Real-Time Event Fusion**
- **Edge Layer**: ESP32 hardware simulation (Wokwi) transmitting JSON telemetry.
- **Backend Core**: FastAPI, SQLAlchemy, WebSocket real-time bus, n8n webhook orchestration.
- **Engines**:
  - *Correlation Engine*: Temporal & spatial sliding window correlation.
  - *Consistency Engine*: Evaluates physical laws (motion without door open = contradiction).
  - *Sensor Trust Engine*: Deductions for anomalies, audit trail history.
  - *Blind Spot Engine*: Evaluates prototype coverage across 4 pillars.
- **AI Investigator**: Cloud LLM + deterministic 100% offline Demo AI fallback.

---

### Slide 5: Live Attack Demonstration
**Title: 13-Step Cyber-Physical Scenario (Server Room A)**
1. **Breach**: Unauthorized RFID badge presented $\to$ Door opens $\to$ PIR motion detected.
2. **Cyber Escalation**: Suspicious local console login on internal server $\to$ Critical Incident created.
3. **Telemetry Tampering**: PIR pulse frequency desynchronizes $\to$ Sensor Trust drops from $85\%$ to $38\%$.
4. **Adaptive Response**: Operator simulates quarantine $\to$ Node isolated $\to$ Coverage drops to $75\%$ $\to$ Secondary fallback engaged $\to$ Guard verifies and restores sensor $\to$ Incident resolved.

---

### Slide 6: Central Innovation
**Title: Security Telemetry Trust (The Key Differentiator)**
- Most platforms ask: *"Is an attack happening?"*
- SENTINEL-X additionally asks: *"Can the sensors reporting this telemetry still be trusted?"*
- Transparent audit logging for every single point change in trust.
- Dynamic coverage calculation prevents security dark zones when sensors fail.

---

### Slide 7: Future Scope & Roadmap
**Title: The Road Ahead**
- **Zero Trust IoT Hardware**: Cryptographic hardware-backed attestation (TPM / Secure Elements).
- **Enterprise SIEM Integration**: Native Splunk, Microsoft Sentinel, and Elastic SIEM forwarders.
- **Digital Twin Simulation**: 3D spatial room modeling with real-time sensor heatmaps.
- **Federated Anomaly Learning**: Edge-trained ML models detecting subtle drift across distributed facilities.
