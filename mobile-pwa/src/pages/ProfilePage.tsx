import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Lock,
  LogOut,
  Building,
  Mail,
  CheckCircle2,
  Smartphone,
  Laptop,
  Radio,
  Trash2,
  Plus,
  GitFork,
  Layers,
  MapPin,
  X
} from 'lucide-react';
import Header from '../components/Header';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { DeviceRegistration, InstitutionTree } from '../types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();

  const [scanAlerts, setScanAlerts] = useState(true);
  const [incidentUpdates, setIncidentUpdates] = useState(true);
  const [threatBroadcasts, setThreatBroadcasts] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Device Relay & Hierarchy States
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [hierarchyTree, setHierarchyTree] = useState<InstitutionTree | null>(null);
  const [treeModalOpen, setTreeModalOpen] = useState(false);
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const getPersistentDeviceId = (): string => {
    let id = localStorage.getItem('signalsafe_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('signalsafe_device_id', id);
    }
    return id;
  };

  const fetchRelayData = async () => {
    setLoadingDevices(true);
    try {
      const devList = await api.getUserDevices();
      setDevices(devList);
    } catch (err) {
      console.warn('Devices fetch error:', err);
    }

    try {
      const tree = await api.getInstitutionalHierarchy();
      setHierarchyTree(tree);
    } catch (err) {
      console.warn('Hierarchy tree fetch error:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchRelayData();
  }, []);

  const handleRegisterCurrentDevice = async () => {
    setRegisteringDevice(true);
    setSyncMessage(null);
    try {
      const deviceId = getPersistentDeviceId();
      const userAgent = navigator.userAgent;
      let platform = 'web_pwa';
      if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'ios';
      else if (/Android/i.test(userAgent)) platform = 'android';
      else if (/Macintosh/i.test(userAgent)) platform = 'macos';
      else if (/Windows/i.test(userAgent)) platform = 'windows';

      const registered = await api.registerDevice({
        device_id: deviceId,
        device_name: `${user?.full_name?.split(' ')[0] || 'User'}'s ${platform.toUpperCase()} Terminal`,
        device_platform: platform,
        proximity_zone: 'Engineering & CS Quad (150m Proximity Mesh)',
        push_token: 'web_push_active_sync_' + Math.random().toString(36).substring(2, 8),
      });

      setSyncMessage(`Device '${registered.device_name}' synchronized with proximity mesh!`);
      fetchRelayData();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegisteringDevice(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Revoke this device from emergency relay broadcast mesh?')) return;
    try {
      await api.revokeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AR';

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-100 pb-28">
      <Header
        title="Profile & Settings"
        subtitle="SignalSafe Campus Account & Authenticated Device Relay"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* User Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-teal-500/20 flex-shrink-0">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">
                  {user?.full_name || 'Alex Rivera (Campus Student)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase border border-teal-500/30">
                  {user?.role || 'Student'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                <Mail size={12} className="flex-shrink-0" />
                <span className="truncate">{user?.email || 'student@campus.edu'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700/60">
                  <Building size={11} className="text-teal-400" />
                  {hierarchyTree?.name || 'Apex Institute of Science & Technology'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTreeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <GitFork size={13} />
              <span>Campus Hierarchy</span>
            </button>
          </div>
        </div>

        {/* PART 2: Hierarchical Database Unit Association */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Institutional Hierarchy Association
              </h3>
            </div>
            <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30 font-mono">
              Tenant Isolated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500">Institution</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">
                {hierarchyTree?.name || 'Apex Institute (AIST)'}
              </div>
              <div className="text-[10px] text-teal-400 font-mono mt-0.5">{hierarchyTree?.domain || 'campus.edu'}</div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500">Campus</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">Main University Grounds</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Academic & Research Park</div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500">Department</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">CS & Cybersecurity</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Code: CS-CYBER</div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500">User Group</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">Cyber Defense Responders</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Clearance: ACTIVE</div>
            </div>
          </div>
        </div>

        {/* PART 3: Authenticated Device Relay & Proximity Mesh Management */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-red-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Authenticated Device Relay & Proximity Mesh
                </h3>
                <p className="text-[11px] text-slate-400">
                  Targeted emergency alerts relay directly to verified browser PWA & mobile tokens
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegisterCurrentDevice}
                disabled={registeringDevice}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus size={13} />
                <span>{registeringDevice ? 'Registering...' : 'Register This Device'}</span>
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Device Registrations List */}
          <div className="space-y-2.5">
            {loadingDevices ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading registered mesh nodes...</div>
            ) : devices.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 text-center space-y-2">
                <Smartphone className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No active devices registered in your relay mesh.</p>
                <button
                  onClick={handleRegisterCurrentDevice}
                  className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition"
                >
                  Register Current Terminal
                </button>
              </div>
            ) : (
              devices.map((dev) => {
                const isCurrent = dev.id === localStorage.getItem('signalsafe_device_id');
                const isMobile = dev.device_platform === 'ios' || dev.device_platform === 'android';

                return (
                  <div
                    key={dev.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isCurrent
                        ? 'bg-teal-950/15 border-teal-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                        {isMobile ? <Smartphone size={18} /> : <Laptop size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{dev.device_name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                              Current Device
                            </span>
                          )}
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {dev.device_platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin size={11} className="text-teal-400" />
                            {dev.proximity_zone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Mesh Online
                      </span>
                      <button
                        onClick={() => handleRevokeDevice(dev.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Revoke device"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Notification Preferences */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Bell size={13} className="text-teal-400" />
            Security Notification Channels
          </h3>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">Emergency Campus Red Alerts</p>
                <p className="text-[11px] text-slate-400">Immediate broadcast on rogue APs and zero-day phishing</p>
              </div>
              <input
                type="checkbox"
                checked={threatBroadcasts}
                onChange={(e) => setThreatBroadcasts(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">High-Risk IOC Detections</p>
                <p className="text-[11px] text-slate-400">Alert on malicious URL & QR scan results</p>
              </div>
              <input
                type="checkbox"
                checked={scanAlerts}
                onChange={(e) => setScanAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">Incident Case Milestone Updates</p>
                <p className="text-[11px] text-slate-400">Notify when triage or SOC investigation advances</p>
              </div>
              <input
                type="checkbox"
                checked={incidentUpdates}
                onChange={(e) => setIncidentUpdates(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Trust Principles */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lock size={13} className="text-teal-400" />
            Privacy & Trust Principles
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <span>We scan only links, messages, and QR targets explicitly submitted by you.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <span>Zero background surveillance. No automated browsing of malicious sites.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <span>Passwords are never saved in local storage or unencrypted sessions.</span>
            </div>
          </div>
        </div>

        {/* Application Metadata */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Application</span>
            <span className="text-white font-semibold">SignalSafe Campus PWA</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">App Version</span>
            <span className="text-teal-400 font-mono">v2.0.0 (Enterprise SOC)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Mesh Architecture</span>
            <span className="text-slate-200">Hierarchical Multi-Tier Tree & Proximity Relay</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend Services</span>
            <span className="text-slate-200">FastAPI & Supabase Central Services</span>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
        >
          <LogOut size={16} />
          {signingOut ? 'Signing Out...' : 'Sign Out of SignalSafe'}
        </button>
      </div>

      {/* Campus Hierarchy Tree Modal */}
      {treeModalOpen && hierarchyTree && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GitFork className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Hierarchical Database Organizational Tree</h3>
              </div>
              <button
                onClick={() => setTreeModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Institution Root */}
              <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Root Institution</div>
                <h4 className="text-sm font-bold text-white">{hierarchyTree.name}</h4>
                <div className="text-xs text-slate-400 font-mono">Domain: {hierarchyTree.domain} • Code: {hierarchyTree.code}</div>
              </div>

              {/* Campuses & Departments Tree */}
              {hierarchyTree.campuses.map((camp) => (
                <div key={camp.id} className="ml-4 pl-4 border-l-2 border-slate-800 space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-cyan-400">Campus Branch</div>
                    <div className="text-xs font-bold text-white">{camp.name} ({camp.code})</div>
                    <div className="text-[11px] text-slate-400">{camp.location}</div>
                  </div>

                  {camp.departments.map((dept) => (
                    <div key={dept.id} className="ml-4 pl-4 border-l-2 border-slate-800/80 space-y-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{dept.name}</span>
                          <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">
                            {dept.device_count} Active Devices
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Lead: {dept.head_of_department}</div>
                        {dept.user_groups.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                            {dept.user_groups.map((g) => (
                              <span
                                key={g.id}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
                              >
                                {g.name} ({g.role_type})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTreeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close Tree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
