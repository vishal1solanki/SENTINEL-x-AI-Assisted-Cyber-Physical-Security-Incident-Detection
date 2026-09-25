# SENTINEL-X Cyber-Physical Security & Trust Model

## The Core Problem: Blind Trust in Security Sensors

Conventional Intrusion Detection Systems (IDS) and Security Information and Event Management (SIEM) platforms treat IoT and edge sensors as infallible ground truth. If a sensor reports movement, the system concludes an intrusion has occurred. If a sensor reports nominal status, the system assumes the perimeter is secure.

In reality, sensors themselves can be:
1. **Manipulated or Spoofed**: Attackers can inject synthetic telemetry packets, short circuit contacts, or desynchronize clocks.
2. **Physically Bypassed**: Micro-switches can fail or be tampered with via magnets or physical shims.
3. **Environmentally Degraded**: Infrared sensors experience thermal drift; radio readers experience interference.
4. **Blinded**: Compromised or disabled sensors create dark zones in the security perimeter.

## SENTINEL-X Cyber-Physical Threat Model

SENTINEL-X changes the fundamental security question from:
> *"Is an attack happening?"*

To:
> *"Can the security system itself still be trusted?"*

### 1. Physical vs. Cyber Cross-Domain Correlation
Physical perimeter events and cyber events cannot be evaluated in silos:
- **Physical Breach Sequence**: `RFID_UNAUTHORIZED` $\to$ `DOOR_OPEN` $\to$ `MOTION_DETECTED`
- **Cross-Domain Escalation**: When physical traversal is followed within seconds by `SUSPICIOUS_LOGIN` (e.g. local console access) or `NETWORK_ANOMALY` (high-frequency outbound gateway traffic), the incident confidence increases from isolated physical suspicion ($0.75$) to coordinated cyber-physical breach ($0.92$).

### 2. Consistency Analysis: "Suspicious but Consistent" vs. "Suspicious and Inconsistent"
The Consistency Engine evaluates whether physical laws are preserved:
- **Consistent Suspicious Sequence**:
  - `RFID_UNAUTHORIZED` $\to$ `DOOR_OPEN` $\to$ `MOTION_DETECTED`
  - *Verdict*: Physically plausible perimeter breach. The door opened and the intruder moved inside.
- **Inconsistent Suspicious Sequence**:
  - `DOOR_CLOSED` $\to$ `MOTION_DETECTED` (with no door opening)
  - *Verdict*: Physical telemetry contradiction.
  - *Possible Hypotheses*: PIR false trigger, magnetic bypass of door reed switch, actor was already inside perimeter prior to monitoring window, or telemetry packet injection.

### 3. Sensor Trust Scoring Matrix
Each sensor maintains an evaluated trust score $T \in [0, 100]$:

| Event / Trigger | Trust Deduction | Category Threshold | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Contradictory Event** | $-10.0$ | High (80-100) | Fully trusted telemetry |
| **Telemetry Anomaly** | $-15.0$ | Moderate (60-79) | Corroborating telemetry required |
| **Missing Heartbeat** | $-20.0$ | Low (40-59) | Telemetry flagged as unreliable |
| **Simulated Manipulation** | $-30.0$ | Critical (0-39) | Operator alerted; quarantine recommended |
| **Verified Normal Behavior** | $+1.5$ to $+2.0$ | Up to $100.0$ | Gradual trust recovery |

### 4. Safety & Security Boundaries
- **Simulation Only**: SENTINEL-X operates strictly on synthetic event models. No real systems, operational technologies, or network firewalls are attacked or disrupted.
- **No Arbitrary AI Execution**: The AI Investigator is purely advisory. It cannot execute shell commands, wipe systems, or modify host network routing.
- **Role-Based Access Control**: Sensitive actions (e.g. device quarantine and restoration) require authenticated `ADMIN` or `SOC_ANALYST` tokens.
- **Rate Limiting & Cryptographic Protection**: Login endpoints are protected by in-memory rate limiters, passwords hashed with bcrypt, and API interactions signed with HMAC-SHA256 JWTs.
