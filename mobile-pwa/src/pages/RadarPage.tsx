import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Radio,
  CheckCircle,
  RefreshCw,
  MapPin,
  Bell,
  Zap,
  Clock,
  Activity,
} from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { CyberRadarOverview, CampusZoneTelemetry } from '../types';

export const RadarPage: React.FC = () => {
  const [radar, setRadar] = useState<CyberRadarOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Proximity Alert State
  const [selectedZone, setSelectedZone] = useState<CampusZoneTelemetry | null>(null);
  const [userLocationZone, setUserLocationZone] = useState<string>('eng-quad'); // default simulated device location
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState('Phishing Outbreak');
  const [broadcastMessage, setBroadcastMessage] = useState('Urgent: Rogue Wi-Fi portal detected spoofing campus authentication.');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const radarData = await api.getCyberRadarOverview();
      setRadar(radarData);

      if (radarData.campus_zones && radarData.campus_zones.length > 0 && !selectedZone) {
        setSelectedZone(radarData.campus_zones[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Cyber Radar intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    setBroadcasting(true);
    try {
      await api.broadcastEmergencyAlert({
        target_zone: `${selectedZone.name} (${selectedZone.radius_meters}m Proximity Mesh)`,
        category: broadcastCategory,
        title: `EMERGENCY RED ALERT: ${broadcastCategory}`,
        message: broadcastMessage,
        severity: 'CRITICAL',
        action_instructions: 'Disconnect immediately from unverified networks or rogue APs. Verify official credentials on campus portal.',
        delivery_scope: 'PROXIMITY_MESH',
      });
      try {
        await api.broadcastProximityAlert({
          zone_id: selectedZone.id,
          category: broadcastCategory,
          severity: 'critical',
          message: broadcastMessage,
        });
      } catch {
        // ignore fallback
      }
      setBroadcastSuccess(`🚨 RED ALERT dispatched to all devices within ${selectedZone.radius_meters}m of ${selectedZone.name}!`);
      setBroadcastModalOpen(false);
      // Refresh radar data
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  // Find user's current zone telemetry
  const userZoneInfo = radar?.campus_zones?.find((z) => z.id === userLocationZone);
  const isUserInRedAlertZone = userZoneInfo?.threat_level === 'RED_ALERT';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-28 selection:bg-teal-500 selection:text-slate-950">
      <Header
        title="Campus Cyber Radar & Threat Trend Mapping"
        subtitle="Innovation 4: Real-time proximity alert mesh & zero-PII pattern analytics"
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">Live Threat Radar</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Campus Threat Cartography & Proximity Mesh</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Zone Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <MapPin size={13} className="text-teal-400" />
              <span className="text-slate-400">My Device Zone:</span>
              <select
                value={userLocationZone}
                onChange={(e) => setUserLocationZone(e.target.value)}
                className="bg-transparent text-teal-300 font-bold focus:outline-none cursor-pointer"
              >
                {radar?.campus_zones?.map((z) => (
                  <option key={z.id} value={z.id} className="bg-slate-900 text-slate-200">
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-400 transition cursor-pointer"
              title="Refresh Radar"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-teal-400' : ''} />
            </button>
          </div>
        </div>

        {/* PROXIMITY RED ALERT FLASHING BANNER */}
        {isUserInRedAlertZone && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-slate-900 border-2 border-red-500 shadow-2xl shadow-red-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={26} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                    🚨 IMMINENT RED ALERT IN YOUR ZONE
                  </span>
                  <span className="text-xs text-red-200 font-medium font-mono">
                    Distance: ~75m away ({userZoneInfo?.name})
                  </span>
                </div>
                <p className="text-sm text-red-100 font-semibold mt-1">
                  {userZoneInfo?.last_reported_attack}. Avoid entering university credentials or scanning physical noticeboard QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setBroadcastModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} />
                <span>Broadcast Alert to Nearby Phones</span>
              </button>
            </div>
          </div>
        )}

        {broadcastSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs shadow-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{broadcastSuccess}</span>
          </div>
        )}

        {/* Global/Campus Alert Status Metrics (Modeled after user's Image 5) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Live Campus Attacks</span>
              <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {radar?.live_attacks_count ?? 184}
            </div>
            <div className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
              <span>+14.2%</span> <span className="text-slate-500">vs last 24h</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Critical Red Alerts</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-400 mt-2">
              {radar?.critical_alerts_count ?? 2} Active
            </div>
            <div className="text-[11px] text-red-300/80 mt-1">
              Engineering Quad & Admin Hub
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Blocked Inbound Traps</span>
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-2">
              {radar?.blocked_traffic_count ?? 2140}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Edge DNS Sinkhole active
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Privacy Guardrail</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-2">
              Zero-PII Anonymized
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Student identities 100% protected
            </div>
          </div>
        </div>

        {/* MAIN VISUAL SECTION: Interactive Campus Threat Map (Left) + Real-time Threat Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Interactive Dark Cyber Campus Map (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              {/* Map Title Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Interactive Campus Proximity Mesh Map
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Red Alert Zone
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 ml-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Elevated
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 ml-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secure
                  </span>
                </div>
              </div>

              {/* The Map Surface (Visual Cartography matching Image 5) */}
              <div
                className="relative my-4 w-full h-[400px] sm:h-[480px] rounded-2xl bg-[#050a14] border border-cyan-950/60 overflow-hidden shadow-inner flex items-center justify-center"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 70%),
                    linear-gradient(to right, rgba(15, 23, 42, 0.7) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                }}
              >
                {/* Radar Sweep Animated Ring */}
                <div className="absolute w-[460px] h-[460px] rounded-full border border-teal-500/10 pointer-events-none flex items-center justify-center animate-spin" style={{ animationDuration: '18s' }}>
                  <div className="w-[300px] h-[300px] rounded-full border border-teal-500/15" />
                  <div className="w-[140px] h-[140px] rounded-full border border-teal-500/20" />
                  <div className="absolute top-0 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-teal-400/30 to-transparent" />
                </div>

                {/* Facility Footprints / Campus Mesh Nodes */}
                {radar?.campus_zones?.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  const isUserHere = userLocationZone === zone.id;
                  const isRed = zone.threat_level === 'RED_ALERT';
                  const isElevated = zone.threat_level === 'ELEVATED';

                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      style={{
                        left: `${zone.x_percent}%`,
                        top: `${zone.y_percent}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                    >
                      {/* Pulsing Threat Radius Ring */}
                      {isRed && (
                        <div className="absolute -inset-6 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                      )}
                      {isElevated && (
                        <div className="absolute -inset-4 rounded-full bg-amber-500/15 animate-pulse pointer-events-none" />
                      )}

                      {/* Node Center Marker */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-transform duration-200 group-hover:scale-125 shadow-xl border-2 ${
                          isRed
                            ? 'bg-red-600 text-white border-red-400 shadow-red-500/50'
                            : isElevated
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/40'
                            : 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
                        } ${isSelected ? 'ring-4 ring-teal-400 scale-110' : ''}`}
                      >
                        {isRed ? <AlertTriangle size={16} /> : isElevated ? <Radio size={16} /> : <Shield size={16} />}
                      </div>

                      {/* Label Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-slate-950/95 border border-slate-800 px-2.5 py-1 rounded-xl shadow-xl text-center pointer-events-none z-30">
                        <div className="text-[11px] font-bold text-white flex items-center justify-center gap-1">
                          <span>{zone.name}</span>
                          {isUserHere && (
                            <span className="text-[9px] bg-teal-500 text-slate-950 font-black px-1 rounded">YOU</span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {zone.active_threats} threats • {zone.top_threat_vector}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Simulated Device GPS Pulse */}
                {userZoneInfo && (
                  <div
                    style={{
                      left: `${userZoneInfo.x_percent}%`,
                      top: `${userZoneInfo.y_percent}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  >
                    <div className="w-28 h-28 rounded-full border-2 border-teal-400/40 animate-ping" />
                  </div>
                )}
              </div>

              {/* Selected Zone Deep Dive Panel */}
              {selectedZone && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{selectedZone.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          selectedZone.threat_level === 'RED_ALERT'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : selectedZone.threat_level === 'ELEVATED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {selectedZone.threat_level.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Recent Activity: {selectedZone.last_reported_attack} • Coverage: {selectedZone.radius_meters}m radius
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setBroadcastModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bell size={14} />
                      <span>Dispatch Alert to {selectedZone.code}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Real-Time Threat Feed (Matching Image 5) (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Real-Time Threat Feed
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                  ANONYMIZED TELEMETRY
                </span>
              </div>

              {/* Feed Items Table */}
              <div className="space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
                {radar?.realtime_threat_feed?.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-teal-500/40 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">
                          {event.id}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{event.category}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          event.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : event.severity === 'high'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-teal-500/20 text-teal-300'
                        }`}
                      >
                        {event.severity}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-amber-300/90 truncate bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      {event.threat_vector}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin size={11} className="text-teal-400" /> {event.campus_zone}
                      </span>
                      <span className="text-teal-400 font-mono">
                        {event.anonymized_reporter}
                      </span>
                      <span className="text-slate-500 font-mono">{event.timestamp_display}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: 7-Day Trend Analytics & Top Attack Vectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7-Day Trend Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Aggregated Threat Trend by Time</h3>
              </div>
              <span className="text-xs text-slate-400">7-Day Rolling Window</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {radar?.trends?.map((item, idx) => {
                const total = item.incidents + item.scans;
                const maxVal = Math.max(...(radar.trends?.map((d) => d.incidents + d.scans) || [1]), 1);
                const pct = Math.min(100, Math.round((total / maxVal) * 100));

                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-mono text-slate-400 text-[11px]">{item.date}</span>
                    <div className="flex-1 bg-slate-800/90 rounded-full h-3.5 overflow-hidden flex">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-gradient-to-r from-teal-500 via-cyan-400 to-rose-500 rounded-full h-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-14 text-right font-bold text-slate-200 text-xs">
                      {total} events
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Attack Vectors & Categories */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Top Attack Vectors Distribution</h3>
              </div>
              <span className="text-xs text-slate-400">By Threat Category</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Phishing & Credential Theft</span>
                <div className="text-xl font-bold text-red-400">{radar?.phishing_count ?? 14} Reports</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-red-500 h-full w-[65%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Malicious Noticeboard QR</span>
                <div className="text-xl font-bold text-orange-400">{radar?.qr_threats_count ?? 8} Scans</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-orange-500 h-full w-[45%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Authority Impersonation</span>
                <div className="text-xl font-bold text-yellow-400">{radar?.impersonation_count ?? 5} Events</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-yellow-400 h-full w-[35%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Fee Wire & Financial Scams</span>
                <div className="text-xl font-bold text-teal-400">{radar?.payment_fraud_count ?? 3} Detected</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-teal-400 h-full w-[25%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Dispatch Proximity Red Alert to Nearby Devices */}
        {broadcastModalOpen && selectedZone && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-red-500/60 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                  <h3 className="text-base font-bold text-white">Broadcast Red Alert</h3>
                </div>
                <button
                  onClick={() => setBroadcastModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBroadcastAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Campus Zone</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedZone.name} (${selectedZone.radius_meters}m Proximity Mesh)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-teal-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Threat Category</label>
                  <select
                    value={broadcastCategory}
                    onChange={(e) => setBroadcastCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="Phishing Outbreak">Phishing Outbreak (Fake SSO)</option>
                    <option value="Malicious QR Overlay">Malicious QR Noticeboard Sticker</option>
                    <option value="Rogue Wi-Fi Access Point">Rogue Wi-Fi Access Point Spoofing</option>
                    <option value="Bursar Fee Wire Scam">Bursar Fee Wire Smish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Warning Message</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-[11px] text-red-300 leading-relaxed">
                  ⚠️ This warning will trigger real-time banner alerts and push notifications on connected student and staff apps currently located in {selectedZone.name}.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <Zap size={14} />
                    <span>{broadcasting ? 'Transmitting Alert...' : 'Dispatch Red Alert Mesh'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RadarPage;
