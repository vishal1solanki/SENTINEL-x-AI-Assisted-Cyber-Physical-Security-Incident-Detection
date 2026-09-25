# SENTINEL-X Backend API

FastAPI-powered cyber-physical security backend implementing real-time event correlation, sensor trust scoring, telemetry inconsistency detection, prototype blind-spot coverage, simulated device quarantine, and AI incident investigation.

## Core Engines
1. **Correlation Engine** (`app/engines/correlation_engine.py`): Ingests physical access and cyber telemetry, normalizes events, applies temporal sliding windows, correlates breach sequences, and creates/updates security incidents.
2. **Sensor Trust Engine** (`app/engines/trust_engine.py`): Dynamic score [0-100] per sensor with penalty deductions (inconsistencies, anomalies, missing heartbeats, simulated tampering) and recovery, with full historical auditing.
3. **Consistency Engine** (`app/engines/consistency_engine.py`): Answers "Can the security system itself still be trusted?" by analyzing physical sensor conflicts (e.g., motion detected with closed door).
4. **Blind Spot Engine** (`app/engines/blindspot_engine.py`): Evaluates prototype coverage across 4 pillars: Access Control, Door Monitoring, Motion Monitoring, and Cyber Telemetry.
5. **AI Investigator** (`app/ai/`): Provides structured incident analysis. When `AI_API_KEY` is present, queries OpenAI-compatible models; otherwise falls back to the deterministic offline **Demo AI Investigator**.
6. **Response Service** (`app/services/response_service.py`): Executes simulated device isolation (quarantine), activates fallback monitoring, and handles device restoration.

## Security Hardening
- **Bcrypt Password Hashing**: Cryptographic password salting and hashing.
- **JWT Authentication**: SHA-256 HMAC tokens with expiry.
- **Role-Based Access Control (RBAC)**: `ADMIN`, `SOC_ANALYST`, `VIEWER`.
- **Security Headers**: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff.
- **Rate Limiting**: Protection on authentication and sensitive endpoints.
- **Audit Logging**: Every quarantine, restore, acknowledge, resolve, and login action is immutably logged.

## Quick Start

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Initialize and Seed Database
```bash
python -m app.database.seed
```

### 3. Start Backend Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Automated Tests
```bash
python -m pytest -v tests
```

### 5. API Documentation
Open `http://localhost:8000/docs` for interactive Swagger UI or `http://localhost:8000/redoc`.
