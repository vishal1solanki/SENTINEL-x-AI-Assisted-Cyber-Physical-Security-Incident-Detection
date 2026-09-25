import {
  User, Room, Device, Sensor, Event, Incident, IncidentDetail,
  BlindSpot, ResponseAction, SystemHealth, AIInvestigationResult
} from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sentinel_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = `Request to ${endpoint} failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errBody);
      errMsg = parsed.detail || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return response.json();
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    return request<{ access_token: string; role: string; user_id: string; name: string }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify(credentials) }
    );
  },
  getMe: async () => request<User>('/api/auth/me'),

  // Rooms
  getRooms: async () => request<Room[]>('/api/rooms'),
  getRoom: async (id: string) => request<Room>(`/api/rooms/${id}`),

  // Devices
  getDevices: async (roomId?: string) => {
    const q = roomId ? `?room_id=${encodeURIComponent(roomId)}` : '';
    return request<Device[]>(`/api/devices${q}`);
  },
  getDevice: async (id: string) => request<Device>(`/api/devices/${id}`),
  quarantineDevice: async (deviceId: string, reason: string, incidentId?: string) => {
    return request<{ status: string; message: string; device: any; coverage: any }>(
      `/api/devices/${deviceId}/quarantine`,
      { method: 'POST', body: JSON.stringify({ reason, incident_id: incidentId }) }
    );
  },
  restoreDevice: async (deviceId: string, reason: string, incidentId?: string) => {
    return request<{ status: string; message: string; device: any; coverage: any }>(
      `/api/devices/${deviceId}/restore`,
      { method: 'POST', body: JSON.stringify({ reason, incident_id: incidentId }) }
    );
  },

  // Sensors
  getSensors: async (deviceId?: string) => {
    const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return request<Sensor[]>(`/api/sensors${q}`);
  },
  getSensor: async (id: string) => request<Sensor>(`/api/sensors/${id}`),
  getSensorTrust: async (id: string) => request<{
    sensor_id: string;
    trust_score: number;
    trust_category: string;
    history: any[];
  }>(`/api/sensors/${id}/trust`),

  // Events
  getEvents: async (params: {
    event_type?: string;
    severity?: string;
    room_id?: string;
    source_device_id?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const sp = new URLSearchParams();
    if (params.event_type) sp.append('event_type', params.event_type);
    if (params.severity) sp.append('severity', params.severity);
    if (params.room_id) sp.append('room_id', params.room_id);
    if (params.source_device_id) sp.append('source_device_id', params.source_device_id);
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.offset) sp.append('offset', params.offset.toString());
    return request<Event[]>(`/api/events?${sp.toString()}`);
  },
  createEvent: async (eventData: Partial<Event>) => {
    return request<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Incidents
  getIncidents: async (params: { status?: string; severity?: string; room_id?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.status) sp.append('status', params.status);
    if (params.severity) sp.append('severity', params.severity);
    if (params.room_id) sp.append('room_id', params.room_id);
    return request<Incident[]>(`/api/incidents?${sp.toString()}`);
  },
  getIncident: async (id: string) => request<IncidentDetail>(`/api/incidents/${id}`),
  acknowledgeIncident: async (id: string) => {
    return request<{ status: string; message: string }>(`/api/incidents/${id}/acknowledge`, { method: 'POST' });
  },
  investigateIncident: async (id: string) => {
    return request<AIInvestigationResult>(`/api/incidents/${id}/investigate`, { method: 'POST' });
  },
  resolveIncident: async (id: string) => {
    return request<{ status: string; message: string }>(`/api/incidents/${id}/resolve`, { method: 'POST' });
  },
  getIncidentTimeline: async (id: string) => {
    return request<{ incident_id: string; title: string; events: any[] }>(`/api/incidents/${id}/timeline`);
  },

  // Sensor Trust
  getTrustOverview: async () => request<{
    average_trust: number;
    total_sensors: number;
    distribution: { high: number; moderate: number; low: number; critical: number };
    sensors: Sensor[];
  }>('/api/trust'),
  getSensorTrustHistory: async (sensorId: string) => request<{
    sensor_id: string;
    current_score: number;
    category: string;
    history: any[];
  }>(`/api/trust/history/${sensorId}`),

  // Blind Spots
  getBlindSpots: async () => request<{
    active_blind_spots_count: number;
    prototype_security_coverage: number;
    room_coverages: any[];
    blind_spots: BlindSpot[];
  }>('/api/blind-spots'),

  // Simulator
  getScenarios: async () => request<Record<string, any>>('/api/simulator/scenarios'),
  triggerTestFlow: async (testId: string | number) => {
    return request<{
      status: string;
      test_id: string;
      name: string;
      expected_result: string;
      steps_executed: any[];
      incident?: any;
    }>(`/api/simulator/test/${testId}`, { method: 'POST' });
  },
  triggerAttack: async (scenarioType: string, roomId = 'ROOM-SERVER-A', speed = 1.0) => {
    return request<{ status: string; scenario: string; steps_executed: number }>(
      '/api/simulator/attack',
      { method: 'POST', body: JSON.stringify({ scenario_type: scenarioType, room_id: roomId, speed }) }
    );
  },
  triggerPhase: async (phaseId: string | number) => {
    return request<{
      status: string;
      phase: string;
      step: number;
      description: string;
      event_type: string;
      incident_id?: string;
    }>(`/api/simulator/phase/${phaseId}`, { method: 'POST' });
  },
  replayStep: async (stepData: any) => {
    return request<{ status: string; message: string; incident_id?: string }>(
      '/api/simulator/replay',
      { method: 'POST', body: JSON.stringify(stepData) }
    );
  },
  loadDemo: async () => request<{ status: string; message: string; steps_executed: number }>('/api/simulator/demo', { method: 'POST' }),
  resetDemo: async () => request<{ status: string; message: string }>('/api/simulator/reset', { method: 'POST' }),

  // Responses
  getResponses: async (incidentId?: string) => {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : '';
    return request<ResponseAction[]>(`/api/responses${q}`);
  },
  simulateResponse: async (action: { device_id: string; action_type: string; reason: string; incident_id?: string }) => {
    return request<ResponseAction>('/api/responses/simulate', {
      method: 'POST',
      body: JSON.stringify(action),
    });
  },

  // Reports
  getIncidentReport: async (id: string, format: 'json' | 'html' = 'json') => {
    if (format === 'html') {
      const res = await fetch(`${BASE_URL}/api/reports/${id}?format=html`, { headers: getAuthHeaders() });
      return res.text();
    }
    return request<any>(`/api/reports/${id}?format=json`);
  },

  // System
  getSystemStatus: async () => request<SystemHealth>('/api/system/status'),
  getHealth: async () => request<{ status: string; service: string }>('/health'),
  testTelegram: async () => request<{ status: string; message: string }>('/api/system/test-telegram', { method: 'POST' }),
};
