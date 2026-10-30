import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  Radio,
  CheckCircle,
  RefreshCw,
  MapPin,
  Bell,
  Zap,
  Activity,
  X,
  Navigation,
  Footprints,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LocateFixed,
  Square,
  RotateCcw,
  Plus,
  Settings,
  Info,
} from 'lucide-react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import Header from '../components/Header';
import { api } from '../services/api';
import type {
  CyberRadarOverview,
  CampusZoneTelemetry,
  CampusBuilding,
  Incident,
} from '../types';

// Verified KLS VDIT, Haliyal, Karnataka coordinates
const KLS_VDIT_CENTER = {
  lat: 15.3227274,
  lng: 74.7549305,
};

interface SimulatorState {
  enabled: boolean;
  lat: number;
  lng: number;
  speedMode: 'walk' | 'sprint'; // 1.5 m/s vs 4.0 m/s
  stepMeters: number;
  totalDistanceTraveled: number;
  activeBuildingName: string | null;
}

interface UserGpsState {
  active: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdated: string | null;
  status: 'INITIALIZING' | 'ACTIVE' | 'DENIED' | 'UNAVAILABLE' | 'STOPPED';
}

export const RadarPage: React.FC = () => {
  // 1. Data States
  const [viewMode, setViewMode] = useState<'mesh' | 'gis'>('mesh');
  const [radar, setRadar] = useState<CyberRadarOverview | null>(null);
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Active Zone & Selection
  const [selectedZone, setSelectedZone] = useState<CampusZoneTelemetry | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // 3. Live Hardware GPS State
  const [gps, setGps] = useState<UserGpsState>({
    active: false,
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    lastUpdated: null,
    status: 'STOPPED',
  });
  const watchIdRef = useRef<number | null>(null);

  // 4. Movement Simulator (TEST MODE)
  const [sim, setSim] = useState<SimulatorState>({
    enabled: false,
    lat: 15.3225, // Starts at Eng Quad
    lng: 74.7552,
    speedMode: 'walk',
    stepMeters: 15,
    totalDistanceTraveled: 0,
    activeBuildingName: 'Engineering & CS Quad (CSE & IT Labs)',
  });

  // 5. Admin Mapping Panel State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newBldgForm, setNewBldgForm] = useState({
    name: '',
    code: '',
    building_type: 'academic',
    latitude: 15.3227,
    longitude: 74.7549,
    radius_meters: 120,
    description: '',
  });

  // 6. Proximity Broadcast State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState('Phishing Outbreak');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Urgent: Malicious captive Wi-Fi portal detected spoofing campus authentication.'
  );
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // 7. Leaflet Map References
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const simMarkerRef = useRef<L.Marker | null>(null);
  const buildingLayersRef = useRef<{ [key: string]: L.LayerGroup }>({});

  // Audio Beep for Proximity Alert
  const playAlertChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  // Fetch initial telemetry and buildings
  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [radarData, bldgsData, incsData] = await Promise.allSettled([
        api.getCyberRadarOverview(),
        api.getCampusBuildings(),
        api.getIncidents(),
      ]);

      if (radarData.status === 'fulfilled') {
        setRadar(radarData.value);
        if (radarData.value.campus_zones?.length && !selectedZone) {
          setSelectedZone(radarData.value.campus_zones[0]);
        }
      }

      if (bldgsData.status === 'fulfilled') {
        setBuildings(bldgsData.value);
      }

      if (incsData.status === 'fulfilled') {
        setIncidents(incsData.value);
      }
    } catch (err) {
      console.error('Error fetching campus radar feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // --- LEAFLET MAP INITIALIZATION ---
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map centered at KLS VDIT
    const map = L.map(mapElementRef.current, {
      center: [KLS_VDIT_CENTER.lat, KLS_VDIT_CENTER.lng],
      zoom: 17,
      maxZoom: 19,
      minZoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    // Add high-clarity OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Add campus outer boundary ring
    const campusBoundary = L.circle([KLS_VDIT_CENTER.lat, KLS_VDIT_CENTER.lng], {
      radius: 400,
      color: '#315E63',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#315E63',
      fillOpacity: 0.03,
    }).addTo(map);

    campusBoundary.bindTooltip('KLS VDIT Campus Boundary', {
      permanent: false,
      direction: 'top',
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'gis') {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [viewMode]);

  // --- RENDER BUILDING & THREAT MARKERS ON MAP ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !buildings.length) return;

    // Clear previous building markers
    Object.values(buildingLayersRef.current).forEach((layerGroup) => {
      map.removeLayer(layerGroup);
    });
    buildingLayersRef.current = {};

    // Map each building with custom HTML marker matching screenshot exactly
    buildings.forEach((bldg) => {
      // Find matching radar telemetry zone
      const zone = radar?.campus_zones?.find(
        (z) => z.code === bldg.code || z.name.toLowerCase().includes(bldg.name.toLowerCase())
      );

      const threatLevel = zone?.threat_level || 'NORMAL';
      const activeThreats = zone?.active_threats ?? (bldg.code === 'ENG-QUAD' ? 14 : bldg.code === 'ADMIN-BURSAR' ? 19 : bldg.code === 'LIB-COMMONS' ? 8 : bldg.code === 'STUDENT-UNION' ? 6 : 2);
      const threatVector = zone?.top_threat_vector || (bldg.code === 'ENG-QUAD' ? 'Credential Harvester' : bldg.code === 'ADMIN-BURSAR' ? 'Impersonation Wire Phish' : bldg.code === 'LIB-COMMONS' ? 'Malicious QR Code' : bldg.code === 'STUDENT-UNION' ? 'Phishing SMS' : 'Standard Baseline');

      const isRed = threatLevel === 'RED_ALERT';
      const isElevated = threatLevel === 'ELEVATED';

      const badgeBg = isRed ? '#C74747' : isElevated ? '#C58A35' : '#27845A';
      const badgeIconSvg = isRed
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        : isElevated
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;

      // Check if user or sim is currently at this building
      const isUserHere =
        gps.active &&
        gps.lat &&
        gps.lng &&
        turf.distance(
          turf.point([gps.lng, gps.lat]),
          turf.point([bldg.longitude, bldg.latitude]),
          { units: 'meters' }
        ) <= bldg.radius_meters;

      // Custom HTML Marker matching the uploaded screenshot card style
      const customHtml = `
        <div class="flex items-center gap-2 transform -translate-x-4 -translate-y-4 transition-transform hover:scale-105 cursor-pointer select-none">
          <!-- Colored Circular Badge -->
          <div style="background-color: ${badgeBg}; box-shadow: 0 4px 12px ${badgeBg}40;" 
               class="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 border-2 border-white">
            ${badgeIconSvg}
          </div>

          <!-- Clean White Pill Card -->
          <div class="bg-white border border-[#E5E9ED] shadow-md px-3 py-1.5 rounded-2xl flex flex-col justify-center whitespace-nowrap min-w-[150px]">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-[#202A35]">${bldg.name.split('(')[0].trim()}</span>
              ${
                isUserHere
                  ? `<span class="bg-[#202A35] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">YOU</span>`
                  : ''
              }
            </div>
            <div class="text-[10px] text-[#64748B] flex items-center gap-1 font-medium mt-0.5">
              <span>${activeThreats} threats</span>
              <span>•</span>
              <span class="truncate max-w-[130px]">${threatVector}</span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-radar-marker',
        iconSize: [220, 48],
        iconAnchor: [20, 24],
      });

      // Layer group for marker and radius circle
      const layerGroup = L.layerGroup();

      // Threat perimeter circle
      const circle = L.circle([bldg.latitude, bldg.longitude], {
        radius: bldg.radius_meters,
        color: badgeBg,
        weight: 1.5,
        opacity: isRed ? 0.7 : 0.4,
        fillColor: badgeBg,
        fillOpacity: isRed ? 0.08 : 0.04,
      });

      const marker = L.marker([bldg.latitude, bldg.longitude], {
        icon: customIcon,
      });

      marker.on('click', () => {
        if (zone) {
          setSelectedZone(zone);
        } else {
          setSelectedZone({
            id: bldg.id,
            name: bldg.name,
            code: bldg.code,
            category: bldg.building_type,
            threat_level: threatLevel,
            active_threats: activeThreats,
            reported_incidents_today: 4,
            radius_meters: bldg.radius_meters,
            proximity_alert_active: isRed,
            last_reported_attack: '15m ago (Telemetry Scan)',
            top_threat_vector: threatVector,
            x_percent: 50,
            y_percent: 50,
          });
        }
      });

      layerGroup.addLayer(circle);
      layerGroup.addLayer(marker);
      layerGroup.addTo(map);

      buildingLayersRef.current[bldg.id] = layerGroup;
    });
  }, [buildings, radar, gps.lat, gps.lng, gps.active]);

  // --- LIVE GPS TRACKING ENGINE ---
  const startGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      setGps((prev) => ({ ...prev, status: 'UNAVAILABLE' }));
      alert('Geolocation API is not supported on this browser or device.');
      return;
    }

    setGps((prev) => ({ ...prev, status: 'INITIALIZING' }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const newGpsState: UserGpsState = {
          active: true,
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ? Math.round(accuracy) : 8,
          speed: speed ? Math.round(speed * 3.6) : 0,
          heading: heading !== null && !isNaN(heading) ? Math.round(heading) : null,
          lastUpdated: new Date().toLocaleTimeString(),
          status: 'ACTIVE',
        };
        setGps(newGpsState);

        // Update Leaflet User Marker & Accuracy Circle
        const map = mapInstanceRef.current;
        if (map) {
          if (!userMarkerRef.current) {
            const userIcon = L.divIcon({
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="w-7 h-7 rounded-full bg-[#315E63] border-3 border-white shadow-lg flex items-center justify-center text-white font-black text-[10px]">
                    YOU
                  </div>
                  <div class="absolute -inset-2 rounded-full bg-[#315E63]/30 animate-ping pointer-events-none"></div>
                </div>
              `,
              className: 'custom-user-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
            userCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy || 15,
              color: '#315E63',
              weight: 1,
              fillColor: '#315E63',
              fillOpacity: 0.1,
            }).addTo(map);
          } else {
            userMarkerRef.current.setLatLng([latitude, longitude]);
            if (userCircleRef.current) {
              userCircleRef.current.setLatLng([latitude, longitude]);
              userCircleRef.current.setRadius(accuracy || 15);
            }
          }
        }
      },
      (err) => {
        console.warn('Geolocation permission or device error:', err.message);
        setGps((prev) => ({
          ...prev,
          active: false,
          status: err.code === 1 ? 'DENIED' : 'UNAVAILABLE',
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGps((prev) => ({
      ...prev,
      active: false,
      status: 'STOPPED',
    }));

    if (userMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userCircleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(userCircleRef.current);
      userCircleRef.current = null;
    }
  };

  const centerOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (gps.lat && gps.lng) {
      map.flyTo([gps.lat, gps.lng], 18, { duration: 1 });
    } else if (sim.enabled) {
      map.flyTo([sim.lat, sim.lng], 18, { duration: 1 });
    } else {
      map.flyTo([KLS_VDIT_CENTER.lat, KLS_VDIT_CENTER.lng], 17, { duration: 1 });
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // --- MOVEMENT SIMULATOR (TEST MODE) ---
  const toggleSimulator = () => {
    setSim((prev) => {
      const nextState = !prev.enabled;
      if (nextState) {
        // Render test simulator marker on map
        const map = mapInstanceRef.current;
        if (map && !simMarkerRef.current) {
          const simIcon = L.divIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <div class="w-8 h-8 rounded-full bg-[#397C78] border-2 border-white shadow-lg flex items-center justify-center text-white font-bold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>
                </div>
                <div class="absolute -top-6 whitespace-nowrap bg-[#397C78] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  TEST MODE
                </div>
              </div>
            `,
            className: 'custom-user-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          simMarkerRef.current = L.marker([prev.lat, prev.lng], { icon: simIcon, zIndexOffset: 900 }).addTo(map);
        }
      } else {
        if (simMarkerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(simMarkerRef.current);
          simMarkerRef.current = null;
        }
      }
      return { ...prev, enabled: nextState };
    });
  };

  const handleSimMove = (direction: 'N' | 'S' | 'E' | 'W') => {
    if (!sim.enabled) return;

    // Convert meters to approximate degree delta
    const meters = sim.stepMeters;
    const deltaLat = (meters / 111139) * (direction === 'N' ? 1 : direction === 'S' ? -1 : 0);
    const deltaLng =
      (meters / (111139 * Math.cos((sim.lat * Math.PI) / 180))) *
      (direction === 'E' ? 1 : direction === 'W' ? -1 : 0);

    const newLat = sim.lat + deltaLat;
    const newLng = sim.lng + deltaLng;
    const addedDistance = meters;

    // Check closest building
    let closestBldgName: string | null = null;
    let minD = Infinity;

    buildings.forEach((b) => {
      const d = turf.distance(turf.point([newLng, newLat]), turf.point([b.longitude, b.latitude]), {
        units: 'meters',
      });
      if (d < minD) {
        minD = d;
        closestBldgName = b.name;
      }
    });

    setSim((prev) => ({
      ...prev,
      lat: newLat,
      lng: newLng,
      totalDistanceTraveled: prev.totalDistanceTraveled + addedDistance,
      activeBuildingName: minD <= 120 ? closestBldgName : 'Campus Walkway',
    }));

    if (simMarkerRef.current) {
      simMarkerRef.current.setLatLng([newLat, newLng]);
    }
  };

  const resetSimulator = () => {
    const initLat = 15.3225;
    const initLng = 74.7552;
    setSim((prev) => ({
      ...prev,
      lat: initLat,
      lng: initLng,
      totalDistanceTraveled: 0,
      activeBuildingName: 'Engineering & CS Quad (CSE & IT Labs)',
    }));
    if (simMarkerRef.current) {
      simMarkerRef.current.setLatLng([initLat, initLng]);
    }
  };

  // --- DISTANCE & GEOFENCE CALCULATIONS VIA TURF.JS ---
  const activePosition = useMemo(() => {
    if (gps.active && gps.lat && gps.lng) {
      return { lat: gps.lat, lng: gps.lng, isSim: false };
    }
    if (sim.enabled) {
      return { lat: sim.lat, lng: sim.lng, isSim: true };
    }
    // Default fallback to center
    return { lat: KLS_VDIT_CENTER.lat, lng: KLS_VDIT_CENTER.lng, isSim: false };
  }, [gps.active, gps.lat, gps.lng, sim.enabled, sim.lat, sim.lng]);

  const buildingsWithDistances = useMemo(() => {
    if (!buildings.length) return [];

    const userPt = turf.point([activePosition.lng, activePosition.lat]);

    return buildings
      .map((bldg) => {
        const bldgPt = turf.point([bldg.longitude, bldg.latitude]);
        const distanceMeters = Math.round(turf.distance(userPt, bldgPt, { units: 'meters' }));
        const isWithinRadius = distanceMeters <= bldg.radius_meters;
        const isApproaching = !isWithinRadius && distanceMeters <= bldg.radius_meters + 60;

        const zone = radar?.campus_zones?.find(
          (z) => z.code === bldg.code || z.name.toLowerCase().includes(bldg.name.toLowerCase())
        );

        return {
          ...bldg,
          distanceMeters,
          isWithinRadius,
          isApproaching,
          threatLevel: zone?.threat_level || 'NORMAL',
          activeThreats: zone?.active_threats || 4,
          topThreatVector: zone?.top_threat_vector || 'Standard Perimeter',
          lastReportedAttack: zone?.last_reported_attack || '3m ago (Fake SSO Wi-Fi Portal)',
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [buildings, activePosition, radar]);

  const nearestBuilding = buildingsWithDistances[0] || null;
  const isInsideDangerZone =
    nearestBuilding?.threatLevel === 'RED_ALERT' && nearestBuilding.isWithinRadius;
  const isApproachingDanger =
    nearestBuilding?.threatLevel === 'RED_ALERT' && nearestBuilding.isApproaching;

  // Trigger audio alert when entering danger perimeter
  useEffect(() => {
    if (isInsideDangerZone) {
      playAlertChime();
    }
  }, [isInsideDangerZone, playAlertChime]);

  // Handle Proximity Red Alert Broadcast
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
        action_instructions:
          'Disconnect immediately from unverified networks or rogue APs. Verify official credentials on campus portal.',
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
        // Fallback catch
      }

      setBroadcastSuccess(
        `🚨 RED ALERT dispatched to all devices within ${selectedZone.radius_meters}m of ${selectedZone.name}!`
      );
      setBroadcastModalOpen(false);
      fetchTelemetry();
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  // Admin mapping actions
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCampusBuilding({
        ...newBldgForm,
        is_verified: true,
        is_active: true,
      });
      alert('Building registered successfully!');
      setNewBldgForm({
        name: '',
        code: '',
        building_type: 'academic',
        latitude: 15.3227,
        longitude: 74.7549,
        radius_meters: 120,
        description: '',
      });
      fetchTelemetry();
    } catch (err: any) {
      alert(err.message || 'Failed to add building');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28 font-sans">
      <Header
        title="Campus Intelligence Radar"
        subtitle="Geospatial Proximity Mesh & Real-Time Threat Tracking — KLS VDIT Campus"
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* TOP STATUS BAR: GPS TELEMETRY & TRACKING CONTROLS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#315E63]/10 border border-[#315E63]/25 flex items-center justify-center text-[#315E63] shrink-0">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#315E63] uppercase tracking-wider">
                  Live Campus Geolocation Mesh
                </span>
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    gps.status === 'ACTIVE'
                      ? 'bg-[#27845A]/10 text-[#27845A] border-[#27845A]/20'
                      : gps.status === 'DENIED'
                      ? 'bg-[#C74747]/10 text-[#C74747] border-[#C74747]/20'
                      : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      gps.status === 'ACTIVE'
                        ? 'bg-[#27845A] animate-ping'
                        : gps.status === 'DENIED'
                        ? 'bg-[#C74747]'
                        : 'bg-[#64748B]'
                    }`}
                  />
                  {gps.status === 'ACTIVE'
                    ? 'GPS Active'
                    : gps.status === 'DENIED'
                    ? 'GPS Permission Denied'
                    : 'GPS Inactive'}
                </span>
              </div>

              <div className="text-xs font-semibold text-[#202A35] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Nearest Sector:{' '}
                  <strong className="text-[#315E63]">{nearestBuilding?.name || 'Campus Grounds'}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span>
                  Distance:{' '}
                  <strong className="font-mono text-[#315E63]">
                    {nearestBuilding ? `${nearestBuilding.distanceMeters} m` : '--'}
                  </strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span>
                  Coordinates:{' '}
                  <span className="font-mono text-[#64748B]">
                    {activePosition.lat.toFixed(5)}°N, {activePosition.lng.toFixed(5)}°E
                  </span>
                </span>
                {gps.accuracy && (
                  <span className="text-[11px] text-[#64748B] font-mono">(±{gps.accuracy}m)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {gps.status !== 'ACTIVE' ? (
              <button
                onClick={startGpsTracking}
                className="px-3.5 py-2 rounded-xl bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LocateFixed size={14} />
                <span>Track My GPS</span>
              </button>
            ) : (
              <button
                onClick={stopGpsTracking}
                className="px-3.5 py-2 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#C74747] text-xs font-bold border border-[#E5E9ED] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Square size={14} />
                <span>Stop Tracking</span>
              </button>
            )}

            <button
              onClick={centerOnUser}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F0F4F4] text-xs font-bold text-[#315E63] border border-[#E5E9ED] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Recenter Map View"
            >
              <Compass size={14} />
              <span>Recenter</span>
            </button>

            <button
              onClick={toggleSimulator}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                sim.enabled
                  ? 'bg-[#397C78] text-white border-[#397C78]'
                  : 'bg-white hover:bg-[#F0F4F4] text-[#397C78] border-[#E5E9ED]'
              }`}
            >
              <Footprints size={14} />
              <span>{sim.enabled ? 'Test Mode Active' : 'Movement Simulator'}</span>
            </button>

            <button
              onClick={() => setAdminModalOpen(true)}
              className="p-2 rounded-xl bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#64748B] hover:text-[#315E63] transition cursor-pointer shadow-xs"
              title="Admin Campus Mapping Panel"
            >
              <Settings size={15} />
            </button>

            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#64748B] hover:text-[#315E63] transition cursor-pointer shadow-xs"
              title="Refresh Feeds"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#315E63]' : ''} />
            </button>
          </div>
        </div>

        {/* PROXIMITY ALERT BANNER */}
        {isInsideDangerZone ? (
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
                    YOU — {nearestBuilding?.distanceMeters}m from Threat Beacon ({nearestBuilding?.name})
                  </span>
                </div>
                <p className="text-xs text-[#202A35] font-semibold mt-1 leading-relaxed">
                  Active Threat: <strong>{nearestBuilding?.lastReportedAttack}</strong>. You are currently located inside
                  the critical attack zone perimeter. Disconnect from unverified Wi-Fi APs and do not scan physical noticeboard QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedZone({
                    id: nearestBuilding.id,
                    name: nearestBuilding.name,
                    code: nearestBuilding.code,
                    category: nearestBuilding.building_type,
                    threat_level: nearestBuilding.threatLevel,
                    active_threats: nearestBuilding.activeThreats,
                    reported_incidents_today: 4,
                    radius_meters: nearestBuilding.radius_meters,
                    proximity_alert_active: true,
                    last_reported_attack: nearestBuilding.lastReportedAttack,
                    top_threat_vector: nearestBuilding.topThreatVector,
                    x_percent: 50,
                    y_percent: 50,
                  });
                  setBroadcastModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} />
                <span>Broadcast Alert to Nearby Phones</span>
              </button>
            </div>
          </div>
        ) : isApproachingDanger ? (
          <div className="p-4 rounded-2xl bg-[#C58A35]/10 border border-[#C58A35]/40 shadow-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C58A35] shrink-0" />
              <div>
                <span className="font-bold text-[#202A35]">
                  ⚠️ Warning: Approaching Elevated Threat Zone ({nearestBuilding?.name})
                </span>
                <span className="text-[#64748B] block mt-0.5">
                  You are {nearestBuilding?.distanceMeters}m away. Threat perimeter starts at {nearestBuilding?.radius_meters}m.
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

        {/* METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Mapped Facilities</span>
              <MapPin className="w-4 h-4 text-[#315E63]" />
            </div>
            <div className="text-2xl font-extrabold text-[#202A35] mt-2">
              {buildings.length || 8}
            </div>
            <div className="text-[11px] text-[#27845A] mt-1 font-semibold">
              KLS VDIT Verified
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Critical Red Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#C74747]" />
            </div>
            <div className="text-2xl font-extrabold text-[#C74747] mt-2">
              {radar?.critical_alerts_count ?? 2} Active
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 truncate">
              Eng Quad & Bursar
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Nearest Threat</span>
              <Compass className="w-4 h-4 text-[#397C78]" />
            </div>
            <div className="text-2xl font-extrabold text-[#315E63] mt-2 font-mono">
              {nearestBuilding ? `${nearestBuilding.distanceMeters} m` : '--'}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 truncate">
              To {nearestBuilding?.name.split('(')[0] || 'Perimeter'}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Suspicious Zones</span>
              <Radio className="w-4 h-4 text-[#C58A35]" />
            </div>
            <div className="text-2xl font-extrabold text-[#C58A35] mt-2">
              2 Zones
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Library & Dining Hall
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Privacy Shield</span>
              <Shield className="w-4 h-4 text-[#27845A]" />
            </div>
            <div className="text-base font-bold text-[#27845A] mt-2">
              Zero-PII Mesh
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Differential Privacy
            </div>
          </div>
        </div>

        {/* MAIN VISUAL SECTION: INTERACTIVE CAMPUS PROXIMITY MESH & GIS MAP */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm relative overflow-hidden space-y-4">
          {/* Header Bar matching Screenshot exactly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E9ED] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-[#315E63]" />
              <h2 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                Interactive Campus Proximity Mesh Map
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              {/* Legend matching Screenshot */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[11px] text-[#C74747] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C74747]" /> Red Alert Zone
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#C58A35] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C58A35]" /> Elevated
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#27845A] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27845A]" /> Secure
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-xl bg-[#F0F4F4] border border-[#E5E9ED]">
                <button
                  type="button"
                  onClick={() => setViewMode('mesh')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'mesh'
                      ? 'bg-white text-[#315E63] shadow-xs'
                      : 'text-[#64748B] hover:text-[#202A35]'
                  }`}
                >
                  Mesh Topology
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('gis')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'gis'
                      ? 'bg-white text-[#315E63] shadow-xs'
                      : 'text-[#64748B] hover:text-[#202A35]'
                  }`}
                >
                  Leaflet GIS
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: 2D VECTOR PROXIMITY MESH (EXACT MATCH WITH SCREENSHOT) */}
          {viewMode === 'mesh' && (
            <div className="relative w-full h-[470px] sm:h-[540px] rounded-2xl overflow-hidden border border-[#E5E9ED] bg-[#FAFBFC] select-none shadow-inner">
              {/* SVG Grid, Concentric Rings & Curved Mesh Arcs */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="proximity-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E9ED" strokeWidth="0.8" opacity="0.65" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#proximity-grid-pattern)" />

                {/* Concentric Proximity Rings around Engineering & CS Quad (32%, 28%) */}
                <circle cx="32%" cy="28%" r="38" fill="none" stroke="#315E63" strokeWidth="1.2" opacity="0.25" />
                <circle cx="32%" cy="28%" r="76" fill="none" stroke="#C74747" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                <circle cx="32%" cy="28%" r="120" fill="none" stroke="#C74747" strokeWidth="0.8" opacity="0.12" />

                {/* Concentric Proximity Rings around Admin Hub (68%, 37%) */}
                <circle cx="68%" cy="37%" r="35" fill="none" stroke="#C74747" strokeWidth="1.2" opacity="0.25" />
                <circle cx="68%" cy="37%" r="70" fill="none" stroke="#C74747" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                <circle cx="68%" cy="37%" r="110" fill="none" stroke="#C74747" strokeWidth="0.8" opacity="0.12" />

                {/* Concentric Proximity Rings around Main Library (48%, 50%) */}
                <circle cx="48%" cy="50%" r="36" fill="none" stroke="#C58A35" strokeWidth="1.2" opacity="0.3" />
                <circle cx="48%" cy="50%" r="72" fill="none" stroke="#C58A35" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />

                {/* Concentric Proximity Rings around Dining Hall (25%, 60%) */}
                <circle cx="25%" cy="60%" r="34" fill="none" stroke="#C58A35" strokeWidth="1.2" opacity="0.25" />
                <circle cx="25%" cy="60%" r="68" fill="none" stroke="#C58A35" strokeWidth="0.8" opacity="0.15" />

                {/* Concentric Proximity Rings around Residence Halls (55%, 72%) */}
                <circle cx="55%" cy="72%" r="35" fill="none" stroke="#27845A" strokeWidth="1.2" opacity="0.3" />
                <circle cx="55%" cy="72%" r="75" fill="none" stroke="#27845A" strokeWidth="0.8" opacity="0.15" />

                {/* Concentric Proximity Rings around Science Tower (76%, 63%) */}
                <circle cx="76%" cy="63%" r="35" fill="none" stroke="#27845A" strokeWidth="1.2" opacity="0.3" />
                <circle cx="76%" cy="63%" r="75" fill="none" stroke="#27845A" strokeWidth="0.8" opacity="0.15" />

                {/* Sweeping Connecting Mesh Arcs between Nodes */}
                <path d="M 680 120 C 520 200, 480 320, 760 410" fill="none" stroke="#D1D9E0" strokeWidth="1.2" opacity="0.45" />
                <path d="M 320 180 C 420 220, 460 260, 480 320" fill="none" stroke="#D1D9E0" strokeWidth="1.2" opacity="0.45" />
                <path d="M 680 240 C 580 260, 520 290, 480 320" fill="none" stroke="#D1D9E0" strokeWidth="1.2" opacity="0.45" />
                <path d="M 250 390 C 350 420, 450 440, 550 470" fill="none" stroke="#D1D9E0" strokeWidth="1.2" opacity="0.45" />
                <path d="M 550 470 C 650 480, 700 450, 760 410" fill="none" stroke="#D1D9E0" strokeWidth="1.2" opacity="0.45" />
              </svg>

              {/* INTERACTIVE MESH NODES (Matching Screenshot) */}
              {[
                {
                  code: 'ENG-QUAD',
                  name: 'Engineering & CS Quad',
                  threatLevel: 'RED_ALERT',
                  threats: 14,
                  vector: 'Credential Harvester',
                  activity: '3m ago (Fake SSO Wi-Fi Portal)',
                  radius: 150,
                  top: '28%',
                  left: '32%',
                  lat: 15.3225,
                  lng: 74.7552,
                },
                {
                  code: 'ADMIN-BURSAR',
                  name: 'Administration & Bursar Hub',
                  threatLevel: 'RED_ALERT',
                  threats: 19,
                  vector: 'Impersonation Wire Phish',
                  activity: '12m ago (Executive Impersonation)',
                  radius: 120,
                  top: '37%',
                  left: '68%',
                  lat: 15.3228,
                  lng: 74.7548,
                },
                {
                  code: 'LIB-COMMONS',
                  name: 'Main Library Commons',
                  threatLevel: 'ELEVATED',
                  threats: 8,
                  vector: 'Malicious QR Code',
                  activity: '25m ago (Quishing Poster on Notice Board)',
                  radius: 100,
                  top: '50%',
                  left: '48%',
                  lat: 15.3221,
                  lng: 74.7549,
                },
                {
                  code: 'STUDENT-UNION',
                  name: 'Student Life & Dining Hall',
                  threatLevel: 'ELEVATED',
                  threats: 6,
                  vector: 'Phishing SMS',
                  activity: '45m ago (Fake Meal Discount SMS)',
                  radius: 90,
                  top: '60%',
                  left: '25%',
                  lat: 15.3224,
                  lng: 74.7542,
                },
                {
                  code: 'RESIDENCE-HALLS',
                  name: 'Residence Halls & Dorms',
                  threatLevel: 'SECURE',
                  threats: 3,
                  vector: 'Smishing Link',
                  activity: '2h ago (Cleared by Security Patrol)',
                  radius: 200,
                  top: '72%',
                  left: '55%',
                  lat: 15.3212,
                  lng: 74.7538,
                },
                {
                  code: 'SCIENCE-TOWER',
                  name: 'Science & Bio-Research Tower',
                  threatLevel: 'SECURE',
                  threats: 2,
                  vector: 'Reconnaissance Scan',
                  activity: '3h ago (Port Scan Blocked by Firewall)',
                  radius: 110,
                  top: '63%',
                  left: '76%',
                  lat: 15.3232,
                  lng: 74.7555,
                },
              ].map((node) => {
                const isSelected = selectedZone?.code === node.code;
                const distanceToUser = Math.round(
                  turf.distance(
                    turf.point([activePosition.lng, activePosition.lat]),
                    turf.point([node.lng, node.lat]),
                    { units: 'meters' }
                  )
                );
                // User is here if closest building or within 120m
                const isUserHere =
                  nearestBuilding?.code === node.code ||
                  (sim.enabled && sim.activeBuildingName?.includes(node.name.split(' ')[0]));

                return (
                  <div
                    key={node.code}
                    title={`${node.name} • ${distanceToUser}m away`}
                    onClick={() => {
                      setSelectedZone({
                        id: `bldg-${node.code.toLowerCase()}`,
                        name: node.name,
                        code: node.code,
                        category: 'academic',
                        threat_level: node.threatLevel === 'SECURE' ? 'NORMAL' : (node.threatLevel as 'RED_ALERT' | 'ELEVATED'),
                        active_threats: node.threats,
                        reported_incidents_today: 4,
                        radius_meters: node.radius,
                        proximity_alert_active: node.threatLevel === 'RED_ALERT',
                        last_reported_attack: node.activity,
                        top_threat_vector: node.vector,
                        x_percent: 50,
                        y_percent: 50,
                      });
                    }}
                    style={{ top: node.top, left: node.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-200 z-10 hover:scale-105 ${
                      isSelected ? 'scale-105 z-20' : ''
                    }`}
                  >
                    {/* Circular Badge */}
                    <div className="relative mb-1">
                      {isUserHere && (
                        <div className="absolute -inset-2 rounded-full border-2 border-[#315E63] animate-ping opacity-60" />
                      )}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md transition-shadow ${
                          node.threatLevel === 'RED_ALERT'
                            ? 'bg-[#C74747] shadow-[#C74747]/30'
                            : node.threatLevel === 'ELEVATED'
                            ? 'bg-[#D49A58] shadow-[#D49A58]/30'
                            : 'bg-[#27845A] shadow-[#27845A]/30'
                        } ${isUserHere ? 'ring-3 ring-[#315E63] ring-offset-2' : ''}`}
                      >
                        {node.threatLevel === 'RED_ALERT' ? (
                          <AlertTriangle size={18} strokeWidth={2.5} />
                        ) : node.threatLevel === 'ELEVATED' ? (
                          <Radio size={18} strokeWidth={2.5} />
                        ) : (
                          <Shield size={18} strokeWidth={2.5} />
                        )}
                      </div>
                    </div>

                    {/* Floating White Pill Card matching screenshot */}
                    <div
                      className={`bg-white border px-3 py-1.5 rounded-2xl shadow-md flex flex-col items-center whitespace-nowrap transition ${
                        isSelected
                          ? 'border-[#315E63] ring-2 ring-[#315E63]/20'
                          : 'border-[#E5E9ED] hover:border-[#315E63]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#202A35]">{node.name}</span>
                        {isUserHere && (
                          <span className="bg-[#202A35] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium mt-0.5">
                        <span>{node.threats} threats</span>
                        <span>•</span>
                        <span>{node.vector}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Movement Simulator Floating D-Pad Overlay (when sim enabled) */}
              {sim.enabled && (
                <div className="absolute top-3 left-3 z-30 bg-white/95 backdrop-blur-sm border border-[#397C78] p-3 rounded-2xl shadow-lg flex flex-col gap-2 max-w-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#397C78] px-2 py-0.5 rounded">
                      TEST MODE — Movement Simulator
                    </span>
                    <button
                      onClick={resetSimulator}
                      className="p-1 text-[#64748B] hover:text-[#202A35] cursor-pointer"
                      title="Reset position"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                  <div className="text-[11px] font-semibold text-[#202A35]">
                    Building: <strong className="text-[#315E63]">{sim.activeBuildingName}</strong>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono">
                    Traveled: {sim.totalDistanceTraveled} m | Speed: {sim.speedMode === 'walk' ? '1.5 m/s' : '4.0 m/s'}
                  </div>

                  {/* Speed Toggle */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() => setSim((p) => ({ ...p, speedMode: 'walk', stepMeters: 12 }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        sim.speedMode === 'walk' ? 'bg-[#315E63] text-white' : 'bg-[#F0F4F4] text-[#64748B]'
                      }`}
                    >
                      Walk (1.5 m/s)
                    </button>
                    <button
                      onClick={() => setSim((p) => ({ ...p, speedMode: 'sprint', stepMeters: 28 }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        sim.speedMode === 'sprint' ? 'bg-[#315E63] text-white' : 'bg-[#F0F4F4] text-[#64748B]'
                      }`}
                    >
                      Sprint (4.0 m/s)
                    </button>
                  </div>

                  {/* Virtual D-Pad Controls */}
                  <div className="pt-1 flex flex-col items-center">
                    <button
                      onClick={() => handleSimMove('N')}
                      className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs mb-1"
                      title="Move North"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimMove('W')}
                        className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                        title="Move West"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={() => handleSimMove('S')}
                        className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                        title="Move South"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleSimMove('E')}
                        className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                        title="Move East"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Teleport to Buildings */}
                  <div className="pt-1 border-t border-[#E5E9ED] text-[10px] text-[#64748B]">
                    <span>Jump Location:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <button
                        onClick={() => {
                          setSim((p) => ({
                            ...p,
                            lat: 15.3225,
                            lng: 74.7552,
                            activeBuildingName: 'Engineering & CS Quad',
                          }));
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] cursor-pointer"
                      >
                        Eng Quad
                      </button>
                      <button
                        onClick={() => {
                          setSim((p) => ({
                            ...p,
                            lat: 15.3228,
                            lng: 74.7548,
                            activeBuildingName: 'Administration & Bursar Hub',
                          }));
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] cursor-pointer"
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => {
                          setSim((p) => ({
                            ...p,
                            lat: 15.3221,
                            lng: 74.7549,
                            activeBuildingName: 'Main Library Commons',
                          }));
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] cursor-pointer"
                      >
                        Library
                      </button>
                      <button
                        onClick={() => {
                          setSim((p) => ({
                            ...p,
                            lat: 15.3232,
                            lng: 74.7555,
                            activeBuildingName: 'Science & Bio-Research Tower',
                          }));
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] cursor-pointer"
                      >
                        Science
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: GEOGRAPHIC LEAFLET OSM MAP */}
          <div
            className={`relative w-full h-[450px] sm:h-[520px] rounded-2xl overflow-hidden border border-[#E5E9ED] shadow-inner ${
              viewMode === 'gis' ? 'block' : 'hidden'
            }`}
          >
            <div ref={mapElementRef} className="w-full h-full z-10" />

            {/* Simulated Test Mode Watermark / Controls Overlay in GIS view */}
            {sim.enabled && (
              <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm border border-[#397C78] p-3 rounded-2xl shadow-lg flex flex-col gap-2 max-w-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#397C78] px-2 py-0.5 rounded">
                    TEST MODE — Movement Simulator
                  </span>
                  <button
                    onClick={resetSimulator}
                    className="p-1 text-[#64748B] hover:text-[#202A35]"
                    title="Reset position"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                <div className="text-[11px] font-semibold text-[#202A35]">
                  Building: <strong className="text-[#315E63]">{sim.activeBuildingName}</strong>
                </div>
                <div className="text-[10px] text-[#64748B] font-mono">
                  Traveled: {sim.totalDistanceTraveled} m | Lat: {sim.lat.toFixed(5)}
                </div>

                {/* Virtual D-Pad Controls */}
                <div className="pt-2 flex flex-col items-center">
                  <button
                    onClick={() => handleSimMove('N')}
                    className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs mb-1"
                    title="Move North"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSimMove('W')}
                      className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                      title="Move West"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleSimMove('S')}
                      className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                      title="Move South"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleSimMove('E')}
                      className="p-1.5 rounded-lg bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold cursor-pointer shadow-xs"
                      title="Move East"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LOWER ACTION CARD MATCHING EXACT SCREENSHOT */}
          {selectedZone && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-extrabold text-[#202A35]">
                    {selectedZone.name}
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      selectedZone.threat_level === 'RED_ALERT'
                        ? 'bg-[#C74747]/15 text-[#C74747] border border-[#C74747]/30'
                        : selectedZone.threat_level === 'ELEVATED'
                        ? 'bg-[#C58A35]/15 text-[#C58A35] border border-[#C58A35]/30'
                        : 'bg-[#27845A]/15 text-[#27845A] border border-[#27845A]/30'
                    }`}
                  >
                    {selectedZone.threat_level.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] flex items-center gap-2">
                  <span>Recent Activity: {selectedZone.last_reported_attack}</span>
                  <span>•</span>
                  <span>Coverage: {selectedZone.radius_meters}m radius</span>
                </p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => setBroadcastModalOpen(true)}
                  className="px-5 py-2.5 bg-[#C74747] hover:bg-[#b33e3e] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Bell size={15} />
                  <span>Dispatch Alert to {selectedZone.code || 'ZONE'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: CAMPUS INCIDENT RADAR LIST & PROXIMITY TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Facility List with Real Distances */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#E5E9ED] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
              <h3 className="text-xs font-bold text-[#202A35] uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#315E63]" />
                <span>Campus Proximity Directory ({buildingsWithDistances.length} Facilities)</span>
              </h3>
              <span className="text-[11px] text-[#64748B] font-mono">
                Calculated from current position
              </span>
            </div>

            <div className="divide-y divide-[#E5E9ED] max-h-[360px] overflow-y-auto pr-1">
              {buildingsWithDistances.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    const zone = radar?.campus_zones?.find(
                      (z) => z.code === b.code || z.name.toLowerCase().includes(b.name.toLowerCase())
                    );
                    if (zone) setSelectedZone(zone);
                  }}
                  className="py-3 px-2 flex items-center justify-between hover:bg-[#F0F4F4] rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                        b.threatLevel === 'RED_ALERT'
                          ? 'bg-[#C74747]'
                          : b.threatLevel === 'ELEVATED'
                          ? 'bg-[#C58A35]'
                          : 'bg-[#27845A]'
                      }`}
                    >
                      {b.threatLevel === 'RED_ALERT' ? '!' : b.threatLevel === 'ELEVATED' ? '▲' : '✓'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#202A35] flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isWithinRadius && (
                          <span className="text-[9px] bg-[#315E63] text-white px-1.5 py-0.2 rounded font-black">
                            WITHIN PERIMETER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {b.activeThreats} threats • {b.topThreatVector}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#315E63]">
                      {b.distanceMeters} m
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      radius: {b.radius_meters}m
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Real Incident Feed */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#E5E9ED] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
              <h3 className="text-xs font-bold text-[#202A35] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C74747]" />
                <span>Live Reported Threats</span>
              </h3>
              <span className="text-[11px] text-[#27845A] font-semibold">
                Anonymized Zero-PII
              </span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {incidents.length > 0 ? (
                incidents.slice(0, 5).map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="p-3 rounded-2xl border border-[#E5E9ED] hover:border-[#315E63]/40 bg-[#F7F8FA] hover:bg-white transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#202A35] uppercase tracking-wide">
                        {inc.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          inc.severity === 'critical'
                            ? 'bg-[#C74747]/15 text-[#C74747]'
                            : inc.severity === 'high'
                            ? 'bg-[#C58A35]/15 text-[#C58A35]'
                            : 'bg-[#477B9B]/15 text-[#477B9B]'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                      {inc.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E9ED]/60">
                      <span>Status: {inc.status}</span>
                      <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  No active incidents pending triage.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: BROADCAST RED ALERT TO NEARBY PHONES */}
      {broadcastModalOpen && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C74747]/10 flex items-center justify-center text-[#C74747]">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Dispatch Campus Mesh Alert
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Target: {selectedZone.name} ({selectedZone.radius_meters}m)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="text-[#64748B] hover:text-[#202A35]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBroadcastAlert} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#202A35] block mb-1">
                  Threat Category
                </label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] font-semibold"
                >
                  <option value="Phishing Outbreak">Phishing Outbreak</option>
                  <option value="Credential Harvester">Credential Harvester</option>
                  <option value="Malicious QR Code">Malicious QR Code</option>
                  <option value="Impersonation Wire Phish">Impersonation Wire Phish</option>
                  <option value="Rogue Wi-Fi Access Point">Rogue Wi-Fi Access Point</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">
                  Urgent Advisory Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] font-medium resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-[#F0F4F4] text-[11px] text-[#315E63] flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  This broadcast will trigger an audible alert and notification on all student devices within range.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-4 py-2 rounded-xl bg-[#C74747] hover:bg-[#b33e3e] text-white font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>{broadcasting ? 'Broadcasting...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CAMPUS MAPPING PANEL */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#315E63]/10 flex items-center justify-center text-[#315E63]">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Admin Campus Mapping & Geofence Panel
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Configure campus facilities, verified coordinates and boundary radii
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-[#64748B] hover:text-[#202A35]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBuilding} className="space-y-3 text-xs">
              <div className="font-bold text-[#202A35] uppercase text-[11px] tracking-wider text-[#315E63]">
                Register New Facility / Perimeter
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#202A35] block mb-1">Building Name</label>
                  <input
                    type="text"
                    value={newBldgForm.name}
                    onChange={(e) => setNewBldgForm({ ...newBldgForm, name: e.target.value })}
                    placeholder="e.g. Science Annex"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#202A35] block mb-1">Building Code</label>
                  <input
                    type="text"
                    value={newBldgForm.code}
                    onChange={(e) => setNewBldgForm({ ...newBldgForm, code: e.target.value })}
                    placeholder="e.g. SCI-ANNEX"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#202A35] block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newBldgForm.latitude}
                    onChange={(e) => setNewBldgForm({ ...newBldgForm, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#202A35] block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newBldgForm.longitude}
                    onChange={(e) => setNewBldgForm({ ...newBldgForm, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#202A35] block mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    value={newBldgForm.radius_meters}
                    onChange={(e) => setNewBldgForm({ ...newBldgForm, radius_meters: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#315E63] text-white font-bold cursor-pointer hover:bg-[#274c50] transition flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Register Building</span>
                </button>
              </div>
            </form>

            <div className="border-t border-[#E5E9ED] pt-3">
              <div className="font-bold text-[#202A35] text-xs mb-2">
                Currently Mapped Buildings ({buildings.length})
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E9ED] text-xs">
                {buildings.map((b) => (
                  <div key={b.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#202A35]">{b.name}</span>
                      <span className="text-[#64748B] block text-[10px]">
                        {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} • {b.radius_meters}m
                      </span>
                    </div>
                    <span className="text-[10px] text-[#27845A] font-semibold bg-[#27845A]/10 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INCIDENT DETAIL VIEWER */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C74747]/10 flex items-center justify-center text-[#C74747]">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Incident Dossier #{selectedIncident.id.slice(0, 8)}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Category: {selectedIncident.category.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-[#64748B] hover:text-[#202A35]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-[#202A35] block mb-1">Description</span>
                <p className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] text-[#202A35]">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.suspicious_content && (
                <div>
                  <span className="font-bold text-[#202A35] block mb-1">Suspicious Content / Payload</span>
                  <div className="p-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] font-mono text-[11px] text-[#C74747] break-all">
                    {selectedIncident.suspicious_content}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED]">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Severity</span>
                  <span className="font-bold text-[#C74747] capitalize">{selectedIncident.severity}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED]">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Status</span>
                  <span className="font-bold text-[#315E63] capitalize">{selectedIncident.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-[#315E63] text-white font-bold cursor-pointer hover:bg-[#274c50]"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarPage;
