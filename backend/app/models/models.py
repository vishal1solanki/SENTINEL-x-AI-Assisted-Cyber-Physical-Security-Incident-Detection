import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
)
from sqlalchemy.orm import relationship
from ..database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="VIEWER")  # ADMIN, SOC_ANALYST, VIEWER
    created_at = Column(DateTime, default=get_utc_now)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    security_level = Column(String(50), nullable=False, default="HIGH")
    created_at = Column(DateTime, default=get_utc_now)

    devices = relationship("Device", back_populates="room", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="room")
    incidents = relationship("Incident", back_populates="room")
    blind_spots = relationship("BlindSpot", back_populates="room")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)  # RFID_READER, DOOR_CONTROLLER, PIR_SENSOR, GATEWAY, CCTV, AUTH_SERVER
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    status = Column(String(50), nullable=False, default="ONLINE")  # ONLINE, OFFLINE, QUARANTINED, DEGRADED
    trust_score = Column(Float, nullable=False, default=100.0)
    last_seen = Column(DateTime, default=get_utc_now)
    firmware_version = Column(String(50), nullable=False, default="v1.2.0")
    created_at = Column(DateTime, default=get_utc_now)

    room = relationship("Room", back_populates="devices")
    sensors = relationship("Sensor", back_populates="device", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="source_device")
    response_actions = relationship("ResponseAction", back_populates="device")

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String(50), primary_key=True)
    device_id = Column(String(50), ForeignKey("devices.id"), nullable=False)
    sensor_type = Column(String(50), nullable=False)  # RFID, DOOR_CONTACT, PIR, NETWORK, AUTH
    status = Column(String(50), nullable=False, default="ONLINE")  # ONLINE, OFFLINE, QUARANTINED, ANOMALY
    trust_score = Column(Float, nullable=False, default=100.0)
    last_event = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)

    device = relationship("Device", back_populates="sensors")
    trust_history = relationship("SensorTrustHistory", back_populates="sensor", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="sensor")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=get_utc_now, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    source_device_id = Column(String(50), ForeignKey("devices.id"), nullable=False)
    sensor_id = Column(String(50), ForeignKey("sensors.id"), nullable=True)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=True)
    severity = Column(String(50), nullable=False, default="INFO")  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), nullable=False, default="PROCESSED")  # PROCESSED, PENDING, CORRELATED, QUARANTINED
    metadata_json = Column(JSON, default=dict)  # named metadata_json to prevent collision with Base.metadata
    correlation_id = Column(String(100), nullable=True, index=True)
    trust_impact = Column(Float, default=0.0)

    source_device = relationship("Device", back_populates="events")
    sensor = relationship("Sensor", back_populates="events")
    room = relationship("Room", back_populates="events")
    incident_associations = relationship("IncidentEvent", back_populates="event")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True)
    title = Column(String(200), nullable=False)
    incident_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="MEDIUM")  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    risk_level = Column(String(50), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), nullable=False, default="NEW")  # NEW, ACKNOWLEDGED, INVESTIGATING, CONTAINED, RESOLVED
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    started_at = Column(DateTime, default=get_utc_now)
    resolved_at = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=False)
    ai_analysis = Column(JSON, nullable=True)
    confidence = Column(Float, default=0.85)

    room = relationship("Room", back_populates="incidents")
    event_associations = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    response_actions = relationship("ResponseAction", back_populates="incident")

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)

    incident = relationship("Incident", back_populates="event_associations")
    event = relationship("Event", back_populates="incident_associations")

class SensorTrustHistory(Base):
    __tablename__ = "sensor_trust_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sensor_id = Column(String(50), ForeignKey("sensors.id"), nullable=False)
    old_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=get_utc_now)

    sensor = relationship("Sensor", back_populates="trust_history")

class BlindSpot(Base):
    __tablename__ = "blind_spots"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="MEDIUM")
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=get_utc_now)
    resolved_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, RESOLVED

    room = relationship("Room", back_populates="blind_spots")

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True)
    device_id = Column(String(50), ForeignKey("devices.id"), nullable=False)
    action_type = Column(String(50), nullable=False)  # QUARANTINE, RESTORE, ISOLATE, FALLBACK_MONITORING, NOTIFY_OPERATOR
    status = Column(String(50), nullable=False, default="COMPLETED")  # PENDING, COMPLETED, FAILED
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=get_utc_now)

    device = relationship("Device", back_populates="response_actions")
    incident = relationship("Incident", back_populates="response_actions")

class AttackScenario(Base):
    __tablename__ = "attack_scenarios"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    events = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=get_utc_now)
