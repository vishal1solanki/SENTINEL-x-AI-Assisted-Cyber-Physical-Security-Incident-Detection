import React, { useState } from 'react';
import { Event } from '../../types';
import { ThreatBadge } from '../common/ThreatBadge';
import { ArrowRight, ShieldAlert, Key, DoorClosed, Activity, Terminal, AlertTriangle } from 'lucide-react';

interface IncidentGraphProps {
  events: Event[];
  incidentTitle: string;
}

export const IncidentGraph: React.FC<IncidentGraphProps> = ({ events, incidentTitle }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(events[0] || null);

  const getNodeIcon = (type: string) => {
    if (type.includes('RFID')) return Key;
    if (type.includes('DOOR')) return DoorClosed;
    if (type.includes('MOTION') || type.includes('PIR')) return Activity;
    if (type.includes('LOGIN') || type.includes('AUTH')) return Terminal;
    return AlertTriangle;
  };

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">Interactive Telemetry Attack Graph</h4>
          <p className="text-[11px] text-slate-500">Click any sequence node to inspect evidence, timestamp, and trust delta.</p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800">
          {events.length} CORRELATED NODES
        </span>
      </div>

      {/* Nodes Flow */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 px-2 no-scrollbar">
        {events.map((ev, idx) => {
          const Icon = getNodeIcon(ev.event_type);
          const isSelected = selectedEvent?.id === ev.id;
          const isCritical = ev.severity === 'CRITICAL' || ev.severity === 'HIGH';

          return (
            <React.Fragment key={ev.id}>
              <button
                onClick={() => setSelectedEvent(ev)}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all shrink-0 w-36 text-center ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950 scale-105'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg mb-2 ${
                  isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold font-mono text-slate-200 truncate w-full">
                  {ev.event_type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {ev.source_device_id}
                </span>
                <div className="mt-2">
                  <ThreatBadge level={ev.severity} size="sm" />
                </div>
              </button>

              {idx < events.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}

        {/* Final Incident Node */}
        {events.length > 0 && (
          <>
            <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
            <div className="flex flex-col items-center p-3 rounded-xl border border-rose-500/60 bg-rose-950/30 text-center shrink-0 w-40 shadow-lg shadow-rose-950/40">
              <div className="p-2 rounded-lg bg-rose-500/30 text-rose-300 mb-2">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold font-mono text-rose-200 leading-tight">
                SECURITY INCIDENT
              </span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                {incidentTitle}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Selected Node Details Preview */}
      {selectedEvent && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">SELECTED NODE:</span>
            <span className="text-cyan-400 font-bold">{selectedEvent.event_type}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Device: {selectedEvent.source_device_id}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trust Impact:</span>
            <span className={selectedEvent.trust_impact > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {selectedEvent.trust_impact > 0 ? `-${selectedEvent.trust_impact}%` : '0%'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
