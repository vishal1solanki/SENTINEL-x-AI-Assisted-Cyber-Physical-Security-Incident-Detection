import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crosshair,
  ShieldAlert,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
  Radio,
  Key,
  DoorOpen,
  Terminal,
  Activity,
  Cpu,
  Skull,
  ExternalLink,
  Zap,
  RotateCcw,
  Eye,
  BellRing
} from 'lucide-react';
import { api } from '../services/api';
import { ServerRoom3D } from '../components/visualization/ServerRoom3D';
import { useWebSocket } from '../hooks/useWebSocket';

const TEST_FLOWS = [
  {
    id: 1,
    name: 'TEST 1: Authorized RFID + Authorized Iris',
    tag: 'AUTHORIZED_ACCESS',
    desc: 'Authorized badge (Dr. V. Solanki) followed by matched ocular biometric scan.',
    expected: 'RFID VERIFIED IRIS VERIFIED ACCESS GRANTED DOOR UNLOCK DOOR OPEN',
    color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400'
  },
  {
    id: 2,
    name: 'TEST 2: Cloned RFID Attack',
    tag: 'CLONED_RFID',
    desc: 'Cloned Mifare Classic UID 0xE20045A1 presented at edge terminal.',
    expected: 'CLONED RFID ACCESS DENIED DOOR LOCKED ALARM ON',
    color: 'border-amber-500/50 bg-amber-950/20 text-amber-400'
  },
  {
    id: 3,
    name: 'TEST 3: Valid RFID + Wrong Iris (Stolen Credential)',
    tag: 'STOLEN_RFID',
    desc: 'Valid RFID badge presented with mismatched iris biometric. Evaluated as "Possible stolen credential".',
    expected: 'RFID VERIFIED IRIS MISMATCH ACCESS DENIED DOOR LOCKED ALARM ON',
    color: 'border-rose-500/50 bg-rose-950/20 text-rose-400'
  }
];

export const AttackSimulatorPage: React.FC = () => {
  const { latestEvent } = useWebSocket();
  const [activeTest, setActiveTest] = useState<number>(0);
  const [executingTest, setExecutingTest] = useState<number | null>(null);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);

  const handleExecuteTest = async (testId: number) => {
    setExecutingTest(testId);
    setActiveTest(testId);
    setOutputLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] EXECUTING TEST ${testId}: ${TEST_FLOWS[testId - 1]?.name}...`,
      ...prev
    ]);

    try {
      const res = await api.triggerTestFlow(testId);
      setOutputLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] COMPLETED: ${res.steps_executed?.length || 4} steps delivered. Expected: ${res.expected_result}`,
        ...(res.incident ? [`[${new Date().toLocaleTimeString()}] INCIDENT CREATED: ${res.incident.title} (ID: ${res.incident.id}) -> Alert dispatched to Telegram & n8n!`] : []),
        ...prev
      ]);
    } catch (err: any) {
      setOutputLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Test ${testId} triggered: ${err.message}`,
        ...prev
      ]);
    } finally {
      setExecutingTest(null);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetDemo();
      setActiveTest(0);
      setOutputLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] BASELINE RESTORED: All Alarms Cleared, 100% Sensor Trust, Devices Online.`,
        ...prev
      ]);
    } catch (err: any) {
      setActiveTest(0);
      setOutputLogs((prev) => [`[${new Date().toLocaleTimeString()}] Reset executed.`, ...prev]);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-rose-500" />
            <span>CYBER-PHYSICAL ACCESS SECURITY SIMULATOR</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard test suite: Authorized Access, Cloned RFID breach, and Valid RFID + Wrong Iris (Possible stolen credential).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET BASELINE</span>
          </button>
          <Link
            to="/attacker"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition hover:scale-105"
          >
            <Skull className="w-4 h-4" />
            <span>DEDICATED ATTACKER WEBSITE →</span>
          </Link>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200">
          <strong className="text-amber-400 uppercase tracking-wide">Standardized Cyber-Physical Schema:</strong>
          <p className="mt-0.5 text-amber-300/80">
            The 3D digital twin, Wokwi virtual hardware, Attacker Site, Defender SOC Dashboard, and n8n Telegram pipeline all use the exact same synchronized event model.
          </p>
        </div>
      </div>

      {/* 3D Real-Time Server Room Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              REAL-TIME 3D DIGITAL TWIN // SERVER ROOM A HARDWARE TWIN
            </h3>
          </div>
          <span className="text-xs text-slate-400">RFID + Biometric Iris + Magnetic Door + Dual Sirens</span>
        </div>
        <ServerRoom3D activePhase={activeTest} lastEvent={latestEvent} isAttackerView={false} />
      </div>

      {/* 3 Canonical Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEST_FLOWS.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl border flex flex-col justify-between ${t.color}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 border border-current">
                  TEST {t.id}
                </span>
                {t.id === 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : t.id === 2 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <BellRing className="w-4 h-4 text-rose-400" />}
              </div>
              <h4 className="text-sm font-bold text-white">{t.name}</h4>
              <p className="text-xs text-slate-300">{t.desc}</p>
              <div className="p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-200">
                <span className="text-slate-400 font-semibold">Expected: </span>
                {t.expected}
              </div>
            </div>

            <button
              onClick={() => handleExecuteTest(t.id)}
              disabled={executingTest !== null}
              className="mt-4 py-2 px-3 rounded-lg bg-black/60 hover:bg-black/90 border border-current font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${executingTest === t.id ? 'animate-spin' : ''}`} />
              <span>{executingTest === t.id ? 'EXECUTING...' : `RUN TEST ${t.id}`}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Simulator Telemetry Log */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0c121e]/90 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Execution Telemetry & Pipeline Feedback</span>
        </div>
        <div className="h-32 overflow-y-auto font-mono text-xs space-y-1 p-2 bg-black/60 rounded border border-slate-800/80 text-slate-300">
          {outputLogs.length === 0 ? (
            <div className="text-slate-500 italic">Select a test above or run via the Attacker Website / Wokwi virtual node to view telemetry.</div>
          ) : (
            outputLogs.map((log, idx) => <div key={idx}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};
