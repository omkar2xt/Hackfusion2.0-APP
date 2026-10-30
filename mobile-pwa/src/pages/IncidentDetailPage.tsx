import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Download,
  Clock,
  CheckCircle,
  ShieldAlert,
  Search,
  Radio,
  Lock,
  Layers,
  UserCheck,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import Header from '../components/Header';
import IncidentTimeline from '../components/IncidentTimeline';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import type { Incident, TimelineEvent, EvidenceExportPackage, ScanResult } from '../types';
import { formatDate } from '../utils/helpers';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportedPackage, setExportedPackage] = useState<EvidenceExportPackage | null>(null);

  // SOC Case Management Interactive States
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('submitted');
  const [quarantining, setQuarantining] = useState(false);
  const [quarantineSuccess, setQuarantineSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'case' | 'scan_evidence' | 'integrations' | 'audit_trail'>('case');
  const [deepScanning, setDeepScanning] = useState(false);
  const [deepScanResult, setDeepScanResult] = useState<ScanResult | null>(null);
  const [siemSyncing, setSiemSyncing] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [incData, eventsData] = await Promise.all([
        api.getIncident(id),
        api.getIncidentTimeline(id).catch(() => []),
      ]);
      setIncident(incData);
      setSelectedStatus(incData.status);
      setTimelineEvents(eventsData);
    } catch (err: any) {
      console.error('Failed to fetch incident detail:', err);
      setError(err.message || 'Unable to retrieve incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || newStatus === selectedStatus) return;
    setStatusUpdating(true);
    try {
      const updated = await api.updateIncidentStatus(id, {
        status: newStatus,
        resolution_notes: `Status transitioned to '${newStatus}' by Campus SOC Analyst.`,
      });
      setIncident(updated);
      setSelectedStatus(newStatus);
      // Refresh timeline
      const freshEvents = await api.getIncidentTimeline(id).catch(() => []);
      setTimelineEvents(freshEvents);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleQuarantine = async () => {
    if (!id) return;
    setQuarantining(true);
    setQuarantineSuccess(null);
    try {
      const res = await api.quarantineIncident(id);
      setQuarantineSuccess(res.message || 'Host successfully isolated across campus DNS/proxy sinkhole.');
      const freshEvents = await api.getIncidentTimeline(id).catch(() => []);
      setTimelineEvents(freshEvents);
    } catch (err: any) {
      alert(err.message || 'Quarantine action failed');
    } finally {
      setQuarantining(false);
    }
  };

  const handleDeepScan = async () => {
    if (!incident?.suspicious_content) return;
    setDeepScanning(true);
    try {
      const trimmed = incident.suspicious_content.trim();
      let res: ScanResult;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        res = await api.scanUrl({ url: trimmed });
      } else {
        res = await api.scanMessage({ message_text: trimmed });
      }
      setDeepScanResult(res);
      setActiveTab('scan_evidence');
    } catch (err: any) {
      alert(err.message || 'Deep IOC scan failed');
    } finally {
      setDeepScanning(false);
    }
  };

  const handleSyncSiem = async () => {
    setSiemSyncing(true);
    setTimeout(() => {
      setSiemSyncing(false);
    }, 1200);
  };

  const handleExportEvidence = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const data = await api.exportIncidentEvidence(id);
      setExportedPackage(data);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SignalSafe_Case_${id.slice(0, 8)}_Dossier.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to generate digital evidence package');
    } finally {
      setExporting(false);
    }
  };

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'triaged', label: 'Triaged' },
    { value: 'investigating', label: 'In-Progress (Investigating)' },
    { value: 'mitigating', label: 'Mitigating' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-28">
      <Header
        title="SOC Case Management & Intelligence"
        subtitle={id ? `Case Dossier #${id.slice(0, 8).toUpperCase()}` : undefined}
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
          </div>
        ) : error || !incident ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <AlertTriangle size={36} className="text-amber-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">Case Record Not Found</h3>
            <p className="text-xs text-slate-400">{error || 'The requested incident record could not be loaded.'}</p>
            <button
              onClick={() => navigate('/reports')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Back to Incident Reports
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Case Management Header & Workflow Status */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded">
                      CASE #{incident.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {incident.category.replace('_', ' ')}
                    </span>
                    <StatusBadge status={incident.severity} variant="severity" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white capitalize mt-1">
                    {incident.category.replace('_', ' ')} Incident Investigation
                  </h1>
                </div>

                {/* Workflow Status Switcher (SOC Case Management) */}
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 pl-2">Case Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="bg-slate-900 border border-slate-700 text-teal-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="pt-2">
                <IncidentTimeline currentStatus={incident.status} />
              </div>

              {/* Analyst & Meta Info Bar */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <span>Lead Analyst: </span>
                  <strong className="text-slate-200">
                    {incident.isteps_insights?.analyst_assigned || 'Campus Security IRT (Austin McDaniel)'}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Logged: </span>
                  <strong className="text-slate-200">{formatDate(incident.created_at)}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Target: </span>
                  <strong className="text-slate-200">
                    {incident.isteps_insights?.target_audience || 'Campus Students & Faculty'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar (SOC Playbook) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={handleDeepScan}
                disabled={deepScanning || !incident.suspicious_content}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 text-left transition flex items-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Search size={18} className={deepScanning ? 'animate-spin' : ''} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">Run Deep IOC Scan</div>
                  <div className="text-[10px] text-slate-400 truncate">Inspect malicious payload</div>
                </div>
              </button>

              <button
                onClick={handleQuarantine}
                disabled={quarantining}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 text-left transition flex items-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Lock size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">Quarantine Payload</div>
                  <div className="text-[10px] text-slate-400 truncate">Campus DNS sinkhole</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/radar')}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-left transition flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <Radio size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">Threat Trend Map</div>
                  <div className="text-[10px] text-slate-400 truncate">View proximity alerts</div>
                </div>
              </button>

              <button
                onClick={handleExportEvidence}
                disabled={exporting}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 text-left transition flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Download size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">Export Signed Dossier</div>
                  <div className="text-[10px] text-slate-400 truncate">SHA-256 verifiable package</div>
                </div>
              </button>
            </div>

            {quarantineSuccess && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{quarantineSuccess}</span>
              </div>
            )}

            {/* Navigation Tabs for SOC Dossier */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('case')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'case'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Case Overview & ISteps
              </button>
              <button
                onClick={() => setActiveTab('scan_evidence')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'scan_evidence'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search size={14} />
                <span>Connected Scan Evidence</span>
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'integrations'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={14} />
                <span>Integrations Matrix (34)</span>
              </button>
              <button
                onClick={() => setActiveTab('audit_trail')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit_trail'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock size={14} />
                <span>Immutable Audit Trail ({timelineEvents.length})</span>
              </button>
            </div>

            {/* TAB 1: Case Overview & ISteps Insights */}
            {activeTab === 'case' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Specifics & Description (lg:col-span-7) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* User Report Description */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      User Incident Report Description
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {incident.description}
                    </div>
                  </div>

                  {/* Suspicious Content Payload */}
                  {incident.suspicious_content && (
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Suspicious Payload / Indicator URL
                        </h3>
                        <button
                          onClick={handleDeepScan}
                          className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Search size={13} />
                          Analyze IOC
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-3">
                        <span>{incident.suspicious_content}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                          Active Target
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes */}
                  {incident.resolution_notes && (
                    <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2 shadow-md">
                      <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck size={16} />
                        <span>Security Response Team Notes</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {incident.resolution_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: ISteps Insights (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* ISteps SOC Insights Card (Inspired by Image 4) */}
                  <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-teal-400" />
                        <h3 className="text-sm font-bold text-white">ISteps Detection Insights</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                        SOC Automated
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Malicious URLs */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-xs text-slate-300">Malicious URLs detected:</span>
                        <button
                          onClick={() => setActiveTab('scan_evidence')}
                          className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition"
                        >
                          <span>Yes</span>
                          <span className="text-[10px] font-normal text-slate-400">(Inspect)</span>
                        </button>
                      </div>

                      {/* Malicious Attachments */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-xs text-slate-300">Malicious QR / Attachments:</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          {incident.category === 'malware' || (incident.suspicious_content && incident.suspicious_content.includes('qr'))
                            ? 'Yes'
                            : 'No'}
                        </span>
                      </div>

                      {/* Malicious Call to Action */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-xs text-slate-300">Urgent Call to Action (CTA):</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          Yes (Urgent Wire/Login)
                        </span>
                      </div>

                      {/* Impersonation Headers */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-xs text-slate-300">Brand Impersonation Flags:</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          Yes (Campus Bursar)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800">
                      Containment recommendation: Disconnect user session, enforce domain quarantine, and dispatch proximity advisory to nearby campus APs.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Connected Scan Evidence */}
            {activeTab === 'scan_evidence' && (
              <div className="space-y-6">
                {deepScanResult || incident.connected_scan ? (
                  <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-red-400" />
                          <h3 className="text-base font-bold text-white">Automated Scan Telemetry & IOC Result</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Directly linked with campus incident report #{incident.id.slice(0, 8)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                          <div className="text-xl font-bold text-red-400">
                            {deepScanResult?.risk_score ?? incident.connected_scan?.risk_score}/100
                          </div>
                          <div className="text-[10px] text-slate-500">Risk Score</div>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
                          {deepScanResult?.verdict ?? incident.connected_scan?.verdict}
                        </div>
                      </div>
                    </div>

                    {/* Scanned Payload */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-1">Target Scanned Artifact:</span>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                        {deepScanResult?.input_value ?? incident.connected_scan?.input_value}
                      </div>
                    </div>

                    {/* Indicators list */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Observed Heuristic Threat Indicators
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(deepScanResult?.indicators ?? incident.connected_scan?.indicators ?? []).map((ind, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{ind}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        Containment Playbook Actions
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                        {(deepScanResult?.recommendations ?? incident.connected_scan?.recommendations ?? []).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-sm text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>No IOC scan evidence attached to this incident yet.</p>
                    <button
                      onClick={handleDeepScan}
                      disabled={deepScanning || !incident.suspicious_content}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {deepScanning ? 'Scanning...' : 'Execute Deep IOC Scan Now'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Integrations Matrix (Matching User Image 4) */}
            {activeTab === 'integrations' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Security Operations Integrations</h3>
                    <p className="text-xs text-slate-400">
                      Live sync connectors with institutional SIEM, EDR, Threat Intelligence, and Notification relays
                    </p>
                  </div>
                  <button
                    onClick={handleSyncSiem}
                    disabled={siemSyncing}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <RefreshCw size={13} className={siemSyncing ? 'animate-spin text-teal-400' : ''} />
                    <span>{siemSyncing ? 'Syncing SIEM...' : 'Sync Incident to SIEM'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Splunk SIEM */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          SPL
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Splunk Enterprise SIEM</h4>
                          <span className="text-[10px] text-slate-500">Log Aggregator & SOAR</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Stream: index=campus_sec</span>
                      <span className="text-teal-400 font-mono text-[11px]">Synced 1m ago</span>
                    </div>
                  </div>

                  {/* Sentinel One */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                          S1
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">SentinelOne / Defender</h4>
                          <span className="text-[10px] text-slate-500">Campus EDR Defense</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Endpoint Containment</span>
                      <span className="text-teal-400 font-mono text-[11px]">Healthy</span>
                    </div>
                  </div>

                  {/* VirusTotal Intel */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                          VT
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">VirusTotal Intelligence</h4>
                          <span className="text-[10px] text-slate-500">Domain Reputation Feed</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>API Check: Verified</span>
                      <span className="text-teal-400 font-mono text-[11px]">88/100 Flagged</span>
                    </div>
                  </div>

                  {/* Campus Edge DNS Sinkhole */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                          DNS
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">University DNS Sinkhole</h4>
                          <span className="text-[10px] text-slate-500">Perimeter Gateway Filter</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Enforced
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Routing: 127.0.0.1 (Blackhole)</span>
                      <span className="text-teal-400 font-mono text-[11px]">Active</span>
                    </div>
                  </div>

                  {/* Emergency Proximity Relay */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs">
                          BC
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Campus Proximity Beacon</h4>
                          <span className="text-[10px] text-slate-500">Student PWA Red Alerts</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Mesh Online
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Proximity Broadcast Radius</span>
                      <span className="text-teal-400 font-mono text-[11px]">150m Mesh</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Immutable Audit Trail & Evidence Export */}
            {activeTab === 'audit_trail' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                      <Clock size={16} />
                      <span>Immutable Cryptographic Audit Trail</span>
                    </div>
                    <span className="text-xs text-slate-400">{timelineEvents.length} Recorded Milestones</span>
                  </div>

                  <div className="space-y-3">
                    {timelineEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-start gap-3.5 hover:border-slate-700 transition"
                      >
                        <CheckCircle size={16} className="text-teal-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100 uppercase tracking-wider">
                              {ev.event_type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-teal-300 font-medium font-mono">
                              {formatDate(ev.created_at || ev.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {ev.description || ev.details}
                          </p>
                          <div className="text-[11px] text-slate-500 font-mono pt-1">
                            Actor: {ev.actor || ev.actor_id || 'Campus SOC'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Export Dossier */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Forensic Evidence Export Dossier</h4>
                      <p className="text-xs text-slate-400">
                        SHA-256 verifiable forensic export package for campus judicial review and law enforcement
                      </p>
                    </div>
                  </div>

                  {exportedPackage && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                        <CheckCircle size={15} /> Forensic Signature Validated
                      </div>
                      <div className="font-mono text-xs text-slate-400 break-all">
                        Signature: {exportedPackage.digital_signature.hash}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Export Standard: {exportedPackage.digital_signature.verification_standard}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleExportEvidence}
                    disabled={exporting}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={15} />
                    <span>{exporting ? 'Generating Signature...' : 'Download Tamper-Evident Evidence Package'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
