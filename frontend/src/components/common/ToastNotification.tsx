import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  title: string;
  message: string;
  severity: string;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ title, message, severity, onClose }) => {
  const isCritical = severity === 'CRITICAL' || severity === 'HIGH';

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-xl border shadow-2xl backdrop-blur-xl animate-bounce-short transition-all ${
      isCritical
        ? 'bg-rose-950/90 border-rose-500 text-rose-100 cyber-glow-rose'
        : 'bg-[#111726]/95 border-cyan-500/50 text-slate-100 cyber-glow-cyan'
    }`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-black/40">
          {isCritical ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
          ) : (
            <Info className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold tracking-wide uppercase font-mono">{title}</h4>
          <p className="text-xs text-slate-300 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
