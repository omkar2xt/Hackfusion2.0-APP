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
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28">
      <Header
        title="Report a Cyber Incident"
        subtitle="Innovation 5: Offline-first encrypted dispatch & incident triage"
        showBack
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Offline / Online Network Connectivity Banner (Innovation 5) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                actuallyOnline
                  ? 'bg-[#27845A]/10 text-[#27845A] border border-[#27845A]/20'
                  : 'bg-[#C58A35]/10 text-[#C58A35] border border-[#C58A35]/20 animate-pulse'
              }`}
            >
              {actuallyOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#202A35]">
                  {actuallyOnline ? 'Live Network Connected' : 'Offline Cyber Safety Mode Active'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    actuallyOnline ? 'bg-[#27845A]' : 'bg-[#C58A35] animate-ping'
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#64748B]">
                {actuallyOnline
                  ? 'Reports dispatch directly to campus security triage in real time.'
                  : 'Reports are encrypted in secure browser sandbox and auto-synced upon reconnect.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              className="px-3 py-1.5 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-xs font-semibold text-[#202A35] transition cursor-pointer border border-[#E5E9ED]"
            >
              {simulatedOffline ? 'Resume Online Mode' : 'Test Offline Mode'}
            </button>

            {pendingDrafts.length > 0 && (
              <button
                onClick={handleManualSync}
                disabled={syncingQueue || !actuallyOnline}
                className="px-3.5 py-1.5 rounded-xl bg-[#315E63] hover:bg-[#397C78] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={syncingQueue ? 'animate-spin' : ''} />
                <span>Sync Queue ({pendingDrafts.length})</span>
              </button>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="p-4 bg-[#27845A]/10 border border-[#27845A]/20 rounded-2xl flex items-center gap-2 text-xs text-[#27845A]">
            <CheckCircle2 size={16} className="text-[#27845A] shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {submittedId ? (
          /* Submission Confirmation Screen */
          <div className="bg-white rounded-3xl border border-[#E5E9ED] p-8 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#27845A]/10 text-[#27845A] mx-auto flex items-center justify-center border border-[#27845A]/20">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#202A35]">
                {isSavedOffline ? 'Report Saved Securely in Offline Sandbox' : 'Incident Dispatched to Campus Triage'}
              </h2>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                {isSavedOffline
                  ? 'Your device is currently offline. Your report has been cryptographically signed and queued in local storage. It will be dispatched automatically once connectivity returns.'
                  : 'Your report has been logged in the central campus security repository and assigned a response tracking reference.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] text-xs font-mono text-[#315E63] font-semibold max-w-sm mx-auto">
              Tracking Ref: {submittedId}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
              <button
                onClick={() => navigate('/reports')}
                className="px-6 py-3 bg-[#315E63] hover:bg-[#397C78] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
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
                className="px-6 py-3 bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-semibold rounded-xl text-xs transition cursor-pointer border border-[#E5E9ED]"
              >
                File Another Incident
              </button>
            </div>
          </div>
        ) : step === 'nature' ? (
          /* STEP 1: Select Nature of Incident (Matching Reference Screenshot 2) */
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#315E63] uppercase tracking-wider">Step 1 of 2</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#202A35]">
                What is the nature of your incident?
              </h2>
              <p className="text-xs text-[#64748B]">
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
                        ? 'bg-[#F0F4F4] border-[#315E63] ring-1 ring-[#315E63] shadow-sm'
                        : 'bg-white border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#315E63]/10 border border-[#315E63]/20 text-[#315E63] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-[#202A35]">{nature.title}</h3>
                        <ChevronRight size={18} className="text-[#64748B] group-hover:text-[#315E63] transition" />
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{nature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: Incident Details & Offline Storage Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
              <button
                type="button"
                onClick={() => setStep('nature')}
                className="text-xs text-[#315E63] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Back to Incident Selection
              </button>
              <span className="text-xs text-[#64748B] font-mono">Step 2 of 2</span>
            </div>

            {/* Selected Nature Summary Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#315E63]/30 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#315E63]/10 text-[#315E63] flex items-center justify-center shrink-0">
                  <selectedNature.icon size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-[#315E63] uppercase font-bold tracking-wider">Selected Category</span>
                  <div className="text-sm font-bold text-[#202A35]">{selectedNature.title}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('nature')}
                className="text-xs text-[#64748B] hover:text-[#202A35] underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Estimated Severity */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#202A35]">Impact & Severity Level</label>
              <div className="grid grid-cols-4 gap-2.5">
                {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                      severity === lvl
                        ? lvl === 'critical'
                          ? 'bg-[#C74747] text-white shadow-sm'
                          : lvl === 'high'
                          ? 'bg-[#C58A35] text-white shadow-sm'
                          : lvl === 'medium'
                          ? 'bg-[#477B9B] text-white'
                          : 'bg-[#27845A] text-white'
                        : 'bg-white border border-[#E5E9ED] text-[#64748B] hover:text-[#202A35] hover:bg-[#F0F4F4]'
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
                <label className="text-xs font-semibold text-[#202A35]">
                  Incident Description <span className="text-[#315E63]">*</span>
                </label>
                <span className="text-[11px] text-[#64748B]">{description.length} chars (min 15)</span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Describe what occurred: Where were you when this occurred? What details did the message contain? Did you enter credentials or transfer funds?"
                className="w-full bg-white border border-[#E5E9ED] rounded-xl p-3.5 text-xs text-[#202A35] placeholder-[#94A3B8] focus:outline-none focus:border-[#315E63] focus:ring-1 focus:ring-[#315E63] leading-relaxed transition"
                required
              />
            </div>

            {/* Suspicious URL or Message Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#202A35]">
                Suspicious Link, QR Destination, or Message Content (Optional)
              </label>
              <input
                type="text"
                value={suspiciousContent}
                onChange={(e) => setSuspiciousContent(e.target.value)}
                placeholder="e.g. https://campus-tuition-portal.xyz/wire or sender email"
                className="w-full bg-white border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#C58A35] font-mono placeholder-[#94A3B8] focus:outline-none focus:border-[#315E63] focus:ring-1 focus:ring-[#315E63] transition"
              />
            </div>

            {/* Department / Campus Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#202A35]">Campus Sector / Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] focus:outline-none focus:border-[#315E63] focus:ring-1 focus:ring-[#315E63]"
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
            <div className="p-4 rounded-xl bg-white border border-[#E5E9ED] flex items-start gap-3 shadow-sm">
              <input
                type="checkbox"
                id="consentStorage"
                checked={consentStorage}
                onChange={(e) => setConsentStorage(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#315E63] focus:ring-[#315E63] bg-white border-[#E5E9ED] cursor-pointer"
              />
              <label htmlFor="consentStorage" className="text-xs text-[#64748B] leading-relaxed cursor-pointer select-none">
                <strong className="text-[#202A35]">Secure Encrypted Offline Storage Consent:</strong> I authorize YODHRA to store this incident report in my device's encrypted local sandbox if connection is interrupted, and automatically dispatch it when network connectivity is re-established.
              </label>
            </div>

            {validationError && (
              <div className="p-3 bg-[#C74747]/10 border border-[#C74747]/20 rounded-xl flex items-center gap-2 text-xs text-[#C74747]">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-[#C74747]/10 border border-[#C74747]/20 rounded-xl text-xs text-[#C74747]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#315E63] hover:bg-[#397C78] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
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
          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-[#315E63]" />
                <h3 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                  Pending Offline Queue ({pendingDrafts.length} Stored Reports)
                </h3>
              </div>
              <button
                onClick={handleManualSync}
                disabled={!actuallyOnline || syncingQueue}
                className="text-xs text-[#315E63] hover:underline font-semibold cursor-pointer disabled:opacity-40"
              >
                Sync Now
              </button>
            </div>

            <div className="space-y-2">
              {pendingDrafts.map((draft) => (
                <div
                  key={draft.local_id}
                  className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#202A35] capitalize">{draft.category} Incident</span>
                    <p className="text-[11px] text-[#64748B] truncate max-w-md">{draft.description}</p>
                    <span className="text-[10px] text-[#64748B] font-mono">ID: {draft.local_id}</span>
                  </div>

                  <button
                    onClick={() => {
                      removeOfflineIncident(draft.local_id);
                      refreshPendingDrafts();
                    }}
                    className="text-[11px] text-[#C74747] hover:underline ml-3 font-semibold cursor-pointer"
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
