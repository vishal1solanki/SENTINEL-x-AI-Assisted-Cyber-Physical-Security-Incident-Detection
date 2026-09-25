const DEFAULT_API_URL = 'http://localhost:8000';

class MobileApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as any) },
    });

    if (!res.ok) {
      const text = await res.text();
      let msg = `Error ${res.status}`;
      try {
        const json = JSON.parse(text);
        msg = json.detail || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  }

  async login(email = 'analyst@sentinel.local', password = 'Analyst@SentinelX2026!') {
    const res = await this.request<{ access_token: string; role: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = res.access_token;
    return res;
  }

  async getSystemStatus() {
    return this.request<any>('/api/system/status');
  }

  async getIncidents() {
    return this.request<any[]>('/api/incidents');
  }

  async getIncident(id: string) {
    return this.request<any>(`/api/incidents/${id}`);
  }

  async acknowledgeIncident(id: string) {
    return this.request<any>(`/api/incidents/${id}/acknowledge`, { method: 'POST' });
  }

  async investigateIncident(id: string) {
    return this.request<any>(`/api/incidents/${id}/investigate`, { method: 'POST' });
  }

  async resolveIncident(id: string) {
    return this.request<any>(`/api/incidents/${id}/resolve`, { method: 'POST' });
  }

  async getDevices() {
    return this.request<any[]>('/api/devices');
  }

  async quarantineDevice(id: string, reason = 'Quarantined from Mobile IR App') {
    return this.request<any>(`/api/devices/${id}/quarantine`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async restoreDevice(id: string, reason = 'Restored from Mobile IR App') {
    return this.request<any>(`/api/devices/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getTrustOverview() {
    return this.request<any>('/api/trust');
  }

  async triggerDemo() {
    return this.request<any>('/api/simulator/demo', { method: 'POST' });
  }

  async resetDemo() {
    return this.request<any>('/api/simulator/reset', { method: 'POST' });
  }
}

export const mobileApi = new MobileApiService();
