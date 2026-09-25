import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  RotateCcw,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { ResponseAction, Device } from '../types';

export const ResponseCenterPage: React.FC = () => {
  const [responses, setResponses] = useState<ResponseAction[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('PIR-A-01');
  const [selectedAction, setSelectedAction] = useState<string>('QUARANTINE');
  const [reason, setReason] = useState<string>('Adaptive fallback triggered by SOC operator');
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [rList, dList] = await Promise.all([
        api.getResponses(),
        api.getDevices(),
      ]);
      setResponses(rList);
      setDevices(dList);
    } catch (err) {
      console.error('Failed to load response center data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteResponse = async () => {
    setExecuting(true);
    try {
      await api.simulateResponse({
        device_id: selectedDevice,
        action_type: selectedAction,
        reason: reason,
      });
      setFeedback(`Response action '${selectedAction}' successfully executed on '${selectedDevice}'.`);
      await fetchData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-cyan-400" />
          <span>INCIDENT RESPONSE CENTER & ADAPTIVE FALLBACK</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulated device quarantine, secondary fallback monitoring activation, and recovery audit log.
        </p>
      </div>

      {/* Adaptive Response Pipeline Visualizer */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md">
        <h3 className="text-xs uppercase text-slate-400 font-bold mb-3">Adaptive Response Lifecycle:</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold">
            1. DETECT BREACH
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold">
            2. INVESTIGATE TRUST
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-600 text-purple-300 font-bold">
            3. DECIDE ADVISORY
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-300 font-bold animate-pulse">
            4. QUARANTINE NODE
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-300 font-bold">
            5. ACTIVATE FALLBACK
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-600 text-cyan-300 font-bold">
            6. MONITOR BLIND SPOTS
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold">
            7. RECOVER BASELINE
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Trigger New Adaptive Response Action */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <h3 className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-400" />
          <span>Simulate Adaptive Response Action</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Target Perimeter Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id} - {d.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Response Action Type:</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="QUARANTINE">SIMULATE QUARANTINE (ISOLATION)</option>
              <option value="RESTORE">RESTORE TO ONLINE BASELINE</option>
              <option value="FALLBACK_MONITORING">ENGAGE SECONDARY FALLBACK SENSORS</option>
              <option value="NOTIFY_OPERATOR">BROADCAST OPERATOR PAGING ALERT</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Action Rationale / Audit Note:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rationale for audit log..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExecuteResponse}
            disabled={executing}
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow-md shadow-cyan-950 transition disabled:opacity-50"
          >
            {executing ? 'EXECUTING ACTION...' : 'DISPATCH RESPONSE ACTION'}
          </button>
        </div>
      </div>

      {/* Response Audit Log Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <h3 className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-4">
          Response Action Audit Log ({responses.length} Records)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Target Device</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reason / Trigger Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No response actions executed yet.
                  </td>
                </tr>
              ) : (
                responses.map((ra) => (
                  <tr key={ra.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(ra.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">
                      {ra.action_type}
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">
                      {ra.device_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                        {ra.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-lg">
                      {ra.reason}
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
