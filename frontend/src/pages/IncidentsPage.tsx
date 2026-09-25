import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Brain,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { useWebSocket } from '../hooks/useWebSocket';

export const IncidentsPage: React.FC = () => {
  const { latestIncident } = useWebSocket();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    if (latestIncident) {
      fetchIncidents();
    }
  }, [latestIncident]);

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.room_id.toLowerCase().includes(q) ||
      inc.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
            <span>INCIDENT COMMAND DASHBOARD</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              {filteredIncidents.length} INCIDENTS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Correlated cyber-physical threat incidents with sensor trust assessments & AI investigations.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, title, room, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs font-mono rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="NEW">NEW</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="CONTAINED">CONTAINED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs font-mono rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center border border-slate-800 rounded-xl bg-[#111726]/60">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-mono text-slate-400">No matching security incidents found</div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Click 'RUN FULL SCENARIO' in the top bar to generate a live incident.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <Link
              key={inc.id}
              to={`/incidents/${inc.id}`}
              className="block p-5 rounded-xl border border-slate-800 bg-[#111726]/90 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {inc.id}
                  </span>
                  <ThreatBadge level={inc.severity} size="sm" />
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    inc.status === 'NEW' ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse' :
                    inc.status === 'INVESTIGATING' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                    inc.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {inc.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(inc.started_at).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-300 font-bold">{inc.room_id}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div>
                  <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition">
                    {inc.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.summary}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-4" />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Evidence: <strong className="text-slate-200">{inc.evidence_count} events</strong></span>
                  <span>Confidence: <strong className="text-cyan-400">{(inc.confidence * 100).toFixed(0)}%</strong></span>
                  {inc.trust_impact > 0 && (
                    <span>Sensor Trust Delta: <strong className="text-rose-400">-{inc.trust_impact}%</strong></span>
                  )}
                </div>

                {inc.ai_analysis ? (
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-mono bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Investigation Ready</span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-xs">Pending AI Deep Analysis</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
