import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, RotateCcw, User, LogOut, CheckCircle2, AlertCircle, Send, Skull } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { wsClient } from '../../services/websocket';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const { user, switchDemoRole, logout } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleTestTelegram = async () => {
    setLoadingAction('telegram');
    setActionFeedback(null);
    try {
      const res = await api.testTelegram();
      setActionFeedback(res.message || 'Telegram test alert dispatched to @VIsahhal_bot!');
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      alert(`Telegram test failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };



  const handleResetDemo = async () => {
    setLoadingAction('reset');
    setActionFeedback(null);
    try {
      await api.resetDemo();
      setActionFeedback('Baseline restored: 100% sensor trust, all devices online.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Failed to reset baseline: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-lg text-white tracking-widest">
                SENTINEL<span className="text-cyan-400">-X</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                ENTERPRISE SOC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
              CYBER-PHYSICAL SECURITY & SENSOR TRUST
            </p>
          </div>
        </div>

        {/* Live WebSocket Status */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">LIVE TELEMETRY STREAM</span>
        </div>
      </div>

      {/* Center Feedback Banner */}
      {actionFeedback && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500 text-xs text-cyan-300 font-mono animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Action Controls & Role Switcher */}
      <div className="flex items-center gap-3">


        <button
          onClick={handleResetDemo}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono border border-slate-700 transition disabled:opacity-50"
          title="Reset sensor trust to 100%, restore devices, clear demo incidents"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">RESET DEMO</span>
        </button>

        {/* Telegram Live Test Button */}
        <button
          onClick={handleTestTelegram}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-400 text-xs font-bold font-mono border border-sky-600/80 transition disabled:opacity-50"
          title="Test live Telegram alert dispatch to @VIsahhal_bot on your phone"
        >
          <Send className={`w-3.5 h-3.5 ${loadingAction === 'telegram' ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">{loadingAction === 'telegram' ? 'SENDING...' : 'TEST TELEGRAM'}</span>
        </button>

        {/* Dedicated Red Team Attacker Portal */}
        <Link
          to="/attacker"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-800 to-red-700 hover:from-rose-700 hover:to-red-600 text-rose-100 text-xs font-bold font-mono border border-rose-500/50 shadow-md shadow-rose-950 transition hover:scale-105"
          title="Switch to dedicated Red Team Attacker C2 Console"
        >
          <Skull className="w-3.5 h-3.5 text-rose-300" />
          <span className="hidden sm:inline">ATTACKER PORTAL</span>
        </Link>

        {/* User Role Switcher */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user?.name || 'SOC Operator'}</div>
            <div className="text-[10px] font-mono text-cyan-400">{user?.role || 'SOC_ANALYST'}</div>
          </div>

          <select
            value={user?.role || 'SOC_ANALYST'}
            onChange={(e) => switchDemoRole(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs font-mono rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            title="Switch demo user role"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="SOC_ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>
    </header>
  );
};
