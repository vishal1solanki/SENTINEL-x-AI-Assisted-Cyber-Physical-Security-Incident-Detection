import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Brain,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RotateCcw,
  FileText,
  Sparkles,
  AlertOctagon,
  EyeOff,
  Cpu,
  FastForward,
  Check,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentDetail } from '../types';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { IncidentGraph } from '../components/incidents/IncidentGraph';

export const InvestigationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchIncident = async () => {
    if (!id) return;
    try {
      const data = await api.getIncident(id);
      setIncident(data);
    } catch (err: any) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleAcknowledge = async () => {
    if (!id) return;
    setActionLoading('ack');
    try {
      await api.acknowledgeIncident(id);
      setFeedback('Incident marked as ACKNOWLEDGED.');
      await fetchIncident();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvestigate = async () => {
    if (!id) return;
    setActionLoading('investigate');
    try {
      const aiResult = await api.investigateIncident(id);
      setFeedback(`AI Investigation complete (${aiResult.investigator_engine || 'AI Engine'}).`);
      await fetchIncident();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    setActionLoading('resolve');
    try {
      await api.resolveIncident(id);
      setFeedback('Incident resolved successfully.');
      await fetchIncident();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuarantine = async (deviceId: string) => {
    setActionLoading(`quarantine-${deviceId}`);
    try {
      await api.quarantineDevice(deviceId, 'Operator simulated quarantine during incident investigation', id);
      setFeedback(`Device '${deviceId}' quarantined.`);
      await fetchIncident();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (deviceId: string) => {
    setActionLoading(`restore-${deviceId}`);
    try {
      await api.restoreDevice(deviceId, 'Operator restored device to baseline following investigation', id);
      setFeedback(`Device '${deviceId}' restored to ONLINE.`);
      await fetchIncident();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-slate-400">
        Loading Incident Investigation File...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center font-mono text-slate-400">
        Incident not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-slate-500">INCIDENT DOSSIER /</span>
              <span className="text-xs font-bold text-cyan-400">{incident.id}</span>
              <ThreatBadge level={incident.severity} size="sm" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {incident.status}
              </span>
            </div>
            <h1 className="text-xl font-bold font-mono text-white mt-0.5">{incident.title}</h1>
          </div>
        </div>

        {/* Investigation Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {incident.status === 'NEW' && (
            <button
              onClick={handleAcknowledge}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ACKNOWLEDGE</span>
            </button>
          )}

          <button
            onClick={handleInvestigate}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-950 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{actionLoading === 'investigate' ? 'INVESTIGATING...' : 'AI INVESTIGATE'}</span>
          </button>

          <Link
            to={`/replay?incident=${incident.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>REPLAY ATTACK</span>
          </Link>

          <Link
            to={`/reports/${incident.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>REPORT</span>
          </Link>

          {incident.status !== 'RESOLVED' && (
            <button
              onClick={handleResolve}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESOLVE</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500 text-xs font-mono text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Incident Graph Component */}
      <IncidentGraph events={incident.events} incidentTitle={incident.title} />

      {/* 2-Column Grid: Left (AI Advisory & Evidence) | Right (Affected Sensors & Blind Spots) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Investigator Block */}
          <div className="p-5 rounded-xl border border-purple-500/40 bg-[#111726]/95 shadow-xl shadow-purple-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    AI INVESTIGATOR ADVISORY
                  </h3>
                  <span className="text-[10px] text-purple-300">
                    Engine: {incident.ai_analysis?.investigator_engine || 'AI Security Model'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-purple-400 font-bold bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800">
                CONFIDENCE: {(incident.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {incident.ai_analysis ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase">Executive Summary:</span>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
                    {incident.ai_analysis.summary}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase">Corroborating Evidence:</span>
                  <ul className="mt-1 space-y-1 pl-4 list-disc text-slate-300">
                    {incident.ai_analysis.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-rose-400 font-bold uppercase">Sensor Trust & Integrity Concerns:</span>
                  <ul className="mt-1 space-y-1 pl-4 list-disc text-rose-300/90">
                    {incident.ai_analysis.sensor_concerns.map((sc, i) => (
                      <li key={i}>{sc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-amber-400 font-bold uppercase">Possible Explanations:</span>
                  <ul className="mt-1 space-y-1 pl-4 list-disc text-slate-300">
                    {incident.ai_analysis.possible_explanations.map((pe, i) => (
                      <li key={i}>{pe}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-cyan-400 font-bold uppercase">Recommended Advisory Responses:</span>
                  <ul className="mt-1 space-y-1 pl-4 list-disc text-cyan-200">
                    {incident.ai_analysis.recommended_actions.map((ra, i) => (
                      <li key={i}>{ra}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>Detailed AI telemetry analysis has not been executed yet.</p>
                <button
                  onClick={handleInvestigate}
                  className="mt-3 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                >
                  RUN AI INVESTIGATOR NOW
                </button>
              </div>
            )}
          </div>

          {/* Chronological Event Timeline */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Correlated Event Timeline ({incident.events.length} records)</span>
            </h3>

            <div className="space-y-3">
              {incident.events.map((ev, i) => (
                <div key={ev.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{ev.event_type}</span>
                      <ThreatBadge level={ev.severity} size="sm" />
                      <span className="text-slate-500">[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Device: <strong className="text-slate-200">{ev.source_device_id}</strong> | Sensor: {ev.sensor_id || 'N/A'}
                    </div>
                  </div>
                  {ev.trust_impact > 0 && (
                    <span className="text-rose-400 font-bold">-{ev.trust_impact}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - Affected Sensors, Quarantine, Blind Spots */}
        <div className="space-y-6">
          {/* Affected Perimeter Sensors */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Perimeter Sensors & Trust</span>
            </h3>

            <div className="space-y-3">
              {incident.affected_sensors.map((s) => (
                <div key={s.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{s.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      s.status === 'QUARANTINED' ? 'bg-rose-950 text-rose-300' :
                      s.trust_score < 50 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                    <span>Trust Score:</span>
                    <span className={s.trust_score < 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {s.trust_score}%
                    </span>
                  </div>

                  {/* Quarantine / Restore Action for this Device */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex gap-2">
                    {s.status === 'QUARANTINED' ? (
                      <button
                        onClick={() => handleRestore(s.device_id)}
                        disabled={actionLoading !== null}
                        className="w-full py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] font-bold transition"
                      >
                        RESTORE DEVICE
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuarantine(s.device_id)}
                        disabled={actionLoading !== null}
                        className="w-full py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[11px] font-bold transition"
                      >
                        SIMULATE QUARANTINE
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Blind Spots */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider mb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Perimeter Blind Spots</span>
            </h3>

            {incident.blind_spots.length > 0 ? (
              <div className="space-y-2.5">
                {incident.blind_spots.map((bs) => (
                  <div key={bs.id} className="p-3 rounded-lg bg-amber-950/20 border border-amber-600/40 text-xs">
                    <div className="font-bold text-amber-300">{bs.category}</div>
                    <p className="text-[11px] text-slate-400 mt-1">{bs.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono">
                No active blind spots currently detected in {incident.room_id}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
