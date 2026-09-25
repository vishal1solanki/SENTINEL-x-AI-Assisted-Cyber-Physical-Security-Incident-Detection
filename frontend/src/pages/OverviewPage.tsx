import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Radio,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Lock,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { api } from '../services/api';
import { Device, Incident, Event } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Link } from 'react-router-dom';
import { ServerRoom3D } from '../components/visualization/ServerRoom3D';

export const OverviewPage: React.FC = () => {
  const { latestEvent, latestIncident } = useWebSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [trustData, setTrustData] = useState<any>(null);
  const [blindSpotData, setBlindSpotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const [devs, incs, evs, trust, bs] = await Promise.all([
        api.getDevices(),
        api.getIncidents(),
        api.getEvents({ limit: 15 }),
        api.getTrustOverview(),
        api.getBlindSpots()
      ]);
      setDevices(devs);
      setIncidents(incs);
      setEvents(evs);
      setTrustData(trust);
      setBlindSpotData(bs);
    } catch (err) {
      console.error('Failed to load overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Update real-time feed on incoming WebSocket event
  useEffect(() => {
    if (latestEvent) {
      setEvents((prev) => [latestEvent, ...prev.slice(0, 14)]);
      // Refresh metrics on new correlated event
      fetchOverviewData();
    }
  }, [latestEvent]);

  useEffect(() => {
    if (latestIncident) {
      fetchOverviewData();
    }
  }, [latestIncident]);

  // Derived Metrics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
  const quarantinedDevices = devices.filter((d) => d.status === 'QUARANTINED').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const criticalIncidents = incidents.filter((i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.status !== 'RESOLVED').length;
  const avgTrust = trustData?.average_trust ?? 100.0;
  const securityCoverage = blindSpotData?.prototype_security_coverage ?? 100.0;
  const activeBlindSpots = blindSpotData?.active_blind_spots_count ?? 0;

  // Chart Data Preparation
  const severityDistribution = [
    { name: 'CRITICAL', value: incidents.filter((i) => i.severity === 'CRITICAL').length, color: '#f43f5e' },
    { name: 'HIGH', value: incidents.filter((i) => i.severity === 'HIGH').length, color: '#f59e0b' },
    { name: 'MEDIUM', value: incidents.filter((i) => i.severity === 'MEDIUM').length, color: '#06b6d4' },
    { name: 'LOW', value: incidents.filter((i) => i.severity === 'LOW').length, color: '#10b981' },
  ].filter((item) => item.value > 0);

  const trustDistributionData = trustData?.distribution
    ? [
        { category: 'HIGH (80-100)', count: trustData.distribution.high, fill: '#10b981' },
        { category: 'MOD (60-79)', count: trustData.distribution.moderate, fill: '#06b6d4' },
        { category: 'LOW (40-59)', count: trustData.distribution.low, fill: '#f59e0b' },
        { category: 'CRIT (0-39)', count: trustData.distribution.critical, fill: '#f43f5e' },
      ]
    : [];

  const timelineChartData = events.slice(0, 10).reverse().map((e, idx) => ({
    time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    trustImpact: Math.abs(e.trust_impact || 0),
  }));

  const getActivePhase = (): number => {
    if (!latestEvent) return 0;
    const type = latestEvent.event_type;
    if (type === 'IRIS_MISMATCH' || type === 'ACCESS_DENIED_MISMATCH') return 3;
    if (type === 'CLONED_RFID' || type === 'ACCESS_DENIED_CLONED') return 2;
    if (type === 'ACCESS_GRANTED' || type === 'IRIS_VERIFIED' || type === 'RFID_VERIFIED') return 1;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
            <span>SOC COMMAND OVERVIEW</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              REAL-TIME SYNC
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Correlated cyber-physical threat posture, perimeter coverage & sensor trust metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/attacker"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-600/80 text-xs font-mono text-rose-300 font-bold shadow-md shadow-rose-950 transition hover:scale-105"
          >
            <span>🔴 ATTACKER WEBSITE</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            to="/incidents"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs shadow-md shadow-cyan-950 transition"
          >
            <span>VIEW ALL INCIDENTS</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Real-Time 3D Server Room Digital Twin // Live Attack Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100">
              REAL-TIME 3D SERVER ROOM DIGITAL TWIN // LIVE ATTACK VISUALIZATION
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Room: SERVER-ROOM-A</span>
            <span>•</span>
            <span className="text-cyan-400">Interactive 3D Digital Twin</span>
          </div>
        </div>
        <ServerRoom3D activePhase={getActivePhase()} lastEvent={latestEvent} isAttackerView={false} />
      </div>

      {/* 8 Primary SOC Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Devices"
          value={totalDevices}
          subtitle={`${onlineDevices} online perimeter nodes`}
          icon={Cpu}
          variant="cyan"
        />
        <MetricCard
          title="Active Incidents"
          value={activeIncidents.length}
          subtitle={`${criticalIncidents} high/critical priority`}
          icon={AlertTriangle}
          variant={criticalIncidents > 0 ? 'rose' : 'default'}
        />
        <MetricCard
          title="Average Sensor Trust"
          value={`${avgTrust}%`}
          subtitle={avgTrust < 70 ? 'Integrity warning detected' : 'Normal telemetry baseline'}
          icon={ShieldCheck}
          variant={avgTrust < 60 ? 'rose' : avgTrust < 80 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Security Coverage"
          value={`${securityCoverage}%`}
          subtitle="Prototype Security Coverage"
          icon={Radio}
          variant={securityCoverage < 80 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Critical Alerts"
          value={criticalIncidents}
          subtitle="Immediate analyst action required"
          icon={ShieldAlert}
          variant={criticalIncidents > 0 ? 'rose' : 'default'}
        />
        <MetricCard
          title="Blind Spots"
          value={activeBlindSpots}
          subtitle="Active unverified telemetry zones"
          icon={EyeOff}
          variant={activeBlindSpots > 0 ? 'amber' : 'default'}
        />
        <MetricCard
          title="Quarantined Nodes"
          value={quarantinedDevices}
          subtitle="Simulated device isolation"
          icon={Lock}
          variant={quarantinedDevices > 0 ? 'rose' : 'default'}
        />
        <MetricCard
          title="Online Sensors"
          value={trustData?.total_sensors ?? 10}
          subtitle="Edge telemetry endpoints"
          icon={Activity}
          variant="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Trust Distribution */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-mono uppercase text-slate-300 font-bold">Sensor Trust Breakdown</h3>
              <p className="text-[11px] text-slate-500">Distribution across 4 trust health tiers</p>
            </div>
            <Link to="/trust" className="text-[11px] text-cyan-400 hover:underline font-mono">
              View Matrix →
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trustDistributionData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {trustDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Severity Pie */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-mono uppercase text-slate-300 font-bold">Incident Severity</h3>
              <p className="text-[11px] text-slate-500">Breakdown of recorded security incidents</p>
            </div>
            <Link to="/incidents" className="text-[11px] text-cyan-400 hover:underline font-mono">
              View Incidents →
            </Link>
          </div>
          <div className="h-56 flex items-center justify-center">
            {severityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No incidents recorded yet</div>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs font-mono mt-2">
            {severityDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Anomaly Activity Area */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-mono uppercase text-slate-300 font-bold">Trust Impact Trend</h3>
              <p className="text-[11px] text-slate-500">Magnitude of trust deductions over recent events</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              RECENT DELTA
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trustImpactGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="trustImpact" stroke="#f43f5e" fillOpacity={1} fill="url(#trustImpactGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-mono uppercase text-white font-bold tracking-wide">Live Correlated Event Stream</h3>
              <p className="text-xs text-slate-400">Streamed in real-time over WebSocket from physical & cyber telemetry</p>
            </div>
          </div>
          <Link
            to="/events"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
          >
            <span>View Full Log ({events.length}+)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Source Device</th>
                <th className="py-2.5 px-3">Perimeter</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Trust Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-cyan-400">
                    {ev.event_type}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {ev.source_device_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {ev.room_id || 'Global'}
                  </td>
                  <td className="py-2.5 px-3">
                    <ThreatBadge level={ev.severity} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {ev.trust_impact > 0 ? (
                      <span className="text-rose-400 font-bold">-{ev.trust_impact}%</span>
                    ) : (
                      <span className="text-slate-500">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
