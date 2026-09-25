from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "VIEWER"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    created_at: datetime

# --- Room Schemas ---
class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    security_level: str
    created_at: datetime
    device_count: Optional[int] = 0
    active_incidents_count: Optional[int] = 0
    coverage_score: Optional[float] = 100.0

# --- Sensor Schemas ---
class SensorBase(BaseModel):
    id: str
    device_id: str
    sensor_type: str
    status: str
    trust_score: float
    last_event: Optional[datetime] = None

class SensorResponse(SensorBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    trust_category: Optional[str] = "HIGH TRUST"

class SensorTrustHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sensor_id: str
    old_score: float
    new_score: float
    reason: str
    timestamp: datetime

# --- Device Schemas ---
class DeviceBase(BaseModel):
    id: str
    name: str
    device_type: str
    room_id: str
    status: str
    trust_score: float
    firmware_version: str

class DeviceResponse(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    last_seen: datetime
    created_at: datetime
    sensors: List[SensorResponse] = []

# --- Event Schemas ---
class EventCreate(BaseModel):
    event_type: str = Field(..., description="Event type like RFID_AUTHORIZED, MOTION_DETECTED, etc.")
    source_device_id: str
    sensor_id: Optional[str] = None
    room_id: Optional[str] = None
    severity: str = "INFO"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    correlation_id: Optional[str] = None
    trust_impact: float = 0.0

class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    timestamp: datetime
    event_type: str
    source_device_id: str
    sensor_id: Optional[str] = None
    room_id: Optional[str] = None
    severity: str
    status: str
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="metadata_json")
    correlation_id: Optional[str] = None
    trust_impact: float

# --- Incident Schemas ---
class IncidentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event: EventResponse

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    incident_type: str
    severity: str
    risk_level: str
    status: str
    room_id: str
    started_at: datetime
    resolved_at: Optional[datetime] = None
    summary: str
    ai_analysis: Optional[Dict[str, Any]] = None
    confidence: float
    evidence_count: Optional[int] = 0
    trust_impact: Optional[float] = 0.0

class IncidentDetailResponse(IncidentResponse):
    events: List[EventResponse] = []
    affected_sensors: List[Dict[str, Any]] = []
    blind_spots: List[Dict[str, Any]] = []

# --- AI Investigation Schema ---
class AIInvestigationResult(BaseModel):
    incident_type: str
    summary: str
    risk_level: str
    confidence: float
    evidence: List[str]
    timeline: List[str]
    sensor_concerns: List[str]
    possible_explanations: List[str]
    recommended_actions: List[str]
    reasoning_summary: str

# --- Blind Spot Schema ---
class BlindSpotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    room_id: str
    category: str
    severity: str
    description: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    status: str

# --- Response Action Schema ---
class ResponseActionCreate(BaseModel):
    incident_id: Optional[str] = None
    device_id: str
    action_type: str
    reason: str

class ResponseActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: Optional[str] = None
    device_id: str
    action_type: str
    status: str
    reason: str
    timestamp: datetime

# --- Simulator & Replay Schemas ---
class AttackSimulationRequest(BaseModel):
    scenario_type: str = Field(..., description="COORDINATED_INTRUSION | UNAUTHORIZED_RFID | SENSOR_INCONSISTENCY | SENSOR_MANIPULATION | NETWORK_ANOMALY | BLIND_SPOT")
    room_id: Optional[str] = "ROOM-SERVER-A"
    speed: Optional[float] = 1.0

class AttackReplayStep(BaseModel):
    step_number: int
    delay_seconds: float
    event: EventCreate
    description: str
    threat_level: str
    expected_trust_impact: float

# --- System Health Schema ---
class SystemHealthResponse(BaseModel):
    backend: str = "ONLINE"
    database: str = "ONLINE"
    n8n: str = "ONLINE"
    ai_provider: str
    ai_status: str
    websocket: str = "ONLINE"
    simulator: str = "ONLINE"
    wokwi: str = "READY"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Audit Log Schema ---
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    action: str
    target_type: str
    target_id: str
    details: Dict[str, Any]
    timestamp: datetime
