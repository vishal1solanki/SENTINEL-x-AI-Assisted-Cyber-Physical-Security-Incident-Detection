import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'default';
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-[#111726]/80 text-slate-300',
    cyan: 'border-cyan-500/30 bg-[#111726]/90 text-cyan-400 hover:border-cyan-500/60',
    emerald: 'border-emerald-500/30 bg-[#111726]/90 text-emerald-400 hover:border-emerald-500/60',
    amber: 'border-amber-500/30 bg-[#111726]/90 text-amber-400 hover:border-amber-500/60',
    rose: 'border-rose-500/30 bg-[#111726]/90 text-rose-400 hover:border-rose-500/60',
    purple: 'border-purple-500/30 bg-[#111726]/90 text-purple-400 hover:border-purple-500/60',
  };

  const iconBg = {
    default: 'bg-slate-800 text-slate-400',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  };

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg ${iconBg[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-white tracking-tight">{value}</span>
        {trend && <span className="text-xs font-mono text-cyan-400">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
