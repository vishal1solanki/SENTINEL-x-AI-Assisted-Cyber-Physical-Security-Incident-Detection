# SENTINEL-X Enterprise Security Demonstration Scenario Guide

This guide walks through the exact **13-Step Cyber-Physical Security Attack Simulationnstration**.
This entire demonstration operates locally and requires no external API keys or paid cloud services.

---

## Prerequisites
1. **Backend Server Running**:
   ```bash
   cd backend
   uvicorn app.main:app --port 8000 --reload
   ```
2. **Frontend SOC Dashboard Running**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## One-Click Demonstration

In the Web SOC Dashboard header, simply click:
> **`LOAD Security Attack Simulation`**

The entire 13-step sequence will execute automatically and broadcast across the dashboard and mobile application.

---

## Step-by-Step Scenario Breakdown

### Initial Baseline (T-00:00)
- **Perimeter**: Server Room A
- **Devices**:
  - `RFID-GATE-01`: Online (Trust: 96%)
  - `DOOR-A-01`: Online (Trust: 94%)
  - `PIR-A-01`: Online (Trust: 85%)
  - `GATEWAY-A-01`: Online (Trust: 98%)
- **Blind Spots**: 0 Active (Prototype Security Coverage: 100%)

### Step 1: Unauthorized RFID Presented (T+00:01)
- An unregistered badge is scanned at the Server Room A gate.
- Event: `RFID_UNAUTHORIZED` (Device: `RFID-GATE-01`, Severity: `LOW`).
- Status indicator flashes amber on Live Monitoring.

### Step 2: Door Opens (T+00:04)
- Door latch contact reports perimeter door opened without authorization.
- Event: `DOOR_OPEN` (Device: `DOOR-A-01`, Severity: `MEDIUM`).

### Step 3: Interior Motion Detected (T+00:06)
- Interior PIR sensor detects motion inside Server Room A.
- Event: `MOTION_DETECTED` (Device: `PIR-A-01`, Severity: `HIGH`).

### Step 4: Suspicious Cyber Login (T+00:09)
- Local console authentication recorded on `AUTH-SERVER-01`.
- Event: `SUSPICIOUS_LOGIN` (Severity: `CRITICAL`).

### Step 5: Correlation Engine Triggers Incident (T+00:10)
- The Correlation Engine fuses the physical breach sequence with the local cyber login.
- Generates Incident: **`INC-2026-001: Possible Coordinated Cyber-Physical Incident`** (Severity: `CRITICAL`, Confidence: $92\%$).
- Real-time toast alert popups appear in the Web SOC Dashboard and Mobile App.

### Step 6: AI Investigator Analyzes Evidence (T+00:12)
- Click **AI INVESTIGATE** in the incident dossier (`/incidents/INC-2026-001`).
- The **Demo AI Investigator** assesses evidence, explains hypotheses, and identifies temporal alignment.

### Step 7: PIR Telemetry Becomes Abnormal (T+00:15)
- PIR sensor pulse frequency desynchronizes.
- Event: `TELEMETRY_ANOMALY` (Device: `PIR-A-01`, Severity: `HIGH`).

### Step 8: Sensor Trust Decreases (T+00:17)
- Contradictory pulses are recorded (`SENSOR_INCONSISTENCY`).
- The Sensor Trust Engine applies deductions ($-15\%$ for anomaly, $-10\%$ for inconsistency).
- Sensor `SENSOR-PIR-A-01` trust score drops to **$38\%$ (CRITICAL TRUST CONCERN)**.

### Step 9: Sensor Integrity Warning Raised (T+00:19)
- Device status updates to `ANOMALY`.
- The AI Investigator flags: *"PIR sensor telemetry reliability questionable. Possible sensor manipulation or physical bypass."*

### Step 10: Operator Simulates Quarantine (T+00:22)
- In the Web or Mobile UI, click **`SIMULATE QUARANTINE`** on `PIR-A-01`.
- Device status switches to `QUARANTINED`.
- Quarantined telemetry is isolated to prevent lateral spoofing.

### Step 11: Fallback Monitoring Activated (T+00:25)
- The Blind Spot Engine evaluates coverage.
- Because PIR motion monitoring is quarantined, room coverage drops to **$75\%$**.
- Active Blind Spot Created: *"Motion cannot currently be independently verified in Server Room A."*
- Secondary fallback monitoring sensors are highlighted.

### Step 12: Operator Restores Sensor (T+00:30)
- Guard physical inspection confirms perimeter latch is secure and sensor is cleared.
- Operator clicks **`RESTORE DEVICE`**.
- Status returns to `ONLINE`, provisional trust restored to $75\%$, blind spot resolved.

### Step 13: Incident Resolved (T+00:35)
- Operator clicks **`RESOLVE`**.
- Incident status transitions to `RESOLVED` with timestamp.
- Click **`GENERATE REPORT`** to view or print the complete forensic audit dossier.

---

## Resetting the Demo

To return the entire platform to a clean baseline state:
- Click **`RESET DEMO`** in the header.
- Sensor trust scores reset to 100.0%.
- Devices are restored to `ONLINE`.
- Incidents are archived as `RESOLVED`.
- Room coverage returns to 100.0%.
