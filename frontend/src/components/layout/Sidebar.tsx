import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  FastForward,
  Crosshair,
  ShieldCheck,
  EyeOff,
  Cpu,
  List,
  ShieldAlert,
  FileText,
  HeartPulse,
  Home,
  Skull
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/attacker', label: '🔴 Attacker Portal', icon: Skull },
  { to: '/live', label: 'Live Monitoring', icon: Radio },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/replay', label: 'Attack Replay', icon: FastForward },
  { to: '/simulator', label: 'Attack Simulator', icon: Crosshair },
  { to: '/trust', label: 'Sensor Trust', icon: ShieldCheck },
  { to: '/blind-spots', label: 'Blind Spots', icon: EyeOff },
  { to: '/devices', label: 'Devices & Sensors', icon: Cpu },
  { to: '/events', label: 'Event Log', icon: List },
  { to: '/responses', label: 'Response Center', icon: ShieldAlert },
  { to: '/health', label: 'System Health', icon: HeartPulse },
  { to: '/', label: 'Landing Page', icon: Home },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 border-r border-slate-800 bg-[#0c121e]/95 backdrop-blur-md flex flex-col justify-between py-4 shrink-0">
      <div className="px-3">
        <div className="px-3 mb-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
          SOC NAVIGATION
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>STATUS:</span>
          <span className="text-emerald-400 font-bold">OPERATIONAL</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">v1.0.0 (Enterprise SOC Edition)</div>
      </div>
    </aside>
  );
};
