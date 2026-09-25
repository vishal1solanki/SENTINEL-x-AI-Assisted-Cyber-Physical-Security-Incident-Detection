import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Clock,
  RotateCcw,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { Sensor, SensorTrustHistory } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export const SensorTrustPage: React.FC = () => {
  const { latestEvent } = useWebSocket();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [history, setHistory] = useState<SensorTrustHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchSensors = async () => {
    try {
      const data = await api.getTrustOverview();
      setSensors(data.sensors);
      if (!selectedSensor && data.sensors.length > 0) {
        handleSelectSensor(data.sensors[0]);
      }
    } catch (err) {
      console.error('Failed to load sensor trust:', err);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  useEffect(() => {
    if (latestEvent) {
      fetchSensors();
    }
  }, [latestEvent]);

  const handleSelectSensor = async (s: Sensor) => {
    setSelectedSensor(s);
    setLoadingHistory(true);
    try {
      const res = await api.getSensorTrustHistory(s.id);
      setHistory(res.history);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredSensors = sensors.filter((s) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return s.id.toLowerCase().includes(q) || s.device_id.toLowerCase().includes(q) || s.sensor_type.toLowerCase().includes(q);
  });

  const getCategoryColor = (category?: string) => {
    if (category?.includes('HIGH')) return 'text-emerald-400 border-emerald-600 bg-emerald-950/40';
    if (category?.includes('MODERATE')) return 'text-cyan-400 border-cyan-600 bg-cyan-950/40';
    if (category?.includes('LOW')) return 'text-amber-400 border-amber-600 bg-amber-950/40';
    return 'text-rose-400 border-rose-600 bg-rose-950/40';
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          <span>DYNAMIC SENSOR TRUST MATRIX</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Audited reliability scores (0-100%) tracking contradictory telemetry, desynchronizations & tampering.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sensors Directory */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sensor ID, type, device..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredSensors.map((s) => {
              const isSelected = selectedSensor?.id === s.id;
              const isCritical = s.trust_score < 40;

              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSensor(s)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                      : isCritical
                      ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500'
                      : 'border-slate-800 bg-[#111726]/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{s.id}</span>
                    <span className={`text-xs font-bold ${
                      s.trust_score >= 80 ? 'text-emerald-400' :
                      s.trust_score >= 60 ? 'text-cyan-400' :
                      s.trust_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {s.trust_score}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>Type: {s.sensor_type}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${getCategoryColor(s.trust_category)}`}>
                      {s.trust_category || 'EVALUATING'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full ${
                        s.trust_score >= 80 ? 'bg-emerald-500' :
                        s.trust_score >= 60 ? 'bg-cyan-500' :
                        s.trust_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${s.trust_score}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sensor Trust Deep-Dive */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSensor ? (
            <>
              {/* Sensor Header Card */}
              <div className="p-6 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase">SENSOR TELEMETRY DOSSIER</div>
                    <h2 className="text-xl font-bold text-white mt-0.5">{selectedSensor.id}</h2>
                    <div className="text-xs text-slate-400 mt-1">
                      Attached Device: <strong className="text-slate-200">{selectedSensor.device_id}</strong> | Type: {selectedSensor.sensor_type}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                      {selectedSensor.trust_score}%
                    </div>
                    <span className={`inline-block mt-1 text-xs font-bold uppercase px-2.5 py-0.5 rounded border ${getCategoryColor(selectedSensor.trust_category)}`}>
                      {selectedSensor.trust_category}
                    </span>
                  </div>
                </div>

                {/* Score Explanations */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400">Current Status:</div>
                    <div className="text-white font-bold mt-0.5">{selectedSensor.status}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400">Baseline Target:</div>
                    <div className="text-emerald-400 font-bold mt-0.5">100.0% (Nominal)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400">Total Audit Adjustments:</div>
                    <div className="text-cyan-400 font-bold mt-0.5">{history.length} logged entries</div>
                  </div>
                </div>
              </div>

              {/* Historical Trust Audit Trail */}
              <div className="p-6 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
                <h3 className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Transparent Trust Score Audit History ({history.length} Logs)</span>
                </h3>

                {loadingHistory ? (
                  <div className="text-slate-500 py-8 text-center text-xs">Loading audit entries...</div>
                ) : history.length === 0 ? (
                  <div className="text-slate-500 py-8 text-center text-xs">No trust deductions recorded. Sensor is at baseline.</div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((h) => {
                      const isDeduction = h.new_score < h.old_score;
                      const delta = Math.abs(h.new_score - h.old_score).toFixed(1);

                      return (
                        <div
                          key={h.id}
                          className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between text-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded mt-0.5 ${isDeduction ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {isDeduction ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-white">{h.reason}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Logged: {new Date(h.timestamp).toLocaleTimeString()} ({new Date(h.timestamp).toLocaleDateString()})
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`font-bold ${isDeduction ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isDeduction ? `-${delta}%` : `+${delta}%`}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {h.old_score}% → {h.new_score}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">Select a sensor to inspect trust details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
