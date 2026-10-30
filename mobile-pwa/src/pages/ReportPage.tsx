import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
} from 'lucide-react';
import Header from '../components/Header';
import { useIncidents } from '../hooks/useIncidents';
import { saveOfflineIncident } from '../utils/offlineQueue';
import type { IncidentCategory } from '../types';

interface LocationState {
  category?: IncidentCategory;
  suspiciousContent?: string;
  description?: string;
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};

  const [category, setCategory] = useState<IncidentCategory>(
    state.category || 'phishing'
  );
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [description, setDescription] = useState(state.description || '');
  const [suspiciousContent, setSuspiciousContent] = useState(
    state.suspiciousContent || ''
  );
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { createIncident, loading, error } = useIncidents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const descTrimmed = description.trim();
    if (!descTrimmed) {
      setValidationError('Please provide a description of the cybersecurity issue.');
      return;
    }
    if (descTrimmed.length < 20) {
      setValidationError('Description must be at least 20 characters to assist campus security.');
      return;
    }

    try {
      if (!navigator.onLine) {
        // Feature 8: Offline Cyber Safety Mode
        const draft = saveOfflineIncident({
          category,
          severity,
          description: descTrimmed,
          suspicious_content: suspiciousContent.trim() || undefined,
        });
        setSubmittedId(draft.local_id);
        return;
      }

      const created = await createIncident({
        category,
        severity,
        description: descTrimmed,
        suspicious_content: suspiciousContent.trim() || undefined,
      });

      setSubmittedId(created.id);
    } catch (err: any) {
      console.warn('Network submission failed, saving to offline incident queue:', err);
      // Graceful offline fallback
      const draft = saveOfflineIncident({
        category,
        severity,
        description: descTrimmed,
        suspicious_content: suspiciousContent.trim() || undefined,
      });
      setSubmittedId(draft.local_id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Report Incident"
        subtitle="Notify campus cybersecurity administrators"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {submittedId ? (
          /* Success Screen */
          <div className="bg-slate-900/80 rounded-2xl border border-teal-500/30 p-6 text-center space-y-4 my-6">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Incident Report Dispatched</h2>
              <p className="text-xs text-slate-300 mt-1">
                Your report has been logged and assigned to the campus IT security response team.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300">
              Tracking ID: {submittedId}
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 text-[11px] text-slate-400 text-left space-y-1">
              <p className="font-semibold text-slate-200">Incident Lifecycle:</p>
              <p>1. SUBMITTED → 2. TRIAGED → 3. INVESTIGATING → 4. RESOLVED</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate('/reports')}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                View in My Reports
              </button>
              <button
                onClick={() => {
                  setSubmittedId(null);
                  setDescription('');
                  setSuspiciousContent('');
                }}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          /* Report Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p>
                Authorized for campus-related cyber threats, impersonation, phishing portals, and credential harvesting attempts.
              </p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Threat Category <span className="text-teal-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-teal-400"
              >
                <option value="phishing">Phishing Attempt</option>
                <option value="malware">Malware / Malicious Download</option>
                <option value="suspicious_email">Suspicious Campus Email</option>
                <option value="unauthorized_access">Unauthorized Account Access</option>
                <option value="social_engineering">Social Engineering / Impersonation</option>
                <option value="data_breach">Suspected Data Leak</option>
                <option value="other">Other Incident</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Estimated Severity <span className="text-teal-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      severity === lvl
                        ? lvl === 'critical'
                          ? 'bg-red-500 text-white'
                          : lvl === 'high'
                          ? 'bg-amber-500 text-slate-950'
                          : lvl === 'medium'
                          ? 'bg-yellow-500 text-slate-950'
                          : 'bg-blue-500 text-white'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Incident Description <span className="text-teal-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">{description.length} chars (min 20)</span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Explain what happened: What were you doing when you received this? Did you click the link or provide any information?"
                className={`w-full bg-slate-950 border rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  validationError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-700 focus:border-teal-400'
                }`}
              />
            </div>

            {/* Suspicious URL or message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Suspicious Link or Payload (Optional)
              </label>
              <textarea
                rows={2}
                value={suspiciousContent}
                onChange={(e) => setSuspiciousContent(e.target.value)}
                placeholder="Paste the suspicious URL, message content, or header information..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={14} />
                <span>{validationError}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                Submission error: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all"
            >
              <Send size={16} />
              {loading ? 'Submitting to Security Admin...' : 'Submit Security Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}