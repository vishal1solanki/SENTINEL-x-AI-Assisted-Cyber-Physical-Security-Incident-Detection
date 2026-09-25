import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Radio,
  Cpu,
  EyeOff,
  Crosshair,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Shield className="w-7 h-7 text-black" />
          </div>
          <span className="font-mono font-extrabold text-xl tracking-widest text-white">
            SENTINEL<span className="text-cyan-400">-X</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm font-mono shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <span>LAUNCH SOC CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-16 flex-1 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-8 cyber-glow-cyan">
          <Zap className="w-3.5 h-3.5" />
          <span>AI-ASSISTED CYBER-PHYSICAL SECURITY PLATFORM</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight">
          "Don't just detect the attack. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Detect when the security system itself is untrustworthy.
          </span>"
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
          Most perimeter systems assume sensors never lie. SENTINEL-X dynamically correlates physical RFID, door contacts, and PIR motion telemetry with cyber anomalies while auditing <strong className="text-white">Sensor Trust Scores</strong> to detect tampering, inconsistencies, and blind spots.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center font-mono">
          <Link
            to="/dashboard"
            className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            OPEN SOC DASHBOARD
          </Link>
          <Link
            to="/replay"
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm tracking-wide transition-all"
          >
            ATTACK REPLAY DEMO
          </Link>
          <Link
            to="/simulator"
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm tracking-wide transition-all"
          >
            ATTACK SIMULATOR
          </Link>
        </div>

        {/* 6 Key Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Cyber-Physical Correlation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Correlates unauthorized physical badge presentation and door latch breaches with local server login anomalies within seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Sensor Trust Engine (0-100)</h3>
            <p className="mt-2 text-sm text-slate-400">
              Penalizes sensors reporting contradictory telemetry, frequency anomalies, or missing heartbeats with transparent audit logging.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Blind-Spot Coverage Engine</h3>
            <p className="mt-2 text-sm text-slate-400">
              Continuously computes Prototype Security Coverage across Access Control, Door Monitoring, Motion, and Cyber Telemetry.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">AI & Offline Demo Investigator</h3>
            <p className="mt-2 text-sm text-slate-400">
              Explains evidence, synthesizes contradictions, and provides advisory response recommendations with 100% offline fallback.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Simulated Device Quarantine</h3>
            <p className="mt-2 text-sm text-slate-400">
              Isolates suspect edge sensors in the software model, activating secondary fallback sensors and preventing spoofed lateral signals.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-4">
              <Crosshair className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Wokwi ESP32 & n8n Pipeline</h3>
            <p className="mt-2 text-sm text-slate-400">
              Hardware simulation running on ESP32 paired with importable n8n webhook orchestration workflows.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-8 text-center text-xs font-mono text-slate-500 max-w-7xl mx-auto w-full flex flex-wrap justify-between items-center">
        <span>SENTINEL-X Defense System © 2026</span>
        <span>Prototype Cybersecurity & Cyber-Physical Telemetry Platform</span>
      </footer>
    </div>
  );
};
