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
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to extract Threat DNA fingerprint');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-24">
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
            <form onSubmit={handleAnalyzeDna} className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContentType('message')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    contentType === 'message'
                      ? 'bg-[#F0F4F4] text-[#315E63] border-[#315E63]/30 font-bold shadow-2xs'
                      : 'bg-white text-[#64748B] border-[#E5E9ED] hover:bg-[#F0F4F4]'
                  }`}
                >
                  Suspicious Message DNA
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('url')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    contentType === 'url'
                      ? 'bg-[#F0F4F4] text-[#315E63] border-[#315E63]/30 font-bold shadow-2xs'
                      : 'bg-white text-[#64748B] border-[#E5E9ED] hover:bg-[#F0F4F4]'
                  }`}
                >
                  Malicious URL DNA
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#202A35] mb-1">
                  Suspicious Content / Text / URL
                </label>
                <textarea
                  rows={3}
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder={contentType === 'url' ? 'e.g. http://192.168.1.5:8080/campus-bursar-verify' : 'Paste suspicious SMS, email, or chat notice...'}
                  className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#202A35] mb-1">
                  Claimed Sender (Optional)
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="e.g. bursar@fake-refunds-campus.com"
                  className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-2.5 text-xs text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !contentToAnalyze.trim()}
                className="w-full py-2.5 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
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
              <div className="p-4 bg-[#C74747]/10 border border-[#C74747]/25 rounded-2xl flex items-center gap-2 text-[#C74747] text-xs shadow-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Extracted DNA Fingerprint Result */}
            {fingerprint && (
              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#315E63] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#27845A]" /> DNA Fingerprint Extracted
                  </span>
                  <span className="text-[10px] font-mono text-[#315E63] bg-[#315E63]/10 px-2 py-0.5 rounded border border-[#315E63]/25 font-bold">
                    SHA-256
                  </span>
                </div>

                <div className="p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] font-mono text-[11px] text-[#315E63] break-all select-all font-semibold">
                  {fingerprint.fingerprint_hash}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {fingerprint.normalized_domain && (
                    <div className="p-2 bg-[#F7F8FA] rounded-lg border border-[#E5E9ED]">
                      <span className="text-[#64748B] block text-[10px]">Target Domain:</span>
                      <span className="text-[#202A35] font-semibold">{fingerprint.normalized_domain}</span>
                    </div>
                  )}
                  {fingerprint.brand_impersonation && (
                    <div className="p-2 bg-[#F7F8FA] rounded-lg border border-[#E5E9ED]">
                      <span className="text-[#64748B] block text-[10px]">Brand Impersonation:</span>
                      <span className="text-[#C58A35] font-semibold">{fingerprint.brand_impersonation}</span>
                    </div>
                  )}
                  <div className="p-2 bg-[#F7F8FA] rounded-lg border border-[#E5E9ED]">
                    <span className="text-[#64748B] block text-[10px]">Financial Coercion:</span>
                    <span className={fingerprint.payment_flags ? 'text-[#C74747] font-bold' : 'text-[#64748B]'}>
                      {fingerprint.payment_flags ? 'Flagged' : 'None detected'}
                    </span>
                  </div>
                  {fingerprint.campaign_id && (
                    <div className="p-2 bg-[#F7F8FA] rounded-lg border border-[#E5E9ED]">
                      <span className="text-[#64748B] block text-[10px]">Assigned Campaign:</span>
                      <span className="text-[#397C78] font-mono font-semibold text-[10px]">{fingerprint.campaign_id.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>

                {fingerprint.keywords && fingerprint.keywords.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] block mb-1">Semantic Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {fingerprint.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#F0F4F4] text-[#202A35] rounded text-[10px] border border-[#E5E9ED]">
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
              <Layers className="w-4 h-4 text-[#315E63]" />
              <h2 className="text-sm font-bold text-[#202A35]">Active Threat Campaigns</h2>
            </div>

            {loadingCampaigns ? (
              <div className="p-6 text-center text-xs text-[#64748B]">Loading campaign intelligence...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] text-center text-xs text-[#64748B] shadow-xs">
                No active threat campaigns detected yet. New campaigns are dynamically formed as correlated attacks are recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="p-4 rounded-2xl bg-white border border-[#E5E9ED] space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#202A35] flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#C74747]" />
                        {camp.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25">
                        {camp.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#64748B]">
                      <span>Incidents: <strong className="text-[#202A35]">{camp.incident_count}</strong></span>
                      <span>Risk Score: <strong className="text-[#C58A35]">{camp.risk_score}</strong>/100</span>
                    </div>

                    {camp.common_indicators && camp.common_indicators.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {camp.common_indicators.map((ind, i) => (
                          <span key={i} className="text-[10px] bg-[#F7F8FA] text-[#64748B] px-2 py-0.5 rounded border border-[#E5E9ED]">
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

export default ThreatDnaPage;
