import React, { useEffect, useState } from 'react';
import {
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RefreshCw,
  Key,
  DoorClosed,
  Activity,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { BlindSpot } from '../types';

export const BlindSpotsPage: React.FC = () => {
  const [data, setData] = useState<{
    active_blind_spots_count: number;
    prototype_security_coverage: number;
    room_coverages: any[];
    blind_spots: BlindSpot[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBlindSpots = async () => {
    try {
      const res = await api.getBlindSpots();
      setData(res);
    } catch (err) {
      console.error('Failed to load blind spots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlindSpots();
  }, []);

  const getPillarIcon = (pillar: string) => {
    if (pillar === 'access_control') return Key;
    if (pillar === 'door_monitoring') return DoorClosed;
    if (pillar === 'motion_monitoring') return Activity;
    return Server;
  };

  const getPillarLabel = (pillar: string) => {
    if (pillar === 'access_control') return 'Access Control';
    if (pillar === 'door_monitoring') return 'Door Contact';
    if (pillar === 'motion_monitoring') return 'Motion Telemetry';
    return 'Cyber Telemetry';
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <EyeOff className="w-6 h-6 text-amber-400" />
            <span>SECURITY BLIND SPOT ANALYZER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Detects unverified telemetry gaps across Access Control, Door Monitoring, Motion & Cyber pillars.
          </p>
        </div>

        <button
          onClick={fetchBlindSpots}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 hover:text-white border border-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Global Coverage Banner */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase text-slate-500">SYSTEM METRIC</span>
          <h2 className="text-xl font-bold text-white mt-0.5">Prototype Security Coverage</h2>
          <p className="text-xs text-slate-400 mt-1">
            Weighted sensor availability across all monitored perimeter defense zones.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-cyan-400">
              {data?.prototype_security_coverage ?? 100}%
            </div>
            <span className="text-[11px] text-slate-400">Average Room Coverage</span>
          </div>

          <div className="text-center pl-6 border-l border-slate-800">
            <div className="text-4xl font-extrabold text-amber-400">
              {data?.active_blind_spots_count ?? 0}
            </div>
            <span className="text-[11px] text-slate-400">Active Blind Spots</span>
          </div>
        </div>
      </div>

      {/* Per-Room 4-Pillar Breakdown */}
      <div>
        <h3 className="text-xs uppercase text-slate-400 font-bold mb-3">
          Perimeter Zone Telemetry Pillar Coverage:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.room_coverages?.map((rc) => (
            <div
              key={rc.room_id}
              className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-white">{rc.room_name}</h4>
                  <span className="text-xs text-slate-500">{rc.room_id}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    rc.overall_coverage >= 80 ? 'text-emerald-400' :
                    rc.overall_coverage >= 60 ? 'text-cyan-400' : 'text-amber-400'
                  }`}>
                    {rc.overall_coverage}%
                  </span>
                  <div className="text-[10px] text-slate-500 uppercase">{rc.label}</div>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(rc.pillars || {}).map(([pKey, pScore]: [string, any]) => {
                  const Icon = getPillarIcon(pKey);
                  const isAvailable = pScore > 0;

                  return (
                    <div
                      key={pKey}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isAvailable
                          ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                          : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isAvailable ? 'text-cyan-400' : 'text-rose-400'}`} />
                        <span className="text-[11px] font-bold">{getPillarLabel(pKey)}</span>
                      </div>
                      <span className={`font-bold text-xs ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pScore}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Resolved Blind Spots Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <h3 className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-4">
          Recorded Blind Spot Alerts ({data?.blind_spots?.length ?? 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Detected At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.blind_spots?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No blind spots recorded. Full telemetry coverage active.
                  </td>
                </tr>
              ) : (
                data?.blind_spots?.map((bs) => (
                  <tr key={bs.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{bs.room_id}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{bs.category}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-md">{bs.description}</td>
                    <td className="py-2.5 px-3"><ThreatBadge level={bs.severity} size="sm" /></td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        bs.status === 'ACTIVE'
                          ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      }`}>
                        {bs.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {bs.detected_at ? new Date(bs.detected_at).toLocaleTimeString() : 'N/A'}
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
