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
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28">
      <Header
        title="Profile & Settings"
        subtitle="YODHRA Campus Account & Authenticated Device Relay"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* User Card */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#315E63] flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#202A35] truncate">
                  {user?.full_name || 'Alex Rivera (Campus Student)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#F0F4F4] text-[#315E63] text-[10px] font-bold uppercase border border-[#E5E9ED]">
                  {user?.role || 'Student'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5 truncate">
                <Mail size={12} className="flex-shrink-0" />
                <span className="truncate">{user?.email || 'student@campus.edu'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-[#F7F8FA] text-[#202A35] text-[11px] font-medium flex items-center gap-1 border border-[#E5E9ED]">
                  <Building size={11} className="text-[#315E63]" />
                  {hierarchyTree?.name || 'Apex Institute of Science & Technology'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTreeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#315E63] text-xs font-semibold flex items-center gap-1.5 border border-[#E5E9ED] transition cursor-pointer"
            >
              <GitFork size={13} />
              <span>Campus Hierarchy</span>
            </button>
          </div>
        </div>

        {/* PART 2: Hierarchical Database Unit Association */}
        <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#315E63]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Institutional Hierarchy Association
              </h3>
            </div>
            <span className="text-[10px] text-[#315E63] bg-[#F0F4F4] px-2 py-0.5 rounded-full border border-[#E5E9ED] font-mono font-bold">
              Tenant Isolated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
              <div className="text-[10px] uppercase font-bold text-[#64748B]">Institution</div>
              <div className="text-xs font-bold text-[#202A35] mt-0.5 truncate">
                {hierarchyTree?.name || 'Apex Institute (AIST)'}
              </div>
              <div className="text-[10px] text-[#315E63] font-mono mt-0.5">{hierarchyTree?.domain || 'campus.edu'}</div>
            </div>

            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
              <div className="text-[10px] uppercase font-bold text-[#64748B]">Campus</div>
              <div className="text-xs font-bold text-[#202A35] mt-0.5 truncate">Main University Grounds</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Academic & Research Park</div>
            </div>

            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
              <div className="text-[10px] uppercase font-bold text-[#64748B]">Department</div>
              <div className="text-xs font-bold text-[#202A35] mt-0.5 truncate">CS & Cybersecurity</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Code: CS-CYBER</div>
            </div>

            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
              <div className="text-[10px] uppercase font-bold text-[#64748B]">User Group</div>
              <div className="text-xs font-bold text-[#202A35] mt-0.5 truncate">Cyber Defense Responders</div>
              <div className="text-[10px] text-[#27845A] font-mono font-bold mt-0.5">Clearance: ACTIVE</div>
            </div>
          </div>
        </div>

        {/* PART 3: Authenticated Device Relay & Proximity Mesh Management */}
        <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E9ED]">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-[#C74747] animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#202A35]">
                  Authenticated Device Relay & Proximity Mesh
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Targeted emergency alerts relay directly to verified browser PWA & mobile tokens
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegisterCurrentDevice}
                disabled={registeringDevice}
                className="px-3 py-1.5 rounded-xl bg-[#315E63] hover:bg-[#397C78] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Plus size={13} />
                <span>{registeringDevice ? 'Registering...' : 'Register This Device'}</span>
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-[#27845A]/10 border border-[#27845A]/30 text-[#27845A] text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#27845A] shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Device Registrations List */}
          <div className="space-y-2.5">
            {loadingDevices ? (
              <div className="p-6 text-center text-xs text-[#64748B]">Loading registered mesh nodes...</div>
            ) : devices.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] text-center space-y-2">
                <Smartphone className="w-8 h-8 text-[#64748B] mx-auto" />
                <p className="text-xs text-[#64748B]">No active devices registered in your relay mesh.</p>
                <button
                  onClick={handleRegisterCurrentDevice}
                  className="px-4 py-1.5 rounded-lg bg-[#315E63] text-white text-xs font-bold hover:bg-[#397C78] transition cursor-pointer"
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
                        ? 'bg-[#F0F4F4] border-[#315E63]/40 shadow-sm'
                        : 'bg-[#F7F8FA] border-[#E5E9ED] hover:border-[#315E63]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E9ED] flex items-center justify-center text-[#315E63] shrink-0">
                        {isMobile ? <Smartphone size={18} /> : <Laptop size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#202A35] truncate">{dev.device_name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#315E63]/15 text-[#315E63] border border-[#315E63]/30 uppercase">
                              Current Device
                            </span>
                          )}
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white text-[#64748B] font-mono border border-[#E5E9ED]">
                            {dev.device_platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                          <span className="flex items-center gap-1 text-[#202A35]">
                            <MapPin size={11} className="text-[#315E63]" />
                            {dev.proximity_zone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="flex items-center gap-1 text-[10px] text-[#27845A] bg-[#27845A]/10 px-2 py-0.5 rounded-full border border-[#27845A]/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27845A] animate-ping" /> Mesh Online
                      </span>
                      <button
                        onClick={() => handleRevokeDevice(dev.id)}
                        className="p-1.5 text-[#64748B] hover:text-[#C74747] hover:bg-[#C74747]/10 rounded-lg transition cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Bell size={13} className="text-[#315E63]" />
            Security Notification Channels
          </h3>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] cursor-pointer">
              <div>
                <p className="text-xs font-medium text-[#202A35]">Emergency Campus Red Alerts</p>
                <p className="text-[11px] text-[#64748B]">Immediate broadcast on rogue APs and zero-day phishing</p>
              </div>
              <input
                type="checkbox"
                checked={threatBroadcasts}
                onChange={(e) => setThreatBroadcasts(e.target.checked)}
                className="w-4 h-4 rounded text-[#315E63] accent-[#315E63]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] cursor-pointer">
              <div>
                <p className="text-xs font-medium text-[#202A35]">High-Risk IOC Detections</p>
                <p className="text-[11px] text-[#64748B]">Alert on malicious URL & QR scan results</p>
              </div>
              <input
                type="checkbox"
                checked={scanAlerts}
                onChange={(e) => setScanAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#315E63] accent-[#315E63]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] cursor-pointer">
              <div>
                <p className="text-xs font-medium text-[#202A35]">Incident Case Milestone Updates</p>
                <p className="text-[11px] text-[#64748B]">Notify when triage or SOC investigation advances</p>
              </div>
              <input
                type="checkbox"
                checked={incidentUpdates}
                onChange={(e) => setIncidentUpdates(e.target.checked)}
                className="w-4 h-4 rounded text-[#315E63] accent-[#315E63]"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Trust Principles */}
        <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Lock size={13} className="text-[#315E63]" />
            Privacy & Trust Principles
          </h3>

          <div className="space-y-2 text-xs text-[#64748B]">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-[#27845A] mt-0.5 flex-shrink-0" />
              <span>We scan only links, messages, and QR targets explicitly submitted by you.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-[#27845A] mt-0.5 flex-shrink-0" />
              <span>Zero background surveillance. No automated browsing of malicious sites.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-[#27845A] mt-0.5 flex-shrink-0" />
              <span>Passwords are never saved in local storage or unencrypted sessions.</span>
            </div>
          </div>
        </div>

        {/* Application Metadata */}
        <div className="bg-white rounded-2xl border border-[#E5E9ED] p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Application</span>
            <span className="text-[#202A35] font-semibold">YODHRA Campus PWA</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">App Version</span>
            <span className="text-[#315E63] font-mono font-bold">v2.0.0 (Enterprise SOC)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Mesh Architecture</span>
            <span className="text-[#202A35]">Hierarchical Multi-Tier Tree & Proximity Relay</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Backend Services</span>
            <span className="text-[#202A35]">FastAPI & SQLite Central Services</span>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3.5 bg-[#C74747]/10 hover:bg-[#C74747]/20 border border-[#C74747]/30 text-[#C74747] font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
        >
          <LogOut size={16} />
          {signingOut ? 'Signing Out...' : 'Sign Out of YODHRA'}
        </button>
      </div>

      {/* Campus Hierarchy Tree Modal */}
      {treeModalOpen && hierarchyTree && (
        <div className="fixed inset-0 z-50 bg-[#202A35]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-[#E5E9ED] rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
              <div className="flex items-center gap-2.5">
                <GitFork className="w-5 h-5 text-[#315E63]" />
                <h3 className="text-base font-bold text-[#202A35]">Hierarchical Database Organizational Tree</h3>
              </div>
              <button
                onClick={() => setTreeModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#F0F4F4] text-[#64748B] hover:text-[#202A35] flex items-center justify-center cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Institution Root */}
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#315E63]/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#315E63] tracking-wider">Root Institution</div>
                <h4 className="text-sm font-bold text-[#202A35]">{hierarchyTree.name}</h4>
                <div className="text-xs text-[#64748B] font-mono">Domain: {hierarchyTree.domain} • Code: {hierarchyTree.code}</div>
              </div>

              {/* Campuses & Departments Tree */}
              {hierarchyTree.campuses.map((camp) => (
                <div key={camp.id} className="ml-4 pl-4 border-l-2 border-[#E5E9ED] space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED]">
                    <div className="text-[10px] uppercase font-bold text-[#477B9B]">Campus Branch</div>
                    <div className="text-xs font-bold text-[#202A35]">{camp.name} ({camp.code})</div>
                    <div className="text-[11px] text-[#64748B]">{camp.location}</div>
                  </div>

                  {camp.departments.map((dept) => (
                    <div key={dept.id} className="ml-4 pl-4 border-l-2 border-[#E5E9ED] space-y-2">
                      <div className="p-3 rounded-xl bg-white border border-[#E5E9ED] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#202A35]">{dept.name}</span>
                          <span className="text-[10px] text-[#315E63] bg-[#F0F4F4] px-2 py-0.5 rounded font-mono font-bold">
                            {dept.device_count} Active Devices
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-1">Lead: {dept.head_of_department}</div>
                        {dept.user_groups.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#E5E9ED] flex flex-wrap gap-1.5">
                            {dept.user_groups.map((g) => (
                              <span
                                key={g.id}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#F0F4F4] text-[#202A35] border border-[#E5E9ED]"
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
                className="px-5 py-2.5 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] text-xs font-bold cursor-pointer border border-[#E5E9ED]"
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
