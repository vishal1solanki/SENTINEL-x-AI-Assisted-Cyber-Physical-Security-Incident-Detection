import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@sentinel.local');
  const [password, setPassword] = useState('Analyst@SentinelX2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role: 'ADMIN' | 'SOC_ANALYST' | 'VIEWER') => {
    if (role === 'ADMIN') {
      setEmail('admin@sentinel.local');
      setPassword('Admin@SentinelX2026!');
    } else if (role === 'SOC_ANALYST') {
      setEmail('analyst@sentinel.local');
      setPassword('Analyst@SentinelX2026!');
    } else {
      setEmail('viewer@sentinel.local');
      setPassword('Viewer@SentinelX2026!');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-widest">
              SENTINEL<span className="text-cyan-400">-X</span>
            </h2>
            <p className="text-[11px] text-slate-400">SOC OPERATOR AUTHENTICATION</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Operator Email:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Secure Passkey:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all mt-2 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS SOC CONSOLE'}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="text-slate-500 uppercase font-bold mb-2">One-Click Demo Credentials:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setDemoAccount('ADMIN')}
              className="flex-1 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            >
              ADMIN
            </button>
            <button
              onClick={() => setDemoAccount('SOC_ANALYST')}
              className="flex-1 py-1 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 transition"
            >
              ANALYST
            </button>
            <button
              onClick={() => setDemoAccount('VIEWER')}
              className="flex-1 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            >
              VIEWER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
