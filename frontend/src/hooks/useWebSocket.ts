import { useEffect, useState } from 'react';
import { wsClient } from '../services/websocket';
import { Event, Incident } from '../types';

export function useWebSocket() {
  const [latestEvent, setLatestEvent] = useState<Event | null>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; severity: string } | null>(null);

  useEffect(() => {
    wsClient.connect();

    const unsubscribe = wsClient.subscribe((payload) => {
      if (payload.type === 'NEW_EVENT') {
        const ev = payload.data as Event;
        setLatestEvent(ev);
        if (ev.severity === 'HIGH' || ev.severity === 'CRITICAL') {
          setToastMessage({
            title: `CRITICAL ALERT: ${ev.event_type}`,
            message: `Detected at ${ev.source_device_id} in ${ev.room_id || 'Perimeter'}`,
            severity: ev.severity,
          });
        }
      } else if (payload.type === 'INCIDENT_UPDATED' || payload.type === 'INCIDENT_ACKNOWLEDGED' || payload.type === 'INCIDENT_RESOLVED') {
        setLatestIncident(payload.data as Incident);
      } else if (payload.type === 'DEVICE_QUARANTINED') {
        setToastMessage({
          title: `DEVICE QUARANTINED: ${payload.data.device_id}`,
          message: payload.data.reason,
          severity: 'HIGH',
        });
      } else if (payload.type === 'DEVICE_RESTORED') {
        setToastMessage({
          title: `DEVICE RESTORED: ${payload.data.device_id}`,
          message: 'Device returned to normal operating status.',
          severity: 'INFO',
        });
      } else if (payload.type === 'DEMO_RESET') {
        setToastMessage({
          title: 'DEMO BASELINE RESTORED',
          message: 'Sensor trust reset to 100% and devices restored.',
          severity: 'INFO',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearToast = () => setToastMessage(null);

  return { latestEvent, latestIncident, toastMessage, clearToast };
}
