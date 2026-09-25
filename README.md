# SENTINEL-X

**AI-Assisted Cyber-Physical Security Incident Detection, Investigation, Sensor Trust, and Simulated Response Platform**

> *"Don't just detect the attack. Detect when the security system itself may no longer be trustworthy."*

---

## 🛡️ Project Overview

**SENTINEL-X** is a unified cyber-physical security platform engineered for critical infrastructure defense. Traditional Security Information & Event Management (SIEM) systems assume edge telemetry is infallible ground truth. SENTINEL-X breaks this dangerous assumption by continuously evaluating **Security Telemetry Trust**:

1. **Cyber-Physical Correlation**: Fuses physical access telemetry (RFID, door reed switches, PIR motion) with cyber telemetry (authentication logs, network payloads).
2. **Sensor Trust Engine (0-100%)**: Dynamically penalizes sensors exhibiting contradictory signals, timing jitter, or manipulation.
3. **Consistency Verification**: Distinguishes *"Physically consistent intrusions"* from *"Sensor inconsistencies & tampering"*.
4. **Security Blind Spot Detection**: Continuously audits coverage across 4 pillars (Access Control, Door Contact, Motion, Cyber Telemetry).
5. **AI Investigator (Dual-Mode)**: Explains evidence and formulates safe advisory responses using OpenAI-compatible models or a **100% offline Demo AI fallback** requiring zero API keys.
6. **Adaptive Response & Simulated Quarantine**: Isolates compromised edge nodes within the software model and engages secondary fallback sensors.
7. **Hardware & Orchestration Ready**: Includes Wokwi ESP32 firmware simulation, an importable n8n workflow, a React Web SOC Dashboard, and a React Native Expo mobile app.

---

## 🔒 Security Hardening ("Can't Be Hacked")

To guarantee enterprise-grade protection for the security system itself:
- **Bcrypt Password Salting & Hashing**: 12 rounds of salting prevents rainbow table attacks.
- **JWT Authentication**: HMAC-SHA256 tokens with expiry validation and RBAC enforcement (`ADMIN`, `SOC_ANALYST`, `VIEWER`).
- **Security Headers Middleware**: Enforces `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- **In-Memory Rate Limiting**: Throttles brute-force login attempts and endpoint flooding.
- **Strict Pydantic V2 Schemas**: All inputs and payloads are strictly sanitized against injection attacks.
- **SQLAlchemy Parameterized Queries**: Protects the SQLite/PostgreSQL database against SQL injection.
- **Immutable Audit Logging**: Every administrative action (quarantine, restore, acknowledge, resolve, login) is permanently audited with actor, target, timestamp, and details.
- **Strict Simulation Boundaries**: No real exploits, network disruptions, or hardware sabotage are executed.

---

## 🏛️ System Architecture

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

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, SQLite / PostgreSQL |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Mobile** | React Native, Expo, TypeScript |
| **Edge Hardware** | Wokwi ESP32, FreeRTOS/Arduino C++, PIR Motion, RFID Button Sim, LED/Buzzer |
| **Automation** | n8n Webhook Orchestration Pipeline |
| **AI Layer** | OpenAI-Compatible API (`gpt-4o-mini`) + Deterministic Offline **Demo AI Investigator** |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm
- (Optional) Docker and Docker Compose

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-repo/sentinel-x.git
cd sentinel-x
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m app.database.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (OpenAPI Swagger Docs: `http://localhost:8000/docs`).*

### 3. Frontend SOC Dashboard Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 4. Running via Docker Compose
To spin up backend, frontend, and n8n in a single command:
```bash
docker compose up --build -d
```

### 5. Running the Mobile Incident Response App
```bash
cd ../mobile
npm install
npx expo start
```
*Press `w` for web preview or scan the QR code with Expo Go on your mobile phone.*

---

## 🔑 Demo User Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sentinel.local` | `Admin@SentinelX2026!` | All actions, user management, simulator |
| **Lead SOC Analyst** | `analyst@sentinel.local` | `Analyst@SentinelX2026!` | Investigate, quarantine, restore, resolve |
| **Auditor / Viewer** | `viewer@sentinel.local` | `Viewer@SentinelX2026!` | Read-only access to feeds and reports |

*Note: The Web Dashboard and Mobile App include a one-click role switcher in the top navigation.*

---

## ⚡ 13-Step Enterprise Security Demonstration Scenario

To execute the complete demo scenario in Server Room A:
1. Open the Web SOC Dashboard at `http://localhost:5173`.
2. Click the blue **`LOAD Security Attack Simulation`** button in the header.
3. Observe the progression:
   - **Step 1**: Unauthorized RFID badge presented.
   - **Step 2**: Perimeter door opens.
   - **Step 3**: PIR interior motion detected.
   - **Step 4**: Suspicious console login on server.
   - **Step 5**: Correlation Engine flags **"Possible Coordinated Cyber-Physical Incident"**.
   - **Step 6**: AI Investigator synthesizes evidence and flags sensor trust concerns.
   - **Step 7**: PIR sensor pulse frequency desynchronizes.
   - **Step 8**: Sensor Trust score drops to **38% (CRITICAL TRUST CONCERN)**.
   - **Step 9**: Sensor integrity warning generated.
   - **Step 10**: Operator clicks **`SIMULATE QUARANTINE`** on `PIR-A-01`.
   - **Step 11**: Coverage drops to 75% and **Active Blind Spot** alert is created.
   - **Step 12**: Operator clicks **`RESTORE DEVICE`** after inspection.
   - **Step 13**: Operator clicks **`RESOLVE`** and generates print-ready audit report.
4. Click **`RESET DEMO`** at any time to return to a clean baseline.

---

## 🧪 Automated Testing

To run the automated backend test suite (8 tests covering correlation, trust score, consistency, API auth, quarantine/restore, and demo scenarios):
```bash
cd backend
python -m pytest -v tests
```

---

## 🔗 Default Local URLs

- **Web SOC Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
- **n8n Automation Engine**: `http://localhost:5678`
- **Wokwi Simulator**: [Wokwi.com](https://wokwi.com) (import `wokwi/sketch.ino` and `wokwi/diagram.json`)

---

## 🔮 Future Scope & Roadmap
- Hardware-backed attestation (TPM / Zero Trust IoT chipsets)
- Native Splunk & Microsoft Sentinel forwarders
- 3D Digital Twin perimeter mapping with sensor heatmaps
- Federated edge ML for behavioral anomaly learning
