import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { ThreatFingerprint, ThreatCampaign } from '../types';

export const ThreatDnaPage: React.FC = () => {
  const [contentToAnalyze, setContentToAnalyze] = useState('');
  const [sender, setSender] = useState('');
  const [contentType, setContentType] = useState<'url' | 'message'>('message');
  const [analyzing, setAnalyzing] = useState(false);
  const [fingerprint, setFingerprint] = useState<ThreatFingerprint | null>(null);
  const [campaigns, setCampaigns] = useState<ThreatCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await api.getThreatCampaigns();
      setCampaigns(data);
    } catch {
      // ignore
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleAnalyzeDna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentToAnalyze.trim()) return;

    setAnalyzing(true);
    setError(null);
    setFingerprint(null);

    try {
      const res = await api.analyzeThreatDna({
        raw_content: contentToAnalyze,
        content_type: contentType,
        sender: sender.trim() || undefined,
      });
      setFingerprint(res);
      fetchCampaigns(); // Refresh campaigns
    } catch (err: any) {
      setError(err.message || 'Failed to extract Threat DNA fingerprint');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Cyberattack DNA Engine"
        subtitle="Semantic threat campaign correlation"
        showBack
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: DNA Extractor & Fingerprint Result */}
          <div className="space-y-4">
            {/* DNA Extractor Form */}
            <form onSubmit={handleAnalyzeDna} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContentType('message')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    contentType === 'message'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Suspicious Message DNA
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    contentType === 'url'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Malicious URL DNA
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Suspicious Content / Text / URL
                </label>
                <textarea
                  rows={3}
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder={contentType === 'url' ? 'e.g. http://192.168.1.5:8080/campus-bursar-verify' : 'Paste suspicious SMS, email, or chat notice...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Claimed Sender (Optional)
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="e.g. bursar@fake-refunds-campus.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !contentToAnalyze.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <span>Extracting Threat DNA...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Generate DNA Fingerprint & Correlate</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Extracted DNA Fingerprint Result */}
            {fingerprint && (
              <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" /> DNA Fingerprint Extracted
                  </span>
                  <span className="text-[10px] font-mono text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                    SHA-256
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 break-all">
                  {fingerprint.fingerprint_hash}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {fingerprint.normalized_domain && (
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Target Domain:</span>
                      <span className="text-slate-200 font-medium">{fingerprint.normalized_domain}</span>
                    </div>
                  )}
                  {fingerprint.brand_impersonation && (
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Brand Impersonation:</span>
                      <span className="text-amber-400 font-semibold">{fingerprint.brand_impersonation}</span>
                    </div>
                  )}
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Financial Coercion:</span>
                    <span className={fingerprint.payment_flags ? 'text-red-400 font-bold' : 'text-slate-400'}>
                      {fingerprint.payment_flags ? 'Flagged' : 'None detected'}
                    </span>
                  </div>
                  {fingerprint.campaign_id && (
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Assigned Campaign:</span>
                      <span className="text-cyan-300 font-mono text-[10px]">{fingerprint.campaign_id.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>

                {fingerprint.keywords && fingerprint.keywords.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Semantic Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {fingerprint.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Correlated Threat Campaigns */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-slate-200">Active Threat Campaigns</h2>
            </div>

            {loadingCampaigns ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading campaign intelligence...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No active threat campaigns detected yet. New campaigns are dynamically formed as correlated attacks are recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        {camp.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        {camp.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Incidents: <strong className="text-slate-200">{camp.incident_count}</strong></span>
                      <span>Risk Score: <strong className="text-amber-400">{camp.risk_score}</strong>/100</span>
                    </div>

                    {camp.common_indicators && camp.common_indicators.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {camp.common_indicators.map((ind, i) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60">
                            {ind}
                          </span>
                        ))}
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

