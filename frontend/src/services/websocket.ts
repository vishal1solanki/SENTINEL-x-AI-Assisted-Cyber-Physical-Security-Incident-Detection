type WebSocketCallback = (event: { type: string; data: any; timestamp: number }) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Set<WebSocketCallback> = new Set();
  private reconnectInterval = 3000;
  private heartbeatInterval: any = null;
  private isConnecting = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Default to port 8000 if running on Vite dev port 5173
    const wsHost = host.includes(':5173') ? 'localhost:8000' : host;
    this.url = `${protocol}//${wsHost}/ws/events`;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Start ping heartbeat
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const parsed = JSON.parse(event.data);
          this.notifyListeners(parsed);
        } catch {
          // non-json or heartbeat message
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch {
      this.isConnecting = false;
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  public subscribe(callback: WebSocketCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(payload: any) {
    this.listeners.forEach((callback) => callback(payload));
  }

  public get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
