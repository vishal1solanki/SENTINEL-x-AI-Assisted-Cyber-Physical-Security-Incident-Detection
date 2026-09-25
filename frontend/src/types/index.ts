export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SOC_ANALYST' | 'VIEWER';
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  security_level: string;
  device_count: number;
  active_incidents_count: number;
  coverage_score: number;
}

export interface Sensor {
  id: string;
  device_id: string;
  sensor_type: string;
  status: 'ONLINE' | 'OFFLINE' | 'QUARANTINED' | 'ANOMALY';
  trust_score: number;
  trust_category?: 'HIGH TRUST' | 'MODERATE TRUST' | 'LOW TRUST' | 'CRITICAL TRUST CONCERN';
  last_event?: string;
}

export interface SensorTrustHistory {
  id: string;
  sensor_id: string;
  old_score: number;
  new_score: number;
  reason: string;
  timestamp: string;
}

export interface Device {
  id: string;
  name: string;
  device_type: string;
  room_id: string;
  status: 'ONLINE' | 'OFFLINE' | 'QUARANTINED' | 'DEGRADED' | 'ANOMALY';
  trust_score: number;
  firmware_version: string;
  last_seen: string;
  sensors: Sensor[];
}

export interface Event {
  id: string;
  timestamp: string;
  event_type: string;
  source_device_id: string;
  sensor_id?: string;
  room_id?: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'PROCESSED' | 'CORRELATED' | 'QUARANTINED';
  metadata: Record<string, any>;
  correlation_id?: string;
  trust_impact: number;
  step_description?: string;
}

export interface AIInvestigationResult {
  incident_type: string;
  summary: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  evidence: string[];
  timeline: string[];
  sensor_concerns: string[];
  possible_explanations: string[];
  recommended_actions: string[];
  reasoning_summary: string;
  investigator_engine?: string;
}

export interface Incident {
  id: string;
  title: string;
  incident_type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  room_id: string;
  started_at: string;
  resolved_at?: string;
  summary: string;
  ai_analysis?: AIInvestigationResult;
  confidence: number;
  evidence_count: number;
  trust_impact: number;
}

export interface IncidentDetail extends Incident {
  events: Event[];
  affected_sensors: {
    id: string;
    sensor_type: string;
    status: string;
    trust_score: number;
    device_id: string;
  }[];
  blind_spots: {
    id: string;
    category: string;
    severity: string;
    description: string;
  }[];
}

export interface BlindSpot {
  id: string;
  room_id: string;
  category: string;
  severity: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface ResponseAction {
  id: string;
  incident_id?: string;
  device_id: string;
  action_type: 'QUARANTINE' | 'RESTORE' | 'ISOLATE' | 'FALLBACK_MONITORING' | 'NOTIFY_OPERATOR';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reason: string;
  timestamp: string;
}

export interface SystemHealth {
  backend: string;
  database: string;
  n8n: string;
  ai_provider: string;
  ai_status: string;
  websocket: string;
  simulator: string;
  wokwi: string;
  timestamp: string;
}
