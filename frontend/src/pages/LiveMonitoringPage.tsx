import React, { useEffect, useState } from 'react';
import {
  Radio,
  Key,
  DoorClosed,
  Activity,
  Server,
  Lock,
  RefreshCw,
  Send,
  Box,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Room, Device, Event } from '../types';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { useWebSocket } from '../hooks/useWebSocket';
import { ServerRoom3D } from '../components/visualization/ServerRoom3D';

export const LiveMonitoringPage: React.FC = () => {
  const { latestEvent } = useWebSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ROOM-SERVER-A');
  const [triggering, setTriggering] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const fetchData = async () => {
    try {
      const [rList, dList, eList] = await Promise.all([
        api.getRooms(),
        api.getDevices(),
        api.getEvents({ limit: 25 })
      ]);
      setRooms(rList);
      setDevices(dList);
      setLiveEvents(eList);
    } catch (err) {
      console.error('Failed to load live monitoring:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (latestEvent) {
      setLiveEvents((prev) => [latestEvent, ...prev.slice(0, 24)]);
      // Update device trust / status if event relates
      fetchData();
    }
  }, [latestEvent]);

  const triggerLiveEvent = async (eventType: string, sourceDeviceId: string, severity = 'INFO') => {
    setTriggering(eventType);
    try {
      await api.createEvent({
        event_type: eventType,
        source_device_id: sourceDeviceId,
        room_id: selectedRoom,
        severity: severity as any,
        metadata: { manual_trigger: true, simulated: true }
      });
    } catch (err: any) {
      alert(`Event failed: ${err.message}`);
    } finally {
      setTriggering(null);
    }
  };

  const roomDevices = devices.filter((d) => d.room_id === selectedRoom);

  const getDeviceIcon = (type: string) => {
    if (type.includes('RFID')) return Key;
    if (type.includes('DOOR')) return DoorClosed;
    if (type.includes('PIR')) return Activity;
    return Server;
  };

  const getActivePhase = (): number => {
    if (!latestEvent) return 0;
    const type = latestEvent.event_type;
    if (type === 'IRIS_MISMATCH' || type === 'ACCESS_DENIED_MISMATCH') return 3;
    if (type === 'CLONED_RFID' || type === 'ACCESS_DENIED_CLONED') return 2;
    if (type === 'ACCESS_GRANTED' || type === 'IRIS_VERIFIED' || type === 'RFID_VERIFIED') return 1;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
            <span>PERIMETER LIVE MONITORING</span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STREAM ACTIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Visual edge telemetry status, device trust health, and interactive signal injection.
          </p>
        </div>

        {/* Room Switcher Tabs & View Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === '3d'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D TWIN</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === '2d'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>CARDS</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition ${
                  selectedRoom === r.id
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Digital Twin View */}
      {viewMode === '3d' && (
        <div className="w-full">
          <ServerRoom3D activePhase={getActivePhase()} lastEvent={latestEvent} isAttackerView={false} />
        </div>
      )}

      {/* Perimeter Zone Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roomDevices.map((dev) => {
          const Icon = getDeviceIcon(dev.device_type);
          const isQuarantined = dev.status === 'QUARANTINED';
          const isAnomaly = dev.status === 'ANOMALY' || dev.trust_score < 50;

          return (
            <div
              key={dev.id}
              className={`p-5 rounded-xl border backdrop-blur-md transition-all ${
                isQuarantined
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                  : isAnomaly
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-slate-800 bg-[#111726]/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${
                  isQuarantined ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                  isQuarantined
                    ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                    : isAnomaly
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  {dev.status}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-bold text-white font-mono">{dev.name}</h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {dev.id}</div>
              </div>

              {/* Trust Score Gauge Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Trust Score:</span>
                  <span className={`font-bold ${
                    dev.trust_score >= 80 ? 'text-emerald-400' :
                    dev.trust_score >= 60 ? 'text-cyan-400' :
                    dev.trust_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {dev.trust_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      dev.trust_score >= 80 ? 'bg-emerald-500' :
                      dev.trust_score >= 60 ? 'bg-cyan-500' :
                      dev.trust_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${dev.trust_score}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Firmware: {dev.firmware_version}</span>
                <span>{dev.sensors.length} Sensor(s)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Sensor Signal Injection Console */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider">
            Simulated Sensor Signal Injection (Edge Node Simulator)
          </h3>
        </div>
        <p className="text-xs text-slate-400 font-mono mb-4">
          Emit test telemetry signals to observe correlation and consistency engine responses in real-time.
        </p>

        <div className="flex flex-wrap gap-2.5 font-mono text-xs">
          <button
            onClick={() => triggerLiveEvent('RFID_AUTHORIZED', 'RFID-GATE-01', 'INFO')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-600 hover:bg-emerald-900 text-emerald-300 font-bold transition"
          >
            [Simulate] RFID Authorized
          </button>
          <button
            onClick={() => triggerLiveEvent('RFID_UNAUTHORIZED', 'RFID-GATE-01', 'LOW')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-rose-950/80 border border-rose-600 hover:bg-rose-900 text-rose-300 font-bold transition"
          >
            [Simulate] RFID Unauthorized
          </button>
          <button
            onClick={() => triggerLiveEvent('DOOR_OPEN', 'DOOR-A-01', 'MEDIUM')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-cyan-950/80 border border-cyan-600 hover:bg-cyan-900 text-cyan-300 font-bold transition"
          >
            [Simulate] Door Open
          </button>
          <button
            onClick={() => triggerLiveEvent('DOOR_CLOSED', 'DOOR-A-01', 'INFO')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold transition"
          >
            [Simulate] Door Closed
          </button>
          <button
            onClick={() => triggerLiveEvent('MOTION_DETECTED', 'PIR-A-01', 'HIGH')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-amber-950/80 border border-amber-600 hover:bg-amber-900 text-amber-300 font-bold transition"
          >
            [Simulate] Motion Detected (PIR)
          </button>
          <button
            onClick={() => triggerLiveEvent('TELEMETRY_ANOMALY', 'PIR-A-01', 'HIGH')}
            disabled={triggering !== null}
            className="px-3.5 py-2 rounded-lg bg-purple-950/80 border border-purple-600 hover:bg-purple-900 text-purple-300 font-bold transition"
          >
            [Simulate] Telemetry Anomaly
          </button>
        </div>
      </div>

      {/* Real-time Event Feed */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider">
              Real-time Ingest Stream ({selectedRoom})
            </h3>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Trust Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveEvents.filter((e) => !e.room_id || e.room_id === selectedRoom).map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{ev.event_type}</td>
                  <td className="py-2.5 px-3 text-slate-300">{ev.source_device_id}</td>
                  <td className="py-2.5 px-3"><ThreatBadge level={ev.severity} size="sm" /></td>
                  <td className="py-2.5 px-3 text-right">
                    {ev.trust_impact > 0 ? (
                      <span className="text-rose-400 font-bold">-{ev.trust_impact}%</span>
                    ) : (
                      <span className="text-slate-500">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
