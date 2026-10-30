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
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Institutional Trust Graph"
        subtitle="Cryptographic sender & authority verification"
        showBack
      />
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

      {/* Sender Verifier */}
      <form onSubmit={handleVerifySender} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Verify Official Sender / Channel</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Sender Email / Account Address
          </label>
          <input
            type="text"
            value={claimedSender}
            onChange={(e) => setClaimedSender(e.target.value)}
            placeholder="e.g. bursar@fake-campus-refunds.com or registrar@campus.edu"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Sender Domain / Host (Optional)
          </label>
          <input
            type="text"
            value={senderDomain}
            onChange={(e) => setSenderDomain(e.target.value)}
            placeholder="e.g. fake-campus-refunds.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={verifying || !claimedSender.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Verification Result */}
      {result && (
        <div
          className={`p-5 rounded-2xl border space-y-3 ${
            result.trust_status === 'VERIFIED_OFFICIAL'
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              : result.trust_status === 'LOOKALIKE_IMPERSONATION'
              ? 'bg-red-950/30 border-red-500/50 text-red-200'
              : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.trust_status === 'VERIFIED_OFFICIAL' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : result.trust_status === 'LOOKALIKE_IMPERSONATION' ? (
                <UserX className="w-5 h-5 text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="font-bold text-sm">
                {result.trust_status === 'VERIFIED_OFFICIAL'
                  ? 'Official Campus Authority'
                  : result.trust_status === 'LOOKALIKE_IMPERSONATION'
                  ? 'Lookalike Impersonation Detected'
                  : 'Unverified External Sender'}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border">
              {result.trust_status}
            </span>
          </div>

          {result.matched_unit && (
            <div className="text-xs">
              <span className="text-slate-400">Institutional Authority: </span>
              <strong className="text-slate-100">{result.matched_unit}</strong>
            </div>
          )}

          {result.alert && (
            <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 font-semibold">
              {result.alert}
            </div>
          )}

          <p className="text-xs text-slate-300">{result.guidance}</p>
        </div>
      )}

      {/* Registered Campus Identities */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-200">Verified Campus Registry</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading verified campus directory...</div>
        ) : (
          <div className="grid gap-3">
            {identities.map((id) => (
              <div key={id.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-100">{id.unit_name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30 font-medium">
                    <CheckCircle className="w-3 h-3" /> Official
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Domain: <span className="text-teal-300 font-mono text-[11px]">{id.official_domain}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Department: {id.department}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

