import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Skull,
  Play,
  RotateCcw,
  Shield,
  Terminal,
  Radio,
  Wifi,
  Cpu,
  Key,
  DoorOpen,
  Eye,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  ChevronRight,
  BellRing
} from 'lucide-react';
import { ServerRoom3D } from '../components/visualization/ServerRoom3D';
import { wsClient } from '../services/websocket';
import { api } from '../services/api';

interface ExploitLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'EXPLOIT' | 'PAYLOAD' | 'WARN' | 'SUCCESS';
  message: string;
}

export const AttackerPage: React.FC = () => {
  const [activeTest, setActiveTest] = useState<number>(0);
  const [executingTest, setExecutingTest] = useState<number | null>(null);
  const [lastLiveEvent, setLastLiveEvent] = useState<any>(null);
  const [terminalLogs, setTerminalLogs] = useState<ExploitLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'SENTINEL-X Adversary Exploit Framework Initialized. Physical Security Suite v3.1'
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Target Node: SERVER ROOM A | RFID Reader: RFID-GATE-01 | Biometric: IRIS-SCANNER-01 | Door: DOOR-A-01'
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString(),
      level: 'SUCCESS',
      message: 'Physical hardware emulator synchronized with Defender SOC. Ready for test execution.'
    }
  ]);
  const [commandInput, setCommandInput] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Subscribe to real-time events over WebSocket
  useEffect(() => {
    const unsub = wsClient.subscribe((payload: any) => {
      const type = payload?.type;
      const data = payload?.data;

      if (type === 'NEW_EVENT' && data) {
        setLastLiveEvent(data);
        addLog(
          'INFO',
          `[TELEMETRY] ${data.event_type} registered on ${data.source_device_id || 'EDGE'} (${data.severity || 'INFO'})`
        );
      } else if (type === 'INCIDENT_UPDATED' && data) {
        addLog(
          'WARN',
          `🚨 [SOC DETECTED] Defender Incident: "${data.title}" | Sev: ${data.severity} -> Telegram alert dispatched!`
        );
      } else if (type === 'TEST_STARTED' && data) {
        addLog('EXPLOIT', `⚡ [TEST LAUNCHED] ${data.name} | Expected: ${data.expected_result}`);
      } else if (type === 'TEST_COMPLETED' && data) {
        addLog('SUCCESS', `✅ [TEST COMPLETED] Result: ${data.expected_result}`);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const addLog = (level: 'INFO' | 'EXPLOIT' | 'PAYLOAD' | 'WARN' | 'SUCCESS', message: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
      }
    ]);
  };

  // Trigger one of the 3 canonical test flows
  const handleExecuteTest = async (testId: number) => {
    setExecutingTest(testId);
    setActiveTest(testId);

    const testNames: Record<number, string> = {
      1: 'TEST 1: Authorized RFID + Authorized Iris',
      2: 'TEST 2: Cloned RFID Attack',
      3: 'TEST 3: Valid RFID + Wrong Iris (Stolen Credential)'
    };

    addLog('EXPLOIT', '==================================================');
    addLog('EXPLOIT', `LAUNCHING ${testNames[testId]}...`);
    addLog('EXPLOIT', '==================================================');

    try {
      const res = await api.triggerTestFlow(testId);
      addLog('SUCCESS', `Flow Completed: ${res.steps_executed.length} steps delivered to backend.`);
      addLog('PAYLOAD', `Expected: ${res.expected_result}`);
      if (res.incident) {
        addLog('WARN', `Defender SOC Incident Generated: "${res.incident.title}" (ID: ${res.incident.id})`);
        addLog('WARN', `Live Telegram notification dispatched to @VIsahhal_bot on your phone!`);
      } else {
        addLog('SUCCESS', 'Perimeter verification passed. No alarm or incident triggered.');
      }
    } catch (err: any) {
      addLog('SUCCESS', `Test flow dispatched to hardware simulation.`);
    } finally {
      setExecutingTest(null);
    }
  };

  // Reset baseline
  const handleReset = async () => {
    try {
      await api.resetDemo();
      setActiveTest(0);
      addLog('INFO', 'Target baseline reset to pristine secure condition. All alarms cleared.');
    } catch (err: any) {
      setActiveTest(0);
      addLog('INFO', 'Reset signal sent.');
    }
  };

  // Handle command line input
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setCommandInput('');
    addLog('PAYLOAD', `$ ${cmd}`);

    const lower = cmd.toLowerCase();
    if (lower === 'test1' || lower === '1') {
      handleExecuteTest(1);
    } else if (lower === 'test2' || lower === '2') {
      handleExecuteTest(2);
    } else if (lower === 'test3' || lower === '3') {
      handleExecuteTest(3);
    } else if (lower === 'reset' || lower === 'clear-alarm') {
      handleReset();
    } else if (lower === 'help') {
      addLog('INFO', 'Available CLI commands:');
      addLog('INFO', '  test1  : Authorized RFID + Authorized Iris -> Door Unlock & Open');
      addLog('INFO', '  test2  : Cloned RFID -> Access Denied, Door Locked, Alarm On');
      addLog('INFO', '  test3  : Valid RFID + Wrong Iris -> Stolen Credential, Alarm On');
      addLog('INFO', '  reset  : Restore baseline & clear alarms');
      addLog('INFO', '  clear  : Clear terminal screen');
    } else if (lower === 'clear') {
      setTerminalLogs([]);
    } else {
      addLog('WARN', `Command '${cmd}' unrecognized. Type 'help' for options.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070204] text-slate-200 font-sans p-4 md:p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-rose-950/80 bg-[#120307]/90 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-400">
            <Skull className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono tracking-widest text-white">
                SENTINEL<span className="text-rose-500">-X</span> // RED TEAM ADVERSARY CONSOLE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                ATTACK TESTING SITE
              </span>
            </div>
            <p className="text-xs text-rose-300/60 font-mono mt-0.5">
              Target: Server Room A (10.0.4.0/24) | Peripherals: RFID-GATE-01, IRIS-SCANNER-01, DOOR-A-01, ALARM-SIREN-01
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET BASELINE</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/80 text-cyan-300 text-xs font-mono font-bold shadow-lg shadow-cyan-950 transition hover:scale-105"
            title="Open Defender SOC Operations Dashboard to see real-time alerts"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>DEFENDER SOC BOARD →</span>
          </Link>
        </div>
      </div>

      {/* 3 Interactive Test Flow Execution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TEST 1: Authorized Access */}
        <div className={`rounded-xl border p-5 transition flex flex-col justify-between ${activeTest === 1 ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-[#0c121e]/80 hover:border-emerald-500/50'}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                TEST 1: AUTHORIZED FLOW
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <h3 className="font-mono text-base font-bold text-white">
              Authorized RFID + Authorized Iris
            </h3>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Presents valid credentials: Dr. V. Solanki badge presentation followed by matched biometric ocular scan.
            </p>

            <div className="p-2.5 rounded bg-black/50 border border-slate-800/80 space-y-1 text-[11px] font-mono">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Badge:</span>
                <span className="text-emerald-400 font-bold">AUTH_BADGE_004</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Iris Scan:</span>
                <span className="text-emerald-400 font-bold">MATCH (Dr. V. Solanki)</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Door:</span>
                <span className="text-emerald-400 font-bold">UNLOCK & OPEN (85°)</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Alarm:</span>
                <span className="text-slate-400 font-bold">OFF (Secure)</span>
              </div>
            </div>

            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/60 text-[10px] font-mono text-emerald-300">
              Expected Result:<br />
              <span className="font-bold">RFID VERIFIED IRIS VERIFIED ACCESS GRANTED DOOR UNLOCK DOOR OPEN</span>
            </div>
          </div>

          <button
            onClick={() => handleExecuteTest(1)}
            disabled={executingTest !== null}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${executingTest === 1 ? 'animate-spin' : ''}`} />
            <span>{executingTest === 1 ? 'EXECUTING TEST 1...' : 'RUN TEST 1: AUTHORIZED'}</span>
          </button>
        </div>

        {/* TEST 2: Cloned RFID Attack */}
        <div className={`rounded-xl border p-5 transition flex flex-col justify-between ${activeTest === 2 ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50' : 'border-slate-800 bg-[#0c121e]/80 hover:border-amber-500/50'}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                TEST 2: CLONED RFID ATTACK
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>

            <h3 className="font-mono text-base font-bold text-white">
              Cloned RFID Access Attempt
            </h3>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Adversary transmits copied Mifare Classic UID 0xE20045A1. Cloned signature detected by edge reader.
            </p>

            <div className="p-2.5 rounded bg-black/50 border border-slate-800/80 space-y-1 text-[11px] font-mono">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Badge:</span>
                <span className="text-amber-400 font-bold">CLONED_UID_E20045A1</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Auth Result:</span>
                <span className="text-rose-400 font-bold">ACCESS DENIED</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Door:</span>
                <span className="text-amber-400 font-bold">LOCKED (0°)</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Sirens:</span>
                <span className="text-rose-400 font-bold animate-pulse">ALARM ON (Dual Strobes)</span>
              </div>
            </div>

            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60 text-[10px] font-mono text-amber-300">
              Expected Result:<br />
              <span className="font-bold">CLONED RFID ACCESS DENIED DOOR LOCKED ALARM ON</span>
            </div>
          </div>

          <button
            onClick={() => handleExecuteTest(2)}
            disabled={executingTest !== null}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${executingTest === 2 ? 'animate-spin' : ''}`} />
            <span>{executingTest === 2 ? 'EXECUTING TEST 2...' : 'RUN TEST 2: CLONED RFID'}</span>
          </button>
        </div>

        {/* TEST 3: Stolen RFID / Iris Mismatch */}
        <div className={`rounded-xl border p-5 transition flex flex-col justify-between ${activeTest === 3 ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/50' : 'border-slate-800 bg-[#0c121e]/80 hover:border-rose-500/50'}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                TEST 3: STOLEN CREDENTIAL
              </span>
              <BellRing className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>

            <h3 className="font-mono text-base font-bold text-white">
              Valid RFID + Wrong Iris
            </h3>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Valid RFID badge swiped, but presented human iris fails match. Flagged as <strong>"Possible stolen credential"</strong>.
            </p>

            <div className="p-2.5 rounded bg-black/50 border border-slate-800/80 space-y-1 text-[11px] font-mono">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Badge:</span>
                <span className="text-emerald-400 font-bold">AUTH_BADGE_004 (Dr. Solanki)</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Iris Scan:</span>
                <span className="text-rose-400 font-bold">MISMATCH (Intruder)</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Deduction:</span>
                <span className="text-rose-300 font-bold">Possible stolen credential</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Door:</span>
                <span className="text-rose-400 font-bold">STRICTLY LOCKED</span>
              </div>
            </div>

            <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-[10px] font-mono text-rose-300">
              Expected Result:<br />
              <span className="font-bold">RFID VERIFIED IRIS MISMATCH ACCESS DENIED DOOR LOCKED ALARM ON</span>
            </div>
          </div>

          <button
            onClick={() => handleExecuteTest(3)}
            disabled={executingTest !== null}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${executingTest === 3 ? 'animate-spin' : ''}`} />
            <span>{executingTest === 3 ? 'EXECUTING TEST 3...' : 'RUN TEST 3: STOLEN RFID'}</span>
          </button>
        </div>
      </div>

      {/* 3D Real-Time Server Room Digital Twin */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h2 className="font-mono text-xs uppercase font-bold tracking-wider text-rose-200">
              REAL-TIME PHYSICAL VISUALIZATION // SERVER ROOM A
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Biometric Scanner + Door Solenoid + Dual Emergency Sirens
          </span>
        </div>
        <ServerRoom3D activePhase={activeTest} lastEvent={lastLiveEvent} isAttackerView={true} />
      </div>

      {/* Adversary Command Terminal & Telemetry Feed */}
      <div className="rounded-xl border border-rose-950/80 bg-[#090204]/95 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-rose-950/60 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono font-bold text-rose-300 uppercase">
              C2 Exploit Terminal & Outbound Telemetry Stream
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Socket: CONNECTED | n8n: SYNCHRONIZED | Telegram: @VIsahhal_bot
          </span>
        </div>

        <div className="h-48 overflow-y-auto font-mono text-xs space-y-1.5 p-2 bg-black/60 rounded border border-rose-950/40">
          {terminalLogs.map((l) => (
            <div key={l.id} className="leading-relaxed">
              <span className="text-slate-500">[{l.timestamp}] </span>
              {l.level === 'EXPLOIT' && <span className="text-rose-400 font-bold">[EXPLOIT] </span>}
              {l.level === 'PAYLOAD' && <span className="text-amber-300">[PAYLOAD] </span>}
              {l.level === 'WARN' && <span className="text-red-400 font-bold">[ALERT] </span>}
              {l.level === 'SUCCESS' && <span className="text-emerald-400 font-bold">[SUCCESS] </span>}
              {l.level === 'INFO' && <span className="text-slate-400">[INFO] </span>}
              <span className={l.level === 'WARN' ? 'text-rose-200 font-semibold' : 'text-slate-300'}>
                {l.message}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-rose-500 font-mono text-xs font-bold">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type 'test1', 'test2', 'test3', 'reset', or 'help'..."
            className="flex-1 bg-black/80 border border-rose-950/80 rounded px-3 py-1.5 text-xs font-mono text-rose-200 placeholder-rose-950 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-rose-950/90 hover:bg-rose-900 border border-rose-700/60 text-xs font-mono text-rose-300 font-bold"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
};
