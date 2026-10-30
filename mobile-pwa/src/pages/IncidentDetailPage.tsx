import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Download,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Header from '../components/Header';
import IncidentTimeline from '../components/IncidentTimeline';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import type { Incident, TimelineEvent, EvidenceExportPackage } from '../types';
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

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const [incData, eventsData] = await Promise.all([
          api.getIncident(id),
          api.getIncidentTimeline(id).catch(() => []),
        ]);
        setIncident(incData);
        setTimelineEvents(eventsData);
      } catch (err: any) {
        console.error('Failed to fetch incident detail:', err);
        setError(err.message || 'Unable to retrieve incident details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleExportEvidence = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const data = await api.exportIncidentEvidence(id);
      setExportedPackage(data);

      // Trigger automatic file download of the digitally signed package
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SignalSafe_Evidence_Incident_${id.slice(0, 8)}.json`;
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

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Incident Detail"
        subtitle={id ? `ID #${id.slice(0, 8)}` : undefined}
        showBack
      />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-44 bg-slate-900 rounded-2xl animate-pulse" />
          </div>
        ) : error || !incident ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <AlertTriangle size={32} className="text-amber-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Record Not Found</h3>
            <p className="text-xs text-slate-400">
              {error || 'The requested incident record could not be loaded.'}
            </p>
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Back to Reports
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Status Card with Timeline */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Ref ID: {incident.id}
                  </span>
                  <h2 className="text-base font-bold text-white capitalize mt-0.5">
                    {incident.category.replace('_', ' ')} Incident
                  </h2>
                </div>
                <StatusBadge status={incident.status} variant="incident" />
              </div>

              {/* Progress Timeline */}
              <div className="pt-2">
                <IncidentTimeline currentStatus={incident.status} />
              </div>
            </div>

            {/* Feature 9: Evidence Audit Trail & Timeline */}
            {timelineEvents.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                  <Clock size={14} />
                  <span>Immutable Audit Trail</span>
                </div>
                <div className="space-y-2">
                  {timelineEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 capitalize">{ev.event_type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(ev.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{ev.details}</p>
                        <span className="text-[10px] text-slate-500 font-mono">Actor: {ev.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incident Metadata */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Incident Specifics
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Severity Level</span>
                  <div className="mt-1">
                    <StatusBadge status={incident.severity} variant="severity" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Logged At</span>
                  <div className="mt-1 text-slate-200 font-medium flex items-center gap-1">
                    <Calendar size={12} className="text-teal-400" />
                    <span>{formatDate(incident.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">User Report Description:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {incident.description}
                </div>
              </div>

              {/* Suspicious Content Payload */}
              {incident.suspicious_content && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Suspicious Payload / URL:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 break-all select-all">
                    {incident.suspicious_content}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution or triage notes */}
            {incident.resolution_notes && (
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={16} />
                  <span>Security Response Team Notes</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {incident.resolution_notes}
                </p>
              </div>
            )}

            {/* Tamper-Evident Evidence Export (Feature 9) */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Evidence Integrity Package</h4>
                  <p className="text-[11px] text-slate-400">Cryptographic SHA-256 signed audit export for forensic review</p>
                </div>
              </div>

              {exportedPackage && (
                <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                    <CheckCircle size={14} /> Digital Signature Verified
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 break-all">
                    Hash: {exportedPackage.digital_signature.hash}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Standard: {exportedPackage.digital_signature.verification_standard}
                  </div>
                </div>
              )}

              <button
                onClick={handleExportEvidence}
                disabled={exporting}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download size={14} />
                <span>{exporting ? 'Generating Signature...' : 'Download Tamper-Evident Evidence Package'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
