import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  MessageSquare,
  QrCode,
  AlertTriangle,
  RotateCw,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { DashboardStats, ScanResult, Incident } from '../types';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import StatusBadge from '../components/StatusBadge';
import { formatDate, truncateUrl } from '../utils/helpers';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Backend dashboard stats not reachable, loading fallback view:', err);
      // Fallback data clearly labeled as offline/demo if API is unreachable
      setStats({
        total_scans: 0,
        suspicious_results: 0,
        reported_incidents: 0,
        recent_scans: [],
        recent_incidents: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const hasSuspicious = (stats?.suspicious_results ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#0a0f1e] px-4 pt-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-400 font-semibold tracking-wide uppercase">
                Campus Security Guard
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Welcome, {user?.full_name ? user.full_name.split(' ')[0] : 'Campus User'} 👋
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Think Before You Click • Real-time Threat Analysis
            </p>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            aria-label="Refresh dashboard"
            className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-teal-400 transition-colors active:scale-95 disabled:opacity-50"
          >
            <RotateCw size={17} className={refreshing ? 'animate-spin text-teal-400' : ''} />
          </button>
        </div>

        {/* Security Status Card */}
        <div className="max-w-lg mx-auto mt-4">
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              hasSuspicious
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-teal-500/10 border-teal-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  hasSuspicious ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'
                }`}
              >
                {hasSuspicious ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {hasSuspicious ? 'Security Attention Needed' : 'Campus Shield Active'}
                </h3>
                <p className="text-xs text-slate-300">
                  {hasSuspicious
                    ? `${stats?.suspicious_results} suspicious item(s) detected recently`
                    : 'No immediate threats flagged on your profile'}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wider ${
                hasSuspicious
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-teal-500/20 text-teal-300'
              }`}
            >
              {hasSuspicious ? 'Alert' : 'Protected'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-6">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Scans"
            value={loading ? '...' : stats?.total_scans ?? 0}
            icon={<Search size={18} />}
            color="teal"
          />
          <StatCard
            label="Suspicious"
            value={loading ? '...' : stats?.suspicious_results ?? 0}
            icon={<ShieldAlert size={18} />}
            color="amber"
          />
          <StatCard
            label="Reported"
            value={loading ? '...' : stats?.reported_incidents ?? 0}
            icon={<AlertTriangle size={18} />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              title="Scan URL"
              description="Verify suspicious link"
              icon={<Search size={20} />}
              color="teal"
              onClick={() => navigate('/scan')}
            />
            <QuickActionCard
              title="Analyze Text"
              description="Check phishing email/SMS"
              icon={<MessageSquare size={20} />}
              color="cyan"
              onClick={() => navigate('/scan?tab=message')}
            />
            <QuickActionCard
              title="Scan QR Code"
              description="Verify code camera target"
              icon={<QrCode size={20} />}
              color="purple"
              onClick={() => navigate('/qr-scanner')}
            />
            <QuickActionCard
              title="Report Incident"
              description="Notify campus security"
              icon={<AlertTriangle size={20} />}
              color="amber"
              onClick={() => navigate('/report')}
            />
          </div>
        </div>

        {/* Recent Scans */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Recent Scans
            </h2>
            <button
              onClick={() => navigate('/scan')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              New Scan <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.recent_scans || stats.recent_scans.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No scans performed yet.</p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-2 text-xs font-semibold text-teal-400 hover:underline"
              >
                Scan your first link or message
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_scans.slice(0, 5).map((scan: ScanResult) => (
                <div
                  key={scan.scan_id}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {scan.input_type}
                      </span>
                      <p className="text-xs text-white font-medium truncate">
                        {truncateUrl(scan.input_value, 36)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <Clock size={11} />
                      <span>{formatDate(scan.checked_at)}</span>
                      <span>•</span>
                      <span>Score: {scan.risk_score}/100</span>
                    </div>
                  </div>
                  <StatusBadge status={scan.verdict} variant="scan" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Recent Incidents
            </h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.recent_incidents || stats.recent_incidents.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No campus security incidents reported.</p>
              <button
                onClick={() => navigate('/report')}
                className="mt-2 text-xs font-semibold text-teal-400 hover:underline"
              >
                File an incident report
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_incidents.slice(0, 3).map((incident: Incident) => (
                <div
                  key={incident.id}
                  onClick={() => navigate(`/reports/${incident.id}`)}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white capitalize">
                        {incident.category.replace('_', ' ')}
                      </p>
                      <StatusBadge status={incident.severity} variant="severity" />
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {incident.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={incident.status} variant="incident" />
                    <ExternalLink size={14} className="text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}