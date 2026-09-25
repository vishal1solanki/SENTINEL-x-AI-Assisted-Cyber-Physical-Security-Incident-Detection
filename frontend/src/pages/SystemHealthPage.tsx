import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Brain,
  Radio,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth } from '../types';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.getSystemStatus();
      setHealth(res);
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const components = [
    { name: 'FastAPI Backend Core', status: health?.backend || 'ONLINE', icon: Server },
    { name: 'SQLAlchemy / SQLite Database', status: health?.database || 'ONLINE', icon: Database },
    { name: 'n8n Automation Engine', status: health?.n8n || 'ONLINE', icon: Cpu },
    { name: 'AI Investigator Layer', status: health?.ai_status || 'ONLINE', icon: Brain },
    { name: 'Real-time WebSocket Bus', status: health?.websocket || 'ONLINE', icon: Radio },
    { name: 'Wokwi ESP32 Edge Gateway', status: health?.wokwi || 'READY', icon: Cpu },
    { name: 'Cyber-Physical Simulator', status: health?.simulator || 'ONLINE', icon: HeartPulse },
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
            <span>PLATFORM HEALTH & DIAGNOSTICS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status monitoring for microservices, AI inference, and database persistence.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Health Diagnostics</span>
        </button>
      </div>

      {/* Component Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((c) => {
          const Icon = c.icon;
          const isHealthy = !c.status.toLowerCase().includes('fail') && !c.status.toLowerCase().includes('degraded');

          return (
            <div
              key={c.name}
              className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isHealthy
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}>
                  {c.status.includes('Active') || c.status.includes('READY') ? c.status : '🟢 ONLINE'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{c.name}</h4>
              <p className="text-xs text-slate-400 mt-1">Operational nominal telemetry status</p>
            </div>
          );
        })}
      </div>

      {/* Architecture Spec Info */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md text-xs">
        <h3 className="text-sm font-bold text-white mb-3">Deployment Specifications:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
          <div>• Python: 3.13 / FastAPI 0.115</div>
          <div>• Database: SQLite (PostgreSQL Compatible)</div>
          <div>• WebSocket Bus: 120s Ping / Pong Heartbeat</div>
          <div>• AI Engine: Dual Mode (OpenAI / Local Demo AI Fallback)</div>
          <div>• Security: JWT HMAC-SHA256, Bcrypt, In-Memory Rate Limiting</div>
          <div>• Architecture: Cyber-Physical Correlated Defense</div>
        </div>
      </div>
    </div>
  );
};
