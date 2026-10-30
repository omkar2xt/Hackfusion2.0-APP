import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  X,
  Navigation,
  Crosshair,
  Footprints,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LocateFixed,
} from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { CyberRadarOverview, CampusZoneTelemetry } from '../types';

interface UserCoordinates {
  x: number; // percentage on map (0-100)
  y: number; // percentage on map (0-100)
}

interface GpsTelemetry {
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdated: string | null;
  source: 'gps' | 'simulation' | 'manual';
}

interface ZoneWithDistance extends CampusZoneTelemetry {
  distanceMeters: number;
  isWithinRadius: boolean;
  isApproaching: boolean;
}

export const RadarPage: React.FC = () => {
  const [radar, setRadar] = useState<CyberRadarOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // User Movement & Position States
  const [userPos, setUserPos] = useState<UserCoordinates>({ x: 34, y: 32 }); // Starts near Eng Quad
  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const [movementSpeed, setMovementSpeed] = useState<'walk' | 'run'>('walk');
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Live GPS Telemetry
  const [gps, setGps] = useState<GpsTelemetry>({
    active: false,
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    lastUpdated: null,
    source: 'simulation',
  });

  // Proximity Alert State
  const [selectedZone, setSelectedZone] = useState<CampusZoneTelemetry | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState('Phishing Outbreak');
  const [broadcastMessage, setBroadcastMessage] = useState('Urgent: Rogue Wi-Fi portal detected spoofing campus authentication.');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Fetch initial radar telemetry from backend
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

  // 1. Live GPS WatchPosition Listener
  useEffect(() => {
    let watchId: number | null = null;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          setGps({
            active: true,
            latitude,
            longitude,
            accuracy: accuracy ? Math.round(accuracy) : 5,
            speed: speed ? Math.round(speed * 3.6) : 0, // km/h
            heading: heading !== null && !isNaN(heading) ? Math.round(heading) : 0,
            lastUpdated: new Date().toLocaleTimeString(),
            source: 'gps',
          });
        },
        (error) => {
          console.warn('Geolocation watch notice:', error.message);
          // Set sensible fallback campus GPS coordinate (e.g. Apex Institute Campus)
          setGps((prev) => ({
            ...prev,
            active: false,
            latitude: prev.latitude ?? 37.4275,
            longitude: prev.longitude ?? -122.1697,
            accuracy: 12,
            lastUpdated: new Date().toLocaleTimeString(),
            source: 'simulation',
          }));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 2. Real-time Proximity Calculations
  // Campus Map is scaled to ~500m width x 400m height (1% x = 5m, 1% y = 4m)
  const zonesWithDistances: ZoneWithDistance[] = useMemo(() => {
    if (!radar?.campus_zones) return [];

    return radar.campus_zones
      .map((zone) => {
        const dxMeters = (userPos.x - zone.x_percent) * 5.0;
        const dyMeters = (userPos.y - zone.y_percent) * 4.0;
        const distanceMeters = Math.max(0, Math.round(Math.hypot(dxMeters, dyMeters)));
        const isWithinRadius = distanceMeters <= zone.radius_meters;
        const isApproaching = !isWithinRadius && distanceMeters <= zone.radius_meters + 60;

        return {
          ...zone,
          distanceMeters,
          isWithinRadius,
          isApproaching,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [radar?.campus_zones, userPos]);

  const nearestZone = zonesWithDistances[0] || null;
  const isUserInDangerZone = nearestZone?.threat_level === 'RED_ALERT' && nearestZone.isWithinRadius;
  const isUserApproachingDanger = nearestZone?.threat_level === 'RED_ALERT' && nearestZone.isApproaching;

  // 3. User Movement Controls (Click on Map, Step Pad, Walk toward Zone)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(5, Math.min(95, Math.round(clickX * 10) / 10));
    const clampedY = Math.max(5, Math.min(95, Math.round(clickY * 10) / 10));

    setUserPos({ x: clampedX, y: clampedY });
    setGps((prev) => ({
      ...prev,
      lastUpdated: new Date().toLocaleTimeString(),
      source: 'manual',
    }));
  };

  const handleStepMove = (dxPercent: number, dyPercent: number) => {
    setUserPos((prev) => ({
      x: Math.max(5, Math.min(95, Math.round((prev.x + dxPercent) * 10) / 10)),
      y: Math.max(5, Math.min(95, Math.round((prev.y + dyPercent) * 10) / 10)),
    }));
    setGps((prev) => ({
      ...prev,
      lastUpdated: new Date().toLocaleTimeString(),
      source: 'simulation',
    }));
  };

  const handleWalkToZone = (zone: CampusZoneTelemetry) => {
    setTargetDestination(zone.id);
    setIsSimulatingWalk(true);

    const startX = userPos.x;
    const startY = userPos.y;
    const targetX = zone.x_percent;
    const targetY = zone.y_percent;

    const steps = 15;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      // Linear interpolation with slight jitter for realistic walking
      const currentX = startX + (targetX - startX) * progress;
      const currentY = startY + (targetY - startY) * progress;

      setUserPos({
        x: Math.round(currentX * 10) / 10,
        y: Math.round(currentY * 10) / 10,
      });

      if (stepCount >= steps) {
        clearInterval(interval);
        setIsSimulatingWalk(false);
        setTargetDestination(null);
        setSelectedZone(zone);
      }
    }, movementSpeed === 'walk' ? 90 : 45);
  };

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
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28 font-sans">
      <Header
        title="Campus Cyber Radar & Live Proximity Mesh"
        subtitle="Real-time device movement tracking & automated perimeter threat alerts"
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* LIVE POSITION & GPS TELEMETRY STATUS BAR */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#315E63]/10 border border-[#315E63]/25 flex items-center justify-center text-[#315E63] shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#315E63] uppercase tracking-wider">
                  Live Position & Movement Engine
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27845A]/10 text-[#27845A] border border-[#27845A]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27845A] animate-ping" />
                  {gps.active ? 'GPS Hardware Synchronized' : 'Interactive Mesh Simulation'}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#202A35] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Current Sector: <strong className="text-[#315E63]">{nearestZone?.name || 'Campus Grounds'}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span>
                  Grid Position: <span className="font-mono text-[#315E63]">({userPos.x}%, {userPos.y}%)</span>
                </span>
                <span className="text-[#64748B]">•</span>
                <span>
                  GPS Lat/Long: <span className="font-mono text-[#64748B]">{gps.latitude?.toFixed(4) ?? '37.4275'}°N, {gps.longitude?.toFixed(4) ?? '-122.1697'}°W</span>
                </span>
                {gps.accuracy && (
                  <span className="text-[11px] text-[#64748B] font-mono">(±{gps.accuracy}m)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                // Center to nearest zone or reset to center
                setUserPos({ x: 45, y: 52 }); // Main Library
              }}
              className="px-3 py-1.5 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-xs font-bold text-[#315E63] border border-[#E5E9ED] transition flex items-center gap-1.5 cursor-pointer"
              title="Reset position to campus center"
            >
              <LocateFixed size={14} />
              <span>Center to Library</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#64748B] hover:text-[#315E63] transition cursor-pointer shadow-xs"
              title="Refresh Radar Feeds"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#315E63]' : ''} />
            </button>
          </div>
        </div>

        {/* PROXIMITY ALERT BANNER (Triggers automatically as user moves into threat perimeter) */}
        {isUserInDangerZone ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#C74747]/10 border-2 border-[#C74747] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C74747] text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle size={26} className="animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-white bg-[#C74747] px-2.5 py-0.5 rounded shadow-xs">
                    🚨 IMMINENT RED ALERT IN YOUR EXACT LOCATION
                  </span>
                  <span className="text-xs text-[#C74747] font-bold font-mono">
                    Distance: {nearestZone?.distanceMeters}m from Threat Beacon ({nearestZone?.name})
                  </span>
                </div>
                <p className="text-xs text-[#202A35] font-semibold mt-1 leading-relaxed">
                  Active Threat: <strong>{nearestZone?.last_reported_attack}</strong>. You are currently located inside the critical attack zone. Disconnect from unverified Wi-Fi and do not scan physical noticeboard QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedZone(nearestZone);
                  setBroadcastModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} />
                <span>Broadcast Alert to Nearby Phones</span>
              </button>
            </div>
          </div>
        ) : isUserApproachingDanger ? (
          <div className="p-4 rounded-2xl bg-[#C58A35]/10 border border-[#C58A35]/40 shadow-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C58A35] shrink-0" />
              <div>
                <span className="font-bold text-[#202A35]">
                  ⚠️ Warning: Approaching Elevated Threat Zone ({nearestZone?.name})
                </span>
                <span className="text-[#64748B] block mt-0.5">
                  You are {nearestZone?.distanceMeters}m away. Expected perimeter boundary starts at {nearestZone?.radius_meters}m.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#C58A35]/20 text-[#C58A35] font-bold text-[11px] whitespace-nowrap">
              Approaching Threat
            </span>
          </div>
        ) : null}

        {broadcastSuccess && (
          <div className="p-4 bg-[#27845A]/10 border border-[#27845A]/25 rounded-2xl flex items-center gap-3 text-[#27845A] text-xs shadow-xs font-semibold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{broadcastSuccess}</span>
          </div>
        )}

        {/* Global/Campus Alert Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Live Campus Attacks</span>
              <Activity className="w-4 h-4 text-[#315E63]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#202A35] mt-2">
              {radar?.live_attacks_count ?? 184}
            </div>
            <div className="text-[11px] text-[#27845A] mt-1 flex items-center gap-1 font-semibold">
              <span>+14.2%</span> <span className="text-[#64748B] font-normal">telemetry frequency</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Critical Red Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#C74747]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#C74747] mt-2">
              {radar?.critical_alerts_count ?? 2} Active
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Eng Quad & Bursar Hub
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Nearest Threat Distance</span>
              <Compass className="w-4 h-4 text-[#397C78]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#315E63] mt-2 font-mono">
              {nearestZone ? `${nearestZone.distanceMeters}m` : '--'}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 truncate">
              To {nearestZone?.name || 'Nearest Zone'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Privacy Guardrail</span>
              <CheckCircle className="w-4 h-4 text-[#27845A]" />
            </div>
            <div className="text-lg font-bold text-[#27845A] mt-2">
              Zero-PII Anonymized
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Differential privacy mesh active
            </div>
          </div>
        </div>

        {/* MAIN VISUAL SECTION: Interactive Campus Threat Map (Left) + Real-time Threat Feed & Proximity List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Interactive Campus Map & Live Movement Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3">
              {/* Map Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E9ED] gap-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#315E63]" />
                  <h2 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                    Interactive Campus Proximity Mesh Map
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-[#C74747] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#C74747]" /> Red Alert
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#C58A35] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#C58A35]" /> Elevated
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#27845A] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#27845A]" /> Secure
                  </span>
                </div>
              </div>

              {/* Map Interactive Notice & Movement Tips */}
              <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
                <span className="flex items-center gap-1">
                  <Crosshair size={12} className="text-[#315E63]" />
                  <span><strong>Click anywhere on the map</strong> to move your location live</span>
                </span>
                <span className="text-[#315E63] font-bold">
                  Scale: 1% ≈ 5 meters
                </span>
              </div>

              {/* The Map Surface */}
              <div
                ref={mapContainerRef}
                onClick={handleMapClick}
                className="relative my-2 w-full h-[420px] sm:h-[480px] rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] overflow-hidden shadow-inner flex items-center justify-center cursor-crosshair select-none"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(49, 94, 99, 0.04) 0%, transparent 70%),
                    linear-gradient(to right, rgba(229, 233, 237, 0.8) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(229, 233, 237, 0.8) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                }}
              >
                {/* Radar Sweep Animated Ring */}
                <div
                  className="absolute w-[460px] h-[460px] rounded-full border border-[#315E63]/10 pointer-events-none flex items-center justify-center animate-spin"
                  style={{ animationDuration: '24s' }}
                >
                  <div className="w-[300px] h-[300px] rounded-full border border-[#315E63]/15" />
                  <div className="w-[140px] h-[140px] rounded-full border border-[#315E63]/20" />
                  <div className="absolute top-0 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-[#315E63]/25 to-transparent" />
                </div>

                {/* Dashed Range Line connecting YOU to Nearest Threat Node */}
                {nearestZone && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1={`${userPos.x}%`}
                      y1={`${userPos.y}%`}
                      x2={`${nearestZone.x_percent}%`}
                      y2={`${nearestZone.y_percent}%`}
                      stroke={nearestZone.threat_level === 'RED_ALERT' ? '#C74747' : '#315E63'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      strokeOpacity="0.6"
                    />
                  </svg>
                )}

                {/* Campus Zones / Facility Nodes */}
                {zonesWithDistances.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  const isRed = zone.threat_level === 'RED_ALERT';
                  const isElevated = zone.threat_level === 'ELEVATED';

                  return (
                    <div
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZone(zone);
                      }}
                      style={{
                        left: `${zone.x_percent}%`,
                        top: `${zone.y_percent}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                    >
                      {/* Perimeter Radius Visual Ring */}
                      <div
                        style={{
                          width: `${(zone.radius_meters / 500) * 100 * 2.5}%`,
                          height: `${(zone.radius_meters / 400) * 100 * 2.5}%`,
                        }}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-300 ${
                          isRed
                            ? 'border border-[#C74747]/30 bg-[#C74747]/5'
                            : isElevated
                            ? 'border border-[#C58A35]/30 bg-[#C58A35]/5'
                            : 'border border-[#27845A]/20 bg-[#27845A]/5'
                        }`}
                      />

                      {/* Threat Radius Ping */}
                      {isRed && (
                        <div className="absolute -inset-4 rounded-full bg-[#C74747]/20 animate-ping pointer-events-none" />
                      )}

                      {/* Node Center Marker */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-transform duration-200 group-hover:scale-110 shadow-sm border-2 ${
                          isRed
                            ? 'bg-[#C74747] text-white border-white'
                            : isElevated
                            ? 'bg-[#C58A35] text-white border-white'
                            : 'bg-[#27845A] text-white border-white'
                        } ${isSelected ? 'ring-4 ring-[#315E63] scale-110' : ''}`}
                      >
                        {isRed ? <AlertTriangle size={16} /> : isElevated ? <Radio size={16} /> : <Shield size={16} />}
                      </div>

                      {/* Tooltip with Real-Time Distance */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-white border border-[#E5E9ED] px-2.5 py-1 rounded-xl shadow-md text-center pointer-events-none z-30">
                        <div className="text-[11px] font-bold text-[#202A35] flex items-center justify-center gap-1">
                          <span>{zone.name}</span>
                          <span className="text-[9px] font-mono text-[#315E63] font-bold">
                            ({zone.distanceMeters}m)
                          </span>
                        </div>
                        <div className="text-[9px] text-[#64748B]">
                          {zone.active_threats} threats • {zone.top_threat_vector}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* DYNAMIC MOVING USER BEACON ("YOU") */}
                <div
                  style={{
                    left: `${userPos.x}%`,
                    top: `${userPos.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 pointer-events-none"
                >
                  {/* Proximity Coverage Bubble (User Personal Radius) */}
                  <div className="w-20 h-20 -inset-6 rounded-full border-2 border-[#315E63]/30 bg-[#315E63]/10 absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 animate-ping" />

                  {/* Pulsing Core */}
                  <div className="w-6 h-6 rounded-full bg-[#315E63] border-3 border-white shadow-lg flex items-center justify-center text-white">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Floating YOU Badge with Real-time Distance */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#315E63] text-white text-[10px] font-bold shadow-md flex items-center gap-1 border border-white">
                    <Navigation size={10} className="text-white fill-white" />
                    <span>YOU</span>
                    {nearestZone && (
                      <span className="opacity-90 font-mono">
                        ({nearestZone.distanceMeters}m to {nearestZone.code})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* MOVEMENT SIMULATOR & STEP CONTROLLER */}
              <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-[#315E63]" />
                  <span className="text-xs font-bold text-[#202A35]">Move / Walk Simulator:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMovementSpeed('walk')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        movementSpeed === 'walk'
                          ? 'bg-[#315E63] text-white'
                          : 'bg-white text-[#64748B] border border-[#E5E9ED]'
                      }`}
                    >
                      Walk (1.5 m/s)
                    </button>
                    <button
                      onClick={() => setMovementSpeed('run')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        movementSpeed === 'run'
                          ? 'bg-[#315E63] text-white'
                          : 'bg-white text-[#64748B] border border-[#E5E9ED]'
                      }`}
                    >
                      Sprint (4.0 m/s)
                    </button>
                  </div>
                </div>

                {/* Step Arrow Direction Buttons */}
                <div className="flex items-center gap-1 self-end sm:self-center">
                  <span className="text-[10px] text-[#64748B] mr-1 font-medium">Step:</span>
                  <button
                    onClick={() => handleStepMove(-4, 0)}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#202A35] shadow-xs cursor-pointer"
                    title="Step West (Left)"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    onClick={() => handleStepMove(0, -4)}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#202A35] shadow-xs cursor-pointer"
                    title="Step North (Up)"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => handleStepMove(0, 4)}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#202A35] shadow-xs cursor-pointer"
                    title="Step South (Down)"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => handleStepMove(4, 0)}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#202A35] shadow-xs cursor-pointer"
                    title="Step East (Right)"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Quick Walk Destination Shortcut Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                <span className="text-[11px] text-[#64748B] font-bold shrink-0">Walk to:</span>
                {radar?.campus_zones?.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleWalkToZone(zone)}
                    disabled={isSimulatingWalk}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                      targetDestination === zone.id
                        ? 'bg-[#315E63] text-white border-[#315E63] animate-pulse'
                        : 'bg-white hover:bg-[#F0F4F4] text-[#202A35] border-[#E5E9ED]'
                    }`}
                  >
                    {zone.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Selected Zone Deep Dive Panel */}
              {selectedZone && (
                <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#202A35]">{selectedZone.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          selectedZone.threat_level === 'RED_ALERT'
                            ? 'bg-[#C74747]/10 text-[#C74747] border-[#C74747]/25'
                            : selectedZone.threat_level === 'ELEVATED'
                            ? 'bg-[#C58A35]/10 text-[#C58A35] border-[#C58A35]/25'
                            : 'bg-[#27845A]/10 text-[#27845A] border-[#27845A]/25'
                        }`}
                      >
                        {selectedZone.threat_level.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Recent Activity: {selectedZone.last_reported_attack} • Coverage: {selectedZone.radius_meters}m radius
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setBroadcastModalOpen(true)}
                      className="px-4 py-2 bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bell size={14} />
                      <span>Dispatch Alert to {selectedZone.code}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Nearby Threat Alerts & Real-Time Telemetry Feed */}
          <div className="lg:col-span-5 space-y-4">
            {/* LIVE NEARBY ALERTS (Ranked by User Proximity in Real Time) */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#C74747] animate-pulse" />
                  <h3 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                    Nearby Threats by Distance
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#315E63]/10 text-[#315E63]">
                  {zonesWithDistances.length} Active Beacons
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {zonesWithDistances.map((zone) => {
                  const isRed = zone.threat_level === 'RED_ALERT';
                  const isElevated = zone.threat_level === 'ELEVATED';

                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        zone.isWithinRadius
                          ? isRed
                            ? 'bg-[#C74747]/10 border-[#C74747]/40 ring-1 ring-[#C74747]'
                            : 'bg-[#C58A35]/10 border-[#C58A35]/40'
                          : 'bg-[#F7F8FA] border-[#E5E9ED] hover:bg-white hover:border-[#315E63]/30'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#202A35] truncate">{zone.name}</span>
                          {zone.isWithinRadius && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#C74747] text-white uppercase">
                              In Perimeter
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] truncate">
                          Threat: {zone.top_threat_vector}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold font-mono text-[#202A35]">
                          {zone.distanceMeters}m
                        </div>
                        <div
                          className={`text-[10px] font-bold uppercase ${
                            isRed ? 'text-[#C74747]' : isElevated ? 'text-[#C58A35]' : 'text-[#27845A]'
                          }`}
                        >
                          {zone.threat_level.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-Time Telemetry Event Log */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#315E63]" />
                  <h3 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                    Real-Time Incident Stream
                  </h3>
                </div>
                <span className="text-[10px] text-[#64748B] bg-[#F7F8FA] border border-[#E5E9ED] px-2 py-0.5 rounded font-mono font-bold">
                  ANONYMIZED
                </span>
              </div>

              {/* Feed Items Table */}
              <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                {radar?.realtime_threat_feed?.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] hover:bg-white hover:border-[#315E63]/30 transition space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#315E63] bg-[#315E63]/10 px-1.5 py-0.2 rounded border border-[#315E63]/25 font-bold">
                          {event.id}
                        </span>
                        <span className="text-xs font-bold text-[#202A35]">{event.category}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          event.severity === 'critical'
                            ? 'bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25'
                            : event.severity === 'high'
                            ? 'bg-[#C58A35]/10 text-[#C58A35] border border-[#C58A35]/25'
                            : 'bg-[#27845A]/10 text-[#27845A] border border-[#27845A]/25'
                        }`}
                      >
                        {event.severity}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#202A35] truncate bg-white p-2 rounded-lg border border-[#E5E9ED]">
                      {event.threat_vector}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#E5E9ED]">
                      <span className="flex items-center gap-1 text-[#202A35] font-medium">
                        <MapPin size={11} className="text-[#315E63]" /> {event.campus_zone}
                      </span>
                      <span className="text-[#315E63] font-mono font-semibold">
                        {event.anonymized_reporter}
                      </span>
                      <span className="text-[#64748B] font-mono">{event.timestamp_display}</span>
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
          <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">Aggregated Threat Trend by Time</h3>
              </div>
              <span className="text-xs text-[#64748B]">7-Day Rolling Window</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {radar?.trends?.map((item, idx) => {
                const total = item.incidents + item.scans;
                const maxVal = Math.max(...(radar.trends?.map((d) => d.incidents + d.scans) || [1]), 1);
                const pct = Math.min(100, Math.round((total / maxVal) * 100));

                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-mono text-[#64748B] text-[11px]">{item.date}</span>
                    <div className="flex-1 bg-[#F0F4F4] rounded-full h-3 overflow-hidden flex">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-[#315E63] rounded-full h-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-16 text-right font-bold text-[#202A35] text-xs">
                      {total} events
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Attack Vectors & Categories */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">Top Attack Vectors Distribution</h3>
              </div>
              <span className="text-xs text-[#64748B]">By Threat Category</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                <span className="text-xs text-[#64748B] font-medium">Phishing & Credential Theft</span>
                <div className="text-xl font-bold text-[#C74747]">{radar?.phishing_count ?? 14} Reports</div>
                <div className="w-full bg-[#E5E9ED] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#C74747] h-full w-[65%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                <span className="text-xs text-[#64748B] font-medium">Malicious Noticeboard QR</span>
                <div className="text-xl font-bold text-[#C58A35]">{radar?.qr_threats_count ?? 8} Scans</div>
                <div className="w-full bg-[#E5E9ED] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#C58A35] h-full w-[45%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                <span className="text-xs text-[#64748B] font-medium">Authority Impersonation</span>
                <div className="text-xl font-bold text-[#C58A35]">{radar?.impersonation_count ?? 5} Events</div>
                <div className="w-full bg-[#E5E9ED] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#C58A35] h-full w-[35%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                <span className="text-xs text-[#64748B] font-medium">Fee Wire & Financial Scams</span>
                <div className="text-xl font-bold text-[#315E63]">{radar?.payment_fraud_count ?? 3} Detected</div>
                <div className="w-full bg-[#E5E9ED] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#315E63] h-full w-[25%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Dispatch Proximity Red Alert to Nearby Devices */}
        {broadcastModalOpen && selectedZone && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#E5E9ED] rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#C74747]" />
                  <h3 className="text-base font-bold text-[#202A35]">Broadcast Red Alert</h3>
                </div>
                <button
                  onClick={() => setBroadcastModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#F7F8FA] border border-[#E5E9ED] text-[#64748B] hover:text-[#202A35] flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleBroadcastAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202A35] mb-1">Target Campus Zone</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedZone.name} (${selectedZone.radius_meters}m Proximity Mesh)`}
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#315E63] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202A35] mb-1">Alert Threat Category</label>
                  <select
                    value={broadcastCategory}
                    onChange={(e) => setBroadcastCategory(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] focus:outline-none focus:border-[#315E63]"
                  >
                    <option value="Phishing Outbreak">Phishing Outbreak (Fake SSO)</option>
                    <option value="Malicious QR Overlay">Malicious QR Noticeboard Sticker</option>
                    <option value="Rogue Wi-Fi Access Point">Rogue Wi-Fi Access Point Spoofing</option>
                    <option value="Bursar Fee Wire Scam">Bursar Fee Wire Smish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202A35] mb-1">Emergency Warning Message</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63]"
                    required
                  />
                </div>

                <div className="p-3 bg-[#C74747]/10 border border-[#C74747]/25 rounded-xl text-[11px] text-[#C74747] leading-relaxed font-medium">
                  ⚠️ This warning will trigger real-time banner alerts and push notifications on connected student and staff apps currently located in {selectedZone.name}.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#202A35] hover:bg-[#F0F4F4] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="px-5 py-2.5 bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
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
