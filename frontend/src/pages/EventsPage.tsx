import React, { useEffect, useState } from 'react';
import {
  List,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ArrowDownRight,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { Event } from '../types';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { useWebSocket } from '../hooks/useWebSocket';

export const EventsPage: React.FC = () => {
  const { latestEvent } = useWebSocket();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents({
        event_type: eventTypeFilter || undefined,
        severity: severityFilter || undefined,
        room_id: roomFilter || undefined,
        limit: 100,
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventTypeFilter, severityFilter, roomFilter]);

  useEffect(() => {
    if (latestEvent) {
      setEvents((prev) => [latestEvent, ...prev.slice(0, 99)]);
    }
  }, [latestEvent]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.event_type.toLowerCase().includes(q) ||
      ev.source_device_id.toLowerCase().includes(q) ||
      (ev.sensor_id && ev.sensor_id.toLowerCase().includes(q)) ||
      (ev.correlation_id && ev.correlation_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <List className="w-6 h-6 text-cyan-400" />
            <span>TELEMETRY & EVENT LOG</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable physical access, sensor anomaly, and cyber telemetry audit records.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event type, device, correlation ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Event Types</option>
          <option value="RFID_AUTHORIZED">RFID_AUTHORIZED</option>
          <option value="RFID_UNAUTHORIZED">RFID_UNAUTHORIZED</option>
          <option value="DOOR_OPEN">DOOR_OPEN</option>
          <option value="DOOR_CLOSED">DOOR_CLOSED</option>
          <option value="MOTION_DETECTED">MOTION_DETECTED</option>
          <option value="MOTION_CLEARED">MOTION_CLEARED</option>
          <option value="SUSPICIOUS_LOGIN">SUSPICIOUS_LOGIN</option>
          <option value="SENSOR_INCONSISTENCY">SENSOR_INCONSISTENCY</option>
          <option value="TELEMETRY_ANOMALY">TELEMETRY_ANOMALY</option>
          <option value="DEVICE_QUARANTINED">DEVICE_QUARANTINED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
          <option value="INFO">INFO</option>
        </select>

        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Rooms</option>
          <option value="ROOM-SERVER-A">Server Room A</option>
          <option value="ROOM-SEC-LAB">Security Lab</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Device / Sensor</th>
                <th className="py-2.5 px-3">Perimeter Room</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Trust Impact</th>
                <th className="py-2.5 px-3">Correlation ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                      {ev.event_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{ev.source_device_id}</div>
                      {ev.sensor_id && <div className="text-[10px] text-slate-500">{ev.sensor_id}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {ev.room_id || 'Global'}
                    </td>
                    <td className="py-2.5 px-3">
                      <ThreatBadge level={ev.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        ev.status === 'CORRELATED' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        ev.status === 'QUARANTINED' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                      {ev.trust_impact > 0 ? (
                        <span className="text-rose-400">-{ev.trust_impact}%</span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                      {ev.correlation_id ? (
                        <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                          {ev.correlation_id}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
