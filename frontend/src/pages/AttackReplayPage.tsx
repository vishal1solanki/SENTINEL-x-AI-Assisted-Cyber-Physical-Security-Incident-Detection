import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Activity,
  Key,
  DoorClosed,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { ThreatBadge } from '../components/common/ThreatBadge';

export const AttackReplayPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Record<string, any>>({});
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('COORDINATED_INTRUSION');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [replayEvents, setReplayEvents] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState<string>('NORMAL');
  const [trustScore, setTrustScore] = useState<number>(100.0);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.getScenarios().then((data) => {
      setScenarios(data);
    });
  }, []);

  const scenario = scenarios[selectedScenarioKey];
  const steps = scenario?.steps || [];

  const handleReset = async () => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStepIndex(-1);
    setReplayEvents([]);
    setThreatLevel('NORMAL');
    setTrustScore(100.0);
    setActiveIncidentId(null);
    try {
      await api.resetDemo();
    } catch {}
  };

  const executeStep = async (stepIdx: number) => {
    if (stepIdx >= steps.length) {
      setIsPlaying(false);
      return;
    }
    const step = steps[stepIdx];
    setCurrentStepIndex(stepIdx);
    setThreatLevel(step.threat_level || 'ELEVATED');

    try {
      const res = await api.replayStep({
        event_type: step.event_type,
        source_device_id: step.source_device_id,
        sensor_id: step.sensor_id,
        room_id: step.room_id || 'ROOM-SERVER-A',
        severity: step.severity,
        metadata: step.metadata || {},
        description: step.description
      });

      if (res.incident_id) {
        setActiveIncidentId(res.incident_id);
      }

      setReplayEvents((prev) => [
        {
          step: step.step,
          time: new Date().toLocaleTimeString(),
          event_type: step.event_type,
          source_device_id: step.source_device_id,
          severity: step.severity,
          description: step.description,
        },
        ...prev,
      ]);

      if (step.event_type.includes('INCONSISTENCY') || step.event_type.includes('ANOMALY')) {
        setTrustScore((prev) => Math.max(20, prev - 25));
      }
    } catch (err: any) {
      console.error('Failed to replay step:', err);
    }
  };

  const handleStepForward = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < steps.length) {
      executeStep(nextIdx);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying) {
      const nextIdx = currentStepIndex + 1;
      if (nextIdx < steps.length) {
        const stepDelay = ((steps[nextIdx]?.delay_sec || 2.0) * 1000) / playbackSpeed;
        timerRef.current = setTimeout(() => {
          executeStep(nextIdx);
        }, stepDelay);
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, playbackSpeed]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
            <span>INTERACTIVE ATTACK REPLAY</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              STEP-BY-STEP SIMULATION
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Replay complex cyber-physical intrusion sequences in controlled simulation time.
          </p>
        </div>

        {/* Scenario Selector */}
        <select
          value={selectedScenarioKey}
          onChange={(e) => {
            setSelectedScenarioKey(e.target.value);
            handleReset();
          }}
          className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg px-3 py-2 text-cyan-400 focus:outline-none focus:border-cyan-500"
        >
          {Object.entries(scenarios).map(([k, sc]) => (
            <option key={k} value={k}>{sc.name}</option>
          ))}
        </select>
      </div>

      {/* Control Console */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold transition"
            >
              <Pause className="w-4 h-4" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={currentStepIndex >= steps.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-md shadow-cyan-950 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>PLAY REPLAY</span>
            </button>
          )}

          <button
            onClick={handleStepForward}
            disabled={isPlaying || currentStepIndex >= steps.length - 1}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            <span>STEP FORWARD</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">SPEED:</span>
          {[1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-3 py-1.5 rounded border transition ${
                playbackSpeed === s
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {s}X
            </button>
          ))}
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">THREAT POSTURE:</span>
            <ThreatBadge level={threatLevel} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">ESTIMATED TRUST:</span>
            <span className={`font-bold ${trustScore < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {trustScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Replay Stepper Timeline */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider mb-4">
          Scenario Timeline Progression ({currentStepIndex + 1} / {steps.length} Steps Executed)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((st: any, idx: number) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={st.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950 ring-1 ring-cyan-500'
                    : isCompleted
                    ? 'border-slate-700 bg-slate-900/60'
                    : 'border-slate-800/60 bg-slate-950/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-bold">STEP {st.step}</span>
                  <ThreatBadge level={st.severity} size="sm" />
                </div>
                <div className="text-xs font-bold text-white font-mono truncate">{st.event_type}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{st.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Events Feed */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
        <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider mb-4">
          Playback Telemetry Output Stream
        </h3>

        <div className="space-y-2 font-mono text-xs">
          {replayEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Click 'PLAY REPLAY' or 'STEP FORWARD' to start emitting simulated telemetry.
            </div>
          ) : (
            replayEvents.map((ev, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">[{ev.time}]</span>
                  <span className="text-cyan-400 font-bold">{ev.event_type}</span>
                  <span className="text-slate-300">({ev.source_device_id})</span>
                  <span className="text-slate-400 text-[11px]">{ev.description}</span>
                </div>
                <ThreatBadge level={ev.severity} size="sm" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
