import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck, Search, Building2, UserX } from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { InstitutionalIdentity, TrustVerificationResult } from '../types';

export const TrustGraphPage: React.FC = () => {
  const [identities, setIdentities] = useState<InstitutionalIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimedSender, setClaimedSender] = useState('');
  const [senderDomain, setSenderDomain] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<TrustVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIdentities();
  }, []);

  const fetchIdentities = async () => {
    setLoading(true);
    try {
      const data = await api.getInstitutionalIdentities();
      setIdentities(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimedSender.trim()) return;

    setVerifying(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.verifyTrustGraph({
        claimed_sender: claimedSender.trim(),
        sender_domain: senderDomain.trim() || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-24">
      <Header
        title="Institutional Trust Graph"
        subtitle="Cryptographic sender & authority verification"
        showBack
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Verification Tool */}
          <div className="lg:col-span-5 space-y-5">
            {/* Sender Verifier */}
            <form onSubmit={handleVerifySender} className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-[#202A35]">
                <ShieldCheck className="w-5 h-5 text-[#315E63]" />
                <span>Verify Official Sender / Channel</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202A35] mb-1.5">
                  Sender Email / Account Address
                </label>
                <input
                  type="text"
                  value={claimedSender}
                  onChange={(e) => setClaimedSender(e.target.value)}
                  placeholder="e.g. bursar@fake-campus-refunds.com or registrar@campus.edu"
                  className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-sm text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202A35] mb-1.5">
                  Sender Domain / Host (Optional)
                </label>
                <input
                  type="text"
                  value={senderDomain}
                  onChange={(e) => setSenderDomain(e.target.value)}
                  placeholder="e.g. fake-campus-refunds.com"
                  className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-sm text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || !claimedSender.trim()}
                className="w-full py-3 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                {verifying ? (
                  <span>Verifying against Trust Graph...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify Trust Status</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-[#C74747]/10 border border-[#C74747]/25 rounded-2xl text-[#C74747] text-xs shadow-xs font-medium">
                {error}
              </div>
            )}

            {/* Verification Result */}
            {result && (
              <div
                className={`p-6 rounded-2xl border space-y-4 shadow-xs ${
                  result.trust_status === 'VERIFIED_OFFICIAL'
                    ? 'bg-[#27845A]/10 border-[#27845A]/25 text-[#27845A]'
                    : result.trust_status === 'LOOKALIKE_IMPERSONATION'
                    ? 'bg-[#C74747]/10 border-[#C74747]/25 text-[#C74747]'
                    : 'bg-[#C58A35]/10 border-[#C58A35]/25 text-[#C58A35]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.trust_status === 'VERIFIED_OFFICIAL' ? (
                      <CheckCircle className="w-5 h-5 text-[#27845A]" />
                    ) : result.trust_status === 'LOOKALIKE_IMPERSONATION' ? (
                      <UserX className="w-5 h-5 text-[#C74747]" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-[#C58A35]" />
                    )}
                    <span className="font-bold text-base text-[#202A35]">
                      {result.trust_status === 'VERIFIED_OFFICIAL'
                        ? 'Official Campus Authority'
                        : result.trust_status === 'LOOKALIKE_IMPERSONATION'
                        ? 'Lookalike Impersonation Detected'
                        : 'Unverified External Sender'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-white">
                    {result.trust_status}
                  </span>
                </div>

                {result.matched_unit && (
                  <div className="text-sm">
                    <span className="text-[#64748B]">Institutional Authority: </span>
                    <strong className="text-[#202A35]">{result.matched_unit}</strong>
                  </div>
                )}

                {result.alert && (
                  <div className="p-3 rounded-xl bg-white border border-[#E5E9ED] text-xs text-[#C74747] font-semibold">
                    {result.alert}
                  </div>
                )}

                <p className="text-xs text-[#202A35] leading-relaxed font-medium">{result.guidance}</p>
              </div>
            )}
          </div>

          {/* Right Column: Registered Campus Identities */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#315E63]" />
                <h2 className="text-base font-bold text-[#202A35]">Verified Campus Registry Directory</h2>
              </div>
              <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-1 rounded-lg border border-[#E5E9ED] shadow-xs">
                {identities.length} Verified Authorities
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-[#64748B] bg-white rounded-2xl border border-[#E5E9ED] shadow-xs">
                Loading verified campus directory...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {identities.map((id: any) => (
                  <div key={id.id} className="p-4 rounded-xl bg-white border border-[#E5E9ED] hover:border-[#315E63]/30 transition space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#202A35] truncate">
                        {id.unit_name || id.name || 'Campus Authority'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#27845A] bg-[#27845A]/10 px-2 py-0.5 rounded-full border border-[#27845A]/25 font-bold shrink-0">
                        <CheckCircle className="w-3 h-3" /> Official
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Domain: <span className="text-[#315E63] font-mono text-xs font-bold">{id.official_domain || id.verified_domain || 'campus.edu'}</span>
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Department: <span className="text-[#202A35] font-medium">{id.department}</span> {id.role_title ? `• ${id.role_title}` : ''}
                    </div>
                    {id.official_email && (
                      <div className="text-[11px] text-[#64748B] font-mono">
                        Contact: <span className="text-[#202A35]">{id.official_email}</span>
                      </div>
                    )}
                    {(id.official_portal_url || id.verified_payment_portal) && (
                      <div className="text-[11px] text-[#315E63] truncate pt-1 border-t border-[#E5E9ED]">
                        Portal: <a href={id.official_portal_url || id.verified_payment_portal} target="_blank" rel="noreferrer" className="hover:underline font-medium">{id.official_portal_url || id.verified_payment_portal}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustGraphPage;
