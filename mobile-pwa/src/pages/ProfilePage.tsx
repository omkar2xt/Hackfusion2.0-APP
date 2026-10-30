import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Lock,
  LogOut,
  Building,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import Header from '../components/Header';
import { useAuthContext } from '../contexts/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();

  const [scanAlerts, setScanAlerts] = useState(true);
  const [incidentUpdates, setIncidentUpdates] = useState(true);
  const [threatBroadcasts, setThreatBroadcasts] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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
    : 'SC';

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-28">
      <Header
        title="Profile & Settings"
        subtitle="SignalSafe Campus Account"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-teal-500/20 flex-shrink-0">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white truncate">
              {user?.full_name || 'SignalSafe Campus User'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
              <Mail size={12} className="flex-shrink-0" />
              <span className="truncate">{user?.email || 'user@campus.edu'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-semibold uppercase">
                {user?.role || 'Student / Staff'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium flex items-center gap-1">
                <Building size={10} />
                {user?.campus || 'University Campus'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Notification Preferences */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Bell size={13} className="text-teal-400" />
            Security Notifications
          </h3>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">High-Risk Threat Alerts</p>
                <p className="text-[11px] text-slate-400">Alert on malicious URL/QR detections</p>
              </div>
              <input
                type="checkbox"
                checked={scanAlerts}
                onChange={(e) => setScanAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">Incident Status Updates</p>
                <p className="text-[11px] text-slate-400">Notify when triage or investigation advances</p>
              </div>
              <input
                type="checkbox"
                checked={incidentUpdates}
                onChange={(e) => setIncidentUpdates(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 cursor-pointer">
              <div>
                <p className="text-xs font-medium text-white">Campus Security Broadcasts</p>
                <p className="text-[11px] text-slate-400">Urgent campus-wide phishing campaigns</p>
              </div>
              <input
                type="checkbox"
                checked={threatBroadcasts}
                onChange={(e) => setThreatBroadcasts(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 accent-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Governance */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
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

        {/* App Info */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Application</span>
            <span className="text-white font-semibold">SignalSafe Campus PWA</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">App Version</span>
            <span className="text-teal-400 font-mono">v1.0.0 (Production)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Developer Role</span>
            <span className="text-slate-200">Developer 4 (Mobile App & PWA)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Backend Integration</span>
            <span className="text-slate-200">FastAPI & Supabase Central Services</span>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          <LogOut size={16} />
          {signingOut ? 'Signing Out...' : 'Sign Out of SignalSafe'}
        </button>
      </div>
    </div>
  );
}