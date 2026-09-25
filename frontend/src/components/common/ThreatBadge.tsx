import React from 'react';

interface ThreatBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({ level, size = 'md' }) => {
  const normalized = (level || 'INFO').toUpperCase();

  const colors: Record<string, string> = {
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/50',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-950/50',
    MEDIUM: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-cyan-950/50',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/50',
    INFO: 'bg-slate-500/20 text-slate-400 border-slate-500/40 shadow-slate-950/50',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm tracking-wider uppercase font-mono ${
        colors[normalized] || colors.INFO
      } ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        normalized === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
        normalized === 'HIGH' ? 'bg-amber-500' :
        normalized === 'MEDIUM' ? 'bg-cyan-500' :
        normalized === 'LOW' ? 'bg-emerald-500' : 'bg-slate-500'
      }`} />
      {normalized}
    </span>
  );
};
