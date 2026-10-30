import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
  Wifi,
  WifiOff,
  Database,
  Lock,
  DollarSign,
  Server,
  CloudOff,
  FileSpreadsheet,
  RefreshCw,
  QrCode,
  Mail,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import { useIncidents } from '../hooks/useIncidents';
import {
  saveOfflineIncident,
  getOfflineIncidents,
  syncOfflineIncidents,
  removeOfflineIncident,
} from '../utils/offlineQueue';
import type { IncidentCategory, OfflineIncidentDraft } from '../types';

interface LocationState {
  category?: IncidentCategory;
  suspiciousContent?: string;
  description?: string;
}

interface IncidentNatureOption {
  category: IncidentCategory;
  title: string;
  description: string;
  icon: any;
  defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
}

const INCIDENT_NATURES: IncidentNatureOption[] = [
  {
    category: 'other',
    title: 'Theft of funds',
    description:
      'Money has been transferred to a fraudulent account. i.e. You think a hacker tricked you into paying a fake invoice or changed payment details in an email.',
    icon: DollarSign,
    defaultSeverity: 'high',
  },
  {
    category: 'malware',
    title: 'Ransomware',
    description:
      'Your systems or files have been locked or frozen and you cannot access them. The attacker may have left a ransom note demanding money to unlock them.',
    icon: Lock,
    defaultSeverity: 'critical',
  },
  {
    category: 'data_breach',
    title: 'Data breach',
    description:
      'Private or sensitive information has been stolen or accidentally shared. This could include student details, payment information, or employee records.',
    icon: FileSpreadsheet,
    defaultSeverity: 'high',
  },
  {
    category: 'unauthorized_access',
    title: 'Denial of service',
    description:
      'Your website or online services have been put offline - due to an attacker flooding your systems and causing campus service disruption.',
    icon: Server,
    defaultSeverity: 'high',
  },
  {
    category: 'unauthorized_access',
    title: 'System Outage',
    description:
      'Your computer systems have gone down, and you cannot deliver key services. This might be due to connection problems or compromised equipment.',
    icon: CloudOff,
    defaultSeverity: 'medium',
  },
  {
    category: 'phishing',
    title: 'Phishing & Credential Harvest',
    description:
      'Fake campus login pages, urgent password expiry warnings, or deceptive emails attempting to steal university SSO credentials.',
    icon: Mail,
    defaultSeverity: 'high',
  },
  {
    category: 'malware',
    title: 'Malicious Noticeboard QR (Quishing)',
    description:
      'Tampered physical QR stickers pasted over cafeteria posters, study carrels, or campus bulletin boards leading to untrusted destinations.',
    icon: QrCode,
    defaultSeverity: 'high',
  },
];

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};

  // Form State
  const [selectedNature, setSelectedNature] = useState<IncidentNatureOption>(
    INCIDENT_NATURES.find((n) => n.category === state.category) || INCIDENT_NATURES[5]
  );
  const [step, setStep] = useState<'nature' | 'details'>('nature');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>(selectedNature.defaultSeverity);
  const [description, setDescription] = useState(state.description || '');
  const [suspiciousContent, setSuspiciousContent] = useState(state.suspiciousContent || '');
  const [department, setDepartment] = useState('General Campus');
  const [consentStorage, setConsentStorage] = useState(true);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  // Offline-First Mesh State (Innovation 5)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineIncidentDraft[]>([]);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { createIncident, loading, error } = useIncidents();

  const refreshPendingDrafts = () => {
    setPendingDrafts(getOfflineIncidents());
  };

  useEffect(() => {
    refreshPendingDrafts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const actuallyOnline = isOnline && !simulatedOffline;

  const handleSelectNature = (nature: IncidentNatureOption) => {
    setSelectedNature(nature);
    setSeverity(nature.defaultSeverity);
    setStep('details');
  };

  const handleManualSync = async () => {
    setSyncingQueue(true);
    setSyncMessage(null);
    try {
      const res = await syncOfflineIncidents();
      refreshPendingDrafts();
      setSyncMessage(`Successfully synced ${res.synced} report(s) to campus security triage queue.`);
    } catch (err: any) {
      setSyncMessage('Failed to complete queue sync: ' + (err.message || 'Network unreachable'));
    } finally {
      setSyncingQueue(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const descTrimmed = description.trim();
    if (!descTrimmed) {
      setValidationError('Please describe what happened in detail.');
      return;
    }
    if (descTrimmed.length < 15) {
      setValidationError('Description must be at least 15 characters to assist incident responders.');
      return;
    }

    if (!actuallyOnline) {
      // Innovation 5: Offline-First Storage with Explicit Consent
      if (!consentStorage) {
        setValidationError('You must consent to secure encrypted local storage while offline.');
        return;
      }

      const draft = saveOfflineIncident({
        category: selectedNature.category,
        severity,
        description: `[${selectedNature.title}] ${descTrimmed}`,
        suspicious_content: suspiciousContent.trim() || undefined,
      });

      setIsSavedOffline(true);
      setSubmittedId(draft.local_id);
      refreshPendingDrafts();
      return;
    }

    try {
      const created = await createIncident({
        category: selectedNature.category,
        severity,
        description: `[${selectedNature.title}] ${descTrimmed}`,
        suspicious_content: suspiciousContent.trim() || undefined,
      });

      setIsSavedOffline(false);
      setSubmittedId(created.id);
    } catch (err: any) {
      console.warn('Network submission failed, routing to offline storage queue:', err);
      // Graceful offline fallback
      const draft = saveOfflineIncident({
        category: selectedNature.category,
        severity,
        description: `[${selectedNature.title}] ${descTrimmed}`,
        suspicious_content: suspiciousContent.trim() || undefined,
      });

      setIsSavedOffline(true);
      setSubmittedId(draft.local_id);
      refreshPendingDrafts();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-28">
      <Header
        title="Report a Cyber Incident"
        subtitle="Innovation 5: Offline-first encrypted dispatch & incident triage"
        showBack
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Offline / Online Network Connectivity Banner (Innovation 5) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                actuallyOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
              }`}
            >
              {actuallyOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {actuallyOnline ? 'Live Network Connected' : 'Offline Cyber Safety Mode Active'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    actuallyOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {actuallyOnline
                  ? 'Reports dispatch directly to campus security triage in real time.'
                  : 'Reports are encrypted in secure browser sandbox and auto-synced upon reconnect.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer border border-slate-700"
            >
              {simulatedOffline ? 'Resume Online Mode' : 'Test Offline Mode'}
            </button>

            {pendingDrafts.length > 0 && (
              <button
                onClick={handleManualSync}
                disabled={syncingQueue || !actuallyOnline}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={syncingQueue ? 'animate-spin' : ''} />
                <span>Sync Queue ({pendingDrafts.length})</span>
              </button>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-2xl flex items-center gap-2 text-xs text-teal-300">
            <CheckCircle2 size={16} className="text-teal-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {submittedId ? (
          /* Submission Confirmation Screen */
          <div className="bg-slate-900/90 rounded-3xl border border-teal-500/40 p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center border border-teal-500/30">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                {isSavedOffline ? 'Report Saved Securely in Offline Sandbox' : 'Incident Dispatched to Campus Triage'}
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {isSavedOffline
                  ? 'Your device is currently offline. Your report has been cryptographically signed and queued in local storage. It will be dispatched automatically once connectivity returns.'
                  : 'Your report has been logged in the central campus security repository and assigned a response tracking reference.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 max-w-sm mx-auto">
              Tracking Ref: {submittedId}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
              <button
                onClick={() => navigate('/reports')}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <FileText size={15} />
                <span>View Incident in Dossier</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedId(null);
                  setDescription('');
                  setSuspiciousContent('');
                  setStep('nature');
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                File Another Incident
              </button>
            </div>
          </div>
        ) : step === 'nature' ? (
          /* STEP 1: Select Nature of Incident (Matching Reference Screenshot 2) */
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Step 1 of 2</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                What is the nature of your incident?
              </h2>
              <p className="text-xs text-slate-400">
                Choose the category that best matches what occurred. This helps campus security prioritize immediate response.
              </p>
            </div>

            <div className="space-y-3.5">
              {INCIDENT_NATURES.map((nature, idx) => {
                const Icon = nature.icon;
                const isSelected = selectedNature.title === nature.title;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectNature(nature)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/70 shadow-xl shadow-teal-500/10 ring-1 ring-teal-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white">{nature.title}</h3>
                        <ChevronRight size={18} className="text-slate-500 group-hover:text-teal-400 transition" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{nature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: Incident Details & Offline Storage Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setStep('nature')}
                className="text-xs text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Back to Incident Selection
              </button>
              <span className="text-xs text-slate-400 font-mono">Step 2 of 2</span>
            </div>

            {/* Selected Nature Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <selectedNature.icon size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">Selected Category</span>
                  <div className="text-sm font-bold text-white">{selectedNature.title}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('nature')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Estimated Severity */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Impact & Severity Level</label>
              <div className="grid grid-cols-4 gap-2.5">
                {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                      severity === lvl
                        ? lvl === 'critical'
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                          : lvl === 'high'
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                          : lvl === 'medium'
                          ? 'bg-yellow-500 text-slate-950'
                          : 'bg-teal-500 text-slate-950'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Incident Description <span className="text-teal-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">{description.length} chars (min 15)</span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Describe what occurred: Where were you when this occurred? What details did the message contain? Did you enter credentials or transfer funds?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 leading-relaxed transition"
                required
              />
            </div>

            {/* Suspicious URL or Message Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Suspicious Link, QR Destination, or Message Content (Optional)
              </label>
              <input
                type="text"
                value={suspiciousContent}
                onChange={(e) => setSuspiciousContent(e.target.value)}
                placeholder="e.g. https://campus-tuition-portal.xyz/wire or sender email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-teal-400 transition"
              />
            </div>

            {/* Department / Campus Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Campus Sector / Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
              >
                <option value="General Campus">General Campus / Not Specific</option>
                <option value="Engineering & Computer Science">Engineering & Computer Science</option>
                <option value="Administration & Bursar">Administration & Bursar</option>
                <option value="Central Library">Central Library</option>
                <option value="Student Life & Dining">Student Life & Dining</option>
                <option value="Residence Quad">Residence Quad</option>
              </select>
            </div>

            {/* Consent & Secure Local Storage Checkbox (Innovation 5) */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="consentStorage"
                checked={consentStorage}
                onChange={(e) => setConsentStorage(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <label htmlFor="consentStorage" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                <strong className="text-white">Secure Encrypted Offline Storage Consent:</strong> I authorize SignalSafe Campus to store this incident report in my device's encrypted local sandbox if connection is interrupted, and automatically dispatch it when network connectivity is re-established.
              </label>
            </div>

            {validationError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
            >
              <Send size={16} />
              <span>
                {actuallyOnline ? 'Submit Incident to Campus Security' : 'Save Encrypted Report to Offline Queue'}
              </span>
            </button>
          </form>
        )}

        {/* Pending Offline Drafts Queue List */}
        {pendingDrafts.length > 0 && !submittedId && (
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pending Offline Queue ({pendingDrafts.length} Stored Reports)
                </h3>
              </div>
              <button
                onClick={handleManualSync}
                disabled={!actuallyOnline || syncingQueue}
                className="text-xs text-teal-400 hover:underline font-semibold cursor-pointer disabled:opacity-40"
              >
                Sync Now
              </button>
            </div>

            <div className="space-y-2">
              {pendingDrafts.map((draft) => (
                <div
                  key={draft.local_id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 capitalize">{draft.category} Incident</span>
                    <p className="text-[11px] text-slate-400 truncate max-w-md">{draft.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {draft.local_id}</span>
                  </div>

                  <button
                    onClick={() => {
                      removeOfflineIncident(draft.local_id);
                      refreshPendingDrafts();
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 ml-3"
                  >
                    Discard
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
