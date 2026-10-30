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
  Radio,
  Dna,
  GitFork,
  Award,
  FileSearch,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
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
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setApiError(null);

    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setApiError(null);
    } catch (err: any) {
      console.warn('Backend dashboard stats not reachable:', err);
      setApiError(
        err.message ||
          'Cannot connect to backend server. Ensure the FastAPI service is running on port 8000.'
      );
      setStats(null);
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
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-24">
      {/* Top Header with Desktop Navigation */}
      <Header />

      {/* Top Banner / Welcome */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-b border-[#E5E9ED] shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-[#315E63] font-bold tracking-wide uppercase">
                Campus Security Guard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202A35] mt-1">
              Welcome, {user?.full_name ? user.full_name.split(' ')[0] : 'Campus User'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Monitor threats. Investigate incidents. Protect your campus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Security Status Card */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 flex-1 md:flex-initial min-w-[280px] ${
                hasSuspicious
                  ? 'bg-[#C58A35]/10 border-[#C58A35]/30'
                  : 'bg-[#27845A]/10 border-[#27845A]/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  hasSuspicious ? 'bg-[#C58A35]/20 text-[#C58A35]' : 'bg-[#27845A]/20 text-[#27845A]'
                }`}
              >
                {hasSuspicious ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#202A35] truncate">
                    {hasSuspicious ? 'Attention Needed' : 'Campus Shield Active'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      hasSuspicious
                        ? 'bg-[#C58A35]/20 text-[#C58A35]'
                        : 'bg-[#27845A]/20 text-[#27845A]'
                    }`}
                  >
                    {hasSuspicious ? 'Alert' : 'Protected'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {hasSuspicious
                    ? `${stats?.suspicious_results} suspicious item(s) detected`
                    : 'No immediate threats detected'}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
              aria-label="Refresh dashboard"
              className="w-10 h-10 rounded-xl bg-white border border-[#E5E9ED] flex items-center justify-center text-[#64748B] hover:text-[#315E63] hover:bg-[#F0F4F4] transition-colors active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-xs"
              title="Refresh Stats"
            >
              <RotateCw size={17} className={refreshing ? 'animate-spin text-[#315E63]' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Backend Connection Alert */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-[#C58A35]/10 border border-[#C58A35]/30 text-[#C58A35] text-xs flex items-start gap-3">
            <AlertTriangle size={20} className="text-[#C58A35] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[#202A35]">Backend Server Disconnected</p>
              <p className="mt-0.5 text-[#64748B] leading-relaxed">
                {apiError}
              </p>
              <button
                onClick={() => fetchStats(true)}
                disabled={refreshing}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#C58A35]/15 hover:bg-[#C58A35]/25 text-[#C58A35] font-semibold text-[11px] flex items-center gap-1.5 border border-[#C58A35]/30 transition-colors cursor-pointer"
              >
                <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} />
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Scans"
            value={loading ? '...' : apiError && !stats ? '-' : stats?.total_scans ?? 0}
            icon={<Search size={18} />}
            color="teal"
          />
          <StatCard
            label="Suspicious"
            value={loading ? '...' : apiError && !stats ? '-' : stats?.suspicious_results ?? 0}
            icon={<ShieldAlert size={18} />}
            color="amber"
          />
          <StatCard
            label="Reported"
            value={loading ? '...' : apiError && !stats ? '-' : stats?.reported_incidents ?? 0}
            icon={<AlertTriangle size={18} />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

        {/* Innovation Features & Intelligence Hub */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#315E63]">
              Campus Intelligence Hub
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <div
              onClick={() => navigate('/investigation')}
              className="p-4 rounded-2xl bg-white border border-[#315E63]/30 hover:border-[#315E63] hover:bg-[#F0F4F4] cursor-pointer transition space-y-1.5 shadow-xs col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between">
                <FileSearch className="w-5 h-5 text-[#315E63]" />
                <span className="text-[10px] uppercase font-bold text-white bg-[#315E63] px-1.5 py-0.5 rounded">Core</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#202A35]">Investigation</h3>
              <p className="text-[11px] text-[#64748B]">URL & QR Pipelines, Vault</p>
            </div>

            <div
              onClick={() => navigate('/radar')}
              className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] cursor-pointer transition space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Radio className="w-5 h-5 text-[#315E63]" />
                <span className="text-[10px] uppercase font-bold text-[#315E63] bg-[#315E63]/10 px-1.5 py-0.5 rounded">Live</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#202A35]">Cyber Radar</h3>
              <p className="text-[11px] text-[#64748B]">Campus threat trends & exposure</p>
            </div>

            <div
              onClick={() => navigate('/threat-dna')}
              className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] cursor-pointer transition space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Dna className="w-5 h-5 text-[#397C78]" />
                <span className="text-[10px] uppercase font-bold text-[#397C78] bg-[#397C78]/10 px-1.5 py-0.5 rounded">DNA</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#202A35]">Attack DNA</h3>
              <p className="text-[11px] text-[#64748B]">Campaign group & fingerprinting</p>
            </div>

            <div
              onClick={() => navigate('/trust-graph')}
              className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] cursor-pointer transition space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <GitFork className="w-5 h-5 text-[#315E63]" />
                <span className="text-[10px] uppercase font-bold text-[#315E63] bg-[#315E63]/10 px-1.5 py-0.5 rounded">Auth</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#202A35]">Trust Graph</h3>
              <p className="text-[11px] text-[#64748B]">Official directory & spoof check</p>
            </div>

            <div
              onClick={() => navigate('/coach')}
              className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] cursor-pointer transition space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Award className="w-5 h-5 text-[#C58A35]" />
                <span className="text-[10px] uppercase font-bold text-[#C58A35] bg-[#C58A35]/10 px-1.5 py-0.5 rounded">Coach</span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#202A35]">Safety Coach</h3>
              <p className="text-[11px] text-[#64748B]">Adaptive quizzes & score level</p>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid for Recent Scans & Recent Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Scans */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              Recent Scans
            </h2>
            <button
              onClick={() => navigate('/scan')}
              className="text-xs text-[#315E63] hover:text-[#274B4F] font-semibold flex items-center gap-1 cursor-pointer"
            >
              New Scan <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-white border border-[#E5E9ED] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.recent_scans || stats.recent_scans.length === 0 ? (
            <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] text-center shadow-xs">
              <p className="text-xs text-[#64748B]">No scans performed yet.</p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-2 text-xs font-semibold text-[#315E63] hover:underline cursor-pointer"
              >
                Scan your first link or message
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_scans.slice(0, 5).map((scan: ScanResult) => (
                <div
                  key={scan.scan_id}
                  className="p-3 rounded-xl bg-white border border-[#E5E9ED] flex items-center justify-between gap-3 hover:bg-[#F0F4F4] transition-colors shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F0F4F4] text-[#64748B] border border-[#E5E9ED]">
                        {scan.input_type}
                      </span>
                      <p className="text-xs text-[#202A35] font-semibold truncate">
                        {truncateUrl(scan.input_value, 36)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              Recent Incidents
            </h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-[#315E63] hover:text-[#274B4F] font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 bg-white border border-[#E5E9ED] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !stats?.recent_incidents || stats.recent_incidents.length === 0 ? (
            <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] text-center shadow-xs">
              <p className="text-xs text-[#64748B]">No campus security incidents reported.</p>
              <button
                onClick={() => navigate('/report')}
                className="mt-2 text-xs font-semibold text-[#315E63] hover:underline cursor-pointer"
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
                  className="p-3.5 rounded-xl bg-white border border-[#E5E9ED] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F0F4F4] transition-colors shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#202A35] capitalize">
                        {incident.category.replace('_', ' ')}
                      </p>
                      <StatusBadge status={incident.severity} variant="severity" />
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-1">
                      {incident.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={incident.status} variant="incident" />
                    <ExternalLink size={14} className="text-[#64748B]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
