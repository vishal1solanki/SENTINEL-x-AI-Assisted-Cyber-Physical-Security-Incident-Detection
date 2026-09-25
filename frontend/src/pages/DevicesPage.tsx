import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Search,
  Key,
  DoorClosed,
  Activity,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { Device } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export const DevicesPage: React.FC = () => {
  const { latestEvent } = useWebSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (latestEvent) {
      fetchDevices();
    }
  }, [latestEvent]);

  const handleQuarantine = async (deviceId: string) => {
    setActionLoading(`q-${deviceId}`);
    try {
      await api.quarantineDevice(deviceId, 'Manual operator quarantine from Device Inventory');
      setFeedback(`Device '${deviceId}' quarantined successfully.`);
      await fetchDevices();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (deviceId: string) => {
    setActionLoading(`r-${deviceId}`);
    try {
      await api.restoreDevice(deviceId, 'Manual operator restoration from Device Inventory');
      setFeedback(`Device '${deviceId}' restored to ONLINE.`);
      await fetchDevices();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type.includes('RFID')) return Key;
    if (type.includes('DOOR')) return DoorClosed;
    if (type.includes('PIR')) return Activity;
    return Server;
  };

  const filteredDevices = devices.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.room_id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>PERIMETER DEVICE INVENTORY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hardware telemetry controllers, firmware integrity & simulated quarantine isolation.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search device name, ID, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map((dev) => {
          const Icon = getDeviceIcon(dev.device_type);
          const isQuarantined = dev.status === 'QUARANTINED';
          const isLowTrust = dev.trust_score < 60;

          return (
            <div
              key={dev.id}
              className={`p-5 rounded-xl border backdrop-blur-md transition-all ${
                isQuarantined
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                  : isLowTrust
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

                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  isQuarantined
                    ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                    : isLowTrust
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  {dev.status}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-white">{dev.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">ID: {dev.id}</div>
                <div className="text-xs text-slate-500 mt-0.5">Zone: {dev.room_id}</div>
              </div>

              {/* Trust Score Gauge */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Node Trust Score:</span>
                  <span className={`font-bold ${
                    dev.trust_score >= 80 ? 'text-emerald-400' :
                    dev.trust_score >= 60 ? 'text-cyan-400' :
                    dev.trust_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {dev.trust_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      dev.trust_score >= 80 ? 'bg-emerald-500' :
                      dev.trust_score >= 60 ? 'bg-cyan-500' :
                      dev.trust_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${dev.trust_score}%` }}
                  />
                </div>
              </div>

              {/* Attached Sensors List */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <div className="text-[11px] text-slate-400 uppercase font-bold mb-1.5">Attached Sensors:</div>
                <div className="space-y-1">
                  {dev.sensors.map((s) => (
                    <div key={s.id} className="flex justify-between text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                      <span className="text-slate-300">{s.id}</span>
                      <span className={s.trust_score < 60 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {s.trust_score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isQuarantined ? (
                  <button
                    onClick={() => handleRestore(dev.id)}
                    disabled={actionLoading !== null}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition disabled:opacity-50"
                  >
                    {actionLoading === `r-${dev.id}` ? 'RESTORING...' : 'RESTORE DEVICE'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuarantine(dev.id)}
                    disabled={actionLoading !== null}
                    className="w-full py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 font-bold text-xs transition disabled:opacity-50"
                  >
                    {actionLoading === `q-${dev.id}` ? 'QUARANTINING...' : 'SIMULATE QUARANTINE'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
