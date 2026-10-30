import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Globe,
  QrCode,
  FileText,
  Lock,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Plus,
  RefreshCw,
  Server,
  Key,
  Wifi,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type {
  UrlInvestigationResponse,
  QrInvestigationResponse,
  EvidenceVaultItem,
  IncidentCorrelationItem,
  AttributionItem,
  InvestigationReport,
} from '../types';

export const InvestigationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'url' | 'qr' | 'correlation' | 'attribution' | 'vault' | 'report'
  >('url');

  // URL Pipeline State
  const [urlInput, setUrlInput] = useState('https://kls-vdit-sso.online/login');
  const [urlResult, setUrlResult] = useState<UrlInvestigationResponse | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // QR Pipeline State
  const [qrInput, setQrInput] = useState(
    'WIFI:S:KLS_VDIT_CAMPUS_FREE;T:nopass;P:;;'
  );
  const [qrResult, setQrResult] = useState<QrInvestigationResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Correlation & Vault State
  const [correlations, setCorrelations] = useState<IncidentCorrelationItem[]>([]);
  const [vaultItems, setVaultItems] = useState<EvidenceVaultItem[]>([]);
  const [attribution, setAttribution] = useState<AttributionItem | null>(null);
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Evidence Deposit Form
  const [depositOpen, setDepositOpen] = useState(false);
  const [newEvidenceType, setNewEvidenceType] = useState('submitted_url');
  const [newEvidenceContent, setNewEvidenceContent] = useState('');
  const [newEvidenceOrigin, setNewEvidenceOrigin] = useState('Campus Security Desk');

  const fetchInvestigationTelemetry = async () => {
    try {
      const [vaultRes, corrRes, attrRes] = await Promise.allSettled([
        api.getEvidenceVault(),
        api.getIncidentCorrelations(),
        api.getIncidentAttribution('inc-eng-quad-01'),
      ]);
      if (vaultRes.status === 'fulfilled') setVaultItems(vaultRes.value);
      if (corrRes.status === 'fulfilled') setCorrelations(corrRes.value);
      if (attrRes.status === 'fulfilled') setAttribution(attrRes.value);
    } catch (err) {
      console.error('Failed to load investigation telemetry:', err);
    }
  };

  useEffect(() => {
    fetchInvestigationTelemetry();
  }, []);

  // Handle URL Investigation
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const res = await api.investigateUrl(urlInput.trim());
      setUrlResult(res);
    } catch (err: any) {
      setUrlError(err.message || 'URL Investigation failed');
    } finally {
      setUrlLoading(false);
    }
  };

  // Handle QR Investigation
  const handleAnalyzeQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await api.investigateQr(qrInput.trim());
      setQrResult(res);
    } catch (err: any) {
      setQrError(err.message || 'QR Investigation failed');
    } finally {
      setQrLoading(false);
    }
  };

  // Handle Generate Report
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.getInvestigationReport('inc-eng-quad-01');
      setReport(res);
    } catch (err: any) {
      alert('Report generation failed: ' + err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Handle Deposit Evidence
  const handleDepositEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceContent.trim()) return;
    try {
      await api.depositEvidence({
        evidence_type: newEvidenceType,
        raw_content: newEvidenceContent.trim(),
        source_origin: newEvidenceOrigin.trim(),
      });
      alert('Evidence cryptographically hashed (SHA-256) and deposited into Vault.');
      setDepositOpen(false);
      setNewEvidenceContent('');
      fetchInvestigationTelemetry();
    } catch (err: any) {
      alert('Failed to deposit evidence: ' + err.message);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'CONFIRMED_MALICIOUS':
        return 'bg-[#C74747]/15 text-[#C74747] border border-[#C74747]/30';
      case 'SUSPICIOUS':
        return 'bg-[#C58A35]/15 text-[#C58A35] border border-[#C58A35]/30';
      case 'UNDER_INVESTIGATION':
        return 'bg-[#477B9B]/15 text-[#477B9B] border border-[#477B9B]/30';
      case 'LOW_RISK':
        return 'bg-[#27845A]/15 text-[#27845A] border border-[#27845A]/30';
      default:
        return 'bg-[#64748B]/15 text-[#64748B] border border-[#64748B]/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28 font-sans">
      <Header
        title="Cyber Investigation Center"
        subtitle="Dedicated URL & QR Intelligence Pipelines, Evidence Vault & Forensic Attribution"
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-[#E5E9ED]">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'url'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Globe size={15} />
            <span>URL Intelligence Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <QrCode size={15} />
            <span>QR Intelligence Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('correlation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'correlation'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <GitBranch size={15} />
            <span>Evidence Correlation ({correlations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attribution')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'attribution'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <ShieldAlert size={15} />
            <span>Attribution Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Lock size={15} />
            <span>Evidence Vault ({vaultItems.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('report');
              if (!report) handleGenerateReport();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <FileText size={15} />
            <span>Investigation Report</span>
          </button>
        </div>

        {/* TAB 1: DEDICATED URL INTELLIGENCE PIPELINE */}
        {activeTab === 'url' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Input Form */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Dedicated URL Investigation Pipeline
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Analyzes normalization, DNS/ASN, TLS, redirect chains, typosquatting & SSRF defense
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#27845A]/10 text-[#27845A] border border-[#27845A]/20">
                  SSRF Guardrails Active
                </span>
              </div>

              <form onSubmit={handleAnalyzeUrl} className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter target URL to investigate (e.g. https://kls-vdit-sso.online/login)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] text-xs font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={urlLoading}
                  className="px-5 py-2.5 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Search size={14} />
                  <span>{urlLoading ? 'Investigating...' : 'Run Pipeline'}</span>
                </button>
              </form>

              {urlError && (
                <div className="p-3 bg-[#C74747]/10 text-[#C74747] text-xs rounded-xl border border-[#C74747]/20">
                  {urlError}
                </div>
              )}
            </div>

            {/* URL Investigation Findings */}
            {urlResult && (
              <div className="space-y-6">
                {/* Executive Score & Verdict Card */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Transparent Verdict
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${getVerdictBadge(
                          urlResult.verdict
                        )}`}
                      >
                        {urlResult.verdict.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Risk Score
                    </span>
                    <div className="text-2xl font-extrabold text-[#202A35]">
                      {urlResult.risk_score}
                      <span className="text-xs text-[#64748B] font-normal"> / 100</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Evidence Confidence
                    </span>
                    <div className="text-sm font-bold text-[#315E63]">
                      {urlResult.evidence_confidence} Confidence
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      SSRF Sandbox Status
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#27845A]">
                      <CheckCircle2 size={16} />
                      <span>{urlResult.ssrf_safe ? 'Safe from SSRF' : 'SSRF Blocked'}</span>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Telemetry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Infrastructure Details */}
                  <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                      <Server className="w-4 h-4 text-[#315E63]" />
                      <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                        Infrastructure Intelligence
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#E5E9ED]/60">
                        <span className="text-[#64748B]">Target Hostname</span>
                        <span className="font-mono font-bold text-[#202A35]">
                          {urlResult.hostname}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E5E9ED]/60">
                        <span className="text-[#64748B]">IP Addresses</span>
                        <span className="font-mono text-[#315E63] font-bold">
                          {urlResult.infrastructure.ip_addresses.join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E5E9ED]/60">
                        <span className="text-[#64748B]">Autonomous System (ASN)</span>
                        <span className="font-semibold text-[#202A35]">
                          {urlResult.infrastructure.asn} ({urlResult.infrastructure.asn_org})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E5E9ED]/60">
                        <span className="text-[#64748B]">Hosting Provider</span>
                        <span className="font-semibold text-[#202A35]">
                          {urlResult.infrastructure.hosting_provider}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#64748B]">URL Shortener Detection</span>
                        <span className="font-semibold text-[#202A35]">
                          {urlResult.infrastructure.is_url_shortener ? 'Yes (Masked)' : 'Direct Host'}
                        </span>
                      </div>
                    </div>

                    {/* TLS Certificate Section */}
                    {urlResult.infrastructure.tls_certificate && (
                      <div className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E5E9ED] space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#315E63]">
                          <Key size={13} />
                          <span>TLS Certificate Details</span>
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          Issuer: <strong>{urlResult.infrastructure.tls_certificate.issuer}</strong>
                        </div>
                        <div className="text-[10px] font-mono text-[#64748B] break-all">
                          SHA-256 FP: {urlResult.infrastructure.tls_certificate.fingerprint_sha256}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Indicators & Heuristic Evidence */}
                  <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#C74747]" />
                        <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                          Technical Indicators ({urlResult.indicators.length})
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748B]">Evidence Sourced</span>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {urlResult.indicators.map((ind, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#202A35]">{ind.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                ind.severity === 'critical'
                                  ? 'bg-[#C74747]/15 text-[#C74747]'
                                  : ind.severity === 'high'
                                  ? 'bg-[#C58A35]/15 text-[#C58A35]'
                                  : 'bg-[#315E63]/15 text-[#315E63]'
                              }`}
                            >
                              {ind.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">{ind.details}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                            <span>Source: {ind.evidence_source}</span>
                            <span>Status: {ind.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEDICATED QR INTELLIGENCE PIPELINE */}
        {activeTab === 'qr' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Input Form */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Dedicated QR Investigation Pipeline
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Decodes payload, classifies structure (URL/Wi-Fi/UPI/vCard), evaluates campus reuse count & SHA-256 seal
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#315E63]/10 text-[#315E63] border border-[#315E63]/20">
                  Forensic Decoder Active
                </span>
              </div>

              <form onSubmit={handleAnalyzeQr} className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Paste decoded QR payload (e.g. WIFI:S:Campus_Free;T:nopass;P:;; or upi://pay?pa=...)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] text-xs font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={qrLoading}
                  className="px-5 py-2.5 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Search size={14} />
                  <span>{qrLoading ? 'Decoding...' : 'Inspect Payload'}</span>
                </button>
              </form>

              {qrError && (
                <div className="p-3 bg-[#C74747]/10 text-[#C74747] text-xs rounded-xl border border-[#C74747]/20">
                  {qrError}
                </div>
              )}
            </div>

            {/* QR Investigation Findings */}
            {qrResult && (
              <div className="space-y-6">
                {/* Score & Classification Header */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Payload Classification
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-[#315E63]/15 text-[#315E63] border border-[#315E63]/30">
                        {qrResult.payload_type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Verdict & Score
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-2 py-0.5 rounded ${getVerdictBadge(
                          qrResult.verdict
                        )}`}
                      >
                        {qrResult.verdict.replace('_', ' ')}
                      </span>
                      <span className="font-mono font-bold text-sm">
                        {qrResult.risk_score}/100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Campus Reuse Frequency
                    </span>
                    <div className="text-sm font-bold text-[#202A35]">
                      {qrResult.reuse_count_across_campus > 0 ? (
                        <span className="text-[#C74747] font-bold">
                          Seen in {qrResult.reuse_count_across_campus} reports
                        </span>
                      ) : (
                        <span className="text-[#27845A]">First observed today</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Cryptographic Hash
                    </span>
                    <div className="text-[10px] font-mono text-[#64748B] truncate">
                      SHA-256: {qrResult.payload_hash_sha256.slice(0, 16)}...
                    </div>
                  </div>
                </div>

                {/* Specific Forensic Decomposition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payload Details */}
                  <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                      <FileCheck className="w-4 h-4 text-[#315E63]" />
                      <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                        Decoded Forensic Dossier
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[#64748B] block mb-1">Exact Decoded String</span>
                        <div className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl font-mono text-[11px] break-all select-all text-[#202A35]">
                          {qrResult.decoded_payload}
                        </div>
                      </div>

                      <div className="p-3 bg-[#F0F4F4] text-[#315E63] rounded-xl text-xs space-y-1">
                        <span className="font-bold block">Forensic Explanation:</span>
                        <p>{qrResult.security_explanation}</p>
                      </div>

                      {/* Wi-Fi Configuration Breakdown */}
                      {qrResult.wifi_config && (
                        <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[#315E63]">
                            <Wifi size={14} />
                            <span>Target Wi-Fi Network Telemetry</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Network SSID:</span>
                            <span className="font-mono font-bold text-[#202A35]">
                              {qrResult.wifi_config.ssid || 'None'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Security Type:</span>
                            <span className="font-bold text-[#C74747]">
                              {qrResult.wifi_config.security || 'OPEN'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Payment Information Breakdown */}
                      {qrResult.payment_info && (
                        <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[#315E63]">
                            <CreditCard size={14} />
                            <span>Payment VPA Extraction</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Payee Address (VPA):</span>
                            <span className="font-mono font-bold text-[#C74747]">
                              {qrResult.payment_info.payee_vpa || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Indicators */}
                  <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E9ED]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#C74747]" />
                        <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                          QR Threat Evidence ({qrResult.indicators.length})
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {qrResult.indicators.map((ind, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#202A35]">{ind.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                ind.severity === 'critical'
                                  ? 'bg-[#C74747]/15 text-[#C74747]'
                                  : ind.severity === 'high'
                                  ? 'bg-[#C58A35]/15 text-[#C58A35]'
                                  : 'bg-[#315E63]/15 text-[#315E63]'
                              }`}
                            >
                              {ind.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">{ind.details}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                            <span>Source: {ind.evidence_source}</span>
                            <span>Status: {ind.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EVIDENCE CORRELATION */}
        {activeTab === 'correlation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E9ED]">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Multi-Incident Evidence Correlation Graph
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Correlates campus incidents using shared domains, destination IPs, redirect chains & certificate fingerprints
                  </p>
                </div>
                <span className="text-xs font-bold text-[#315E63]">
                  {correlations.length} Active Correlations Detected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {correlations.map((corr, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] hover:border-[#315E63]/40 space-y-2.5 transition shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#64748B]">
                        #{corr.incident_id.slice(0, 8)} ➔ #{corr.related_incident_id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          corr.match_strength === 'CONFIRMED_MATCH'
                            ? 'bg-[#27845A]/15 text-[#27845A] border border-[#27845A]/30'
                            : 'bg-[#C58A35]/15 text-[#C58A35] border border-[#C58A35]/30'
                        }`}
                      >
                        {corr.match_strength.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#202A35] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#315E63]/10 text-[#315E63] text-[10px]">
                        {corr.correlation_factor.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[#C74747]">{corr.shared_indicator}</span>
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed">{corr.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ATTRIBUTION MATRIX (4-TIER RIGOROUS SEPARATION) */}
        {activeTab === 'attribution' && attribution && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Disclaimer Banner */}
            <div className="p-4 rounded-2xl bg-[#477B9B]/10 border border-[#477B9B]/30 flex items-start gap-3 text-xs text-[#477B9B]">
              <Info size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Attribution & Integrity Policy:</span>
                <p className="mt-0.5 text-[#202A35]">{attribution.attribution_disclaimer}</p>
              </div>
            </div>

            {/* 4-Tier Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Observed Facts */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                  <CheckCircle2 className="w-4 h-4 text-[#27845A]" />
                  <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                    1. Observed Facts (Verified Telemetry)
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-[#64748B]">
                  {attribution.observed_facts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#27845A] font-bold">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Technical Inferences */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                  <Layers className="w-4 h-4 text-[#315E63]" />
                  <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                    2. Technical Inferences (Domain / Host Patterns)
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-[#64748B]">
                  {attribution.technical_inferences.map((inf, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#315E63] font-bold">•</span>
                      <span>{inf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Unverified Hypotheses */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                  <AlertTriangle className="w-4 h-4 text-[#C58A35]" />
                  <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                    3. Unverified Hypotheses (Requiring Proof)
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-[#64748B]">
                  {attribution.unverified_hypotheses.map((hypo, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C58A35] font-bold">•</span>
                      <span>{hypo}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Confirmed Findings */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9ED]">
                  <ShieldAlert className="w-4 h-4 text-[#C74747]" />
                  <h4 className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                    4. Confirmed Findings (Forensic Proof)
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-[#64748B]">
                  {attribution.confirmed_findings.map((find, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C74747] font-bold">•</span>
                      <span>{find}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EVIDENCE VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E9ED]">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Cryptographic Evidence Vault (SHA-256 Sealed)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Immutable evidence storage with automated cryptographic chain-of-custody audit logs
                  </p>
                </div>
                <button
                  onClick={() => setDepositOpen(true)}
                  className="px-4 py-2 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  <span>Deposit Evidence</span>
                </button>
              </div>

              <div className="divide-y divide-[#E5E9ED]">
                {vaultItems.map((item) => (
                  <div key={item.id} className="py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock size={15} className="text-[#315E63]" />
                        <span className="font-bold text-xs text-[#202A35]">{item.id}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#315E63]/10 text-[#315E63]">
                          {item.evidence_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Deposited: {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="p-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] font-mono text-xs text-[#202A35] break-all">
                      {item.raw_payload_preview}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#64748B] pt-1">
                      <span>
                        SHA-256 Seal: <strong className="font-mono text-[#315E63]">{item.file_hash_sha256}</strong>
                      </span>
                      <span>Source: {item.source_origin}</span>
                    </div>

                    {/* Chain of Custody History */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                        Chain of Custody Audit
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {item.chain_of_custody.map((log, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-[#F0F4F4] text-[#315E63] border border-[#E5E9ED]"
                          >
                            {log.action} by {log.user} ({new Date(log.timestamp).toLocaleTimeString()})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INVESTIGATION REPORT GENERATOR */}
        {activeTab === 'report' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E9ED]">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Structured Forensic Investigation Report
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Complete institutional report ready for security oversight and incident post-mortem
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white hover:bg-[#F0F4F4] text-[#315E63] border border-[#E5E9ED] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    <span>Print / PDF Export</span>
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="px-4 py-2 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={14} className={reportLoading ? 'animate-spin' : ''} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {report && (
                <div className="space-y-6 text-xs text-[#202A35]">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E9ED] grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Report ID</span>
                      <span className="font-mono font-bold text-xs">{report.report_id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Attack Vector</span>
                      <span className="font-bold text-xs text-[#C74747]">{report.attack_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Status</span>
                      <span className="font-bold text-xs text-[#27845A]">{report.investigation_status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Generated</span>
                      <span className="font-mono text-xs">{new Date(report.generated_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Incident Summary */}
                  <div>
                    <h4 className="font-bold text-sm text-[#202A35] mb-1">Executive Summary</h4>
                    <p className="p-3 rounded-xl bg-white border border-[#E5E9ED] leading-relaxed">
                      {report.incident_summary}
                    </p>
                  </div>

                  {/* Investigation Timeline */}
                  <div>
                    <h4 className="font-bold text-sm text-[#202A35] mb-2">Forensic Incident Timeline</h4>
                    <div className="space-y-2 border-l-2 border-[#315E63] pl-4">
                      {report.timeline.map((step, i) => (
                        <div key={i} className="relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#315E63] absolute -left-[21px] top-1" />
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {new Date(step.timestamp).toLocaleTimeString()} • {step.stage}
                          </span>
                          <p className="font-semibold text-xs mt-0.5">{step.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Containment Steps */}
                  <div>
                    <h4 className="font-bold text-sm text-[#202A35] mb-2">Recommended Containment Actions</h4>
                    <ul className="space-y-1.5 p-4 rounded-2xl bg-[#27845A]/10 border border-[#27845A]/25 text-[#202A35]">
                      {report.recommended_containment_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-[#27845A] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DEPOSIT EVIDENCE */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">
                  Deposit Forensics Asset into Vault
                </h3>
              </div>
              <button onClick={() => setDepositOpen(false)} className="text-[#64748B] hover:text-[#202A35]">
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositEvidence} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#202A35] block mb-1">Evidence Type</label>
                <select
                  value={newEvidenceType}
                  onChange={(e) => setNewEvidenceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                >
                  <option value="submitted_url">Submitted URL</option>
                  <option value="qr_image">QR Code Image</option>
                  <option value="decoded_payload">Decoded Payload</option>
                  <option value="server_log">Server Log Fragment</option>
                  <option value="screenshot">Reporter Screenshot</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Raw Payload or Evidence Text</label>
                <textarea
                  value={newEvidenceContent}
                  onChange={(e) => setNewEvidenceContent(e.target.value)}
                  placeholder="Paste URL, decoded QR string, or log data to seal..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] font-mono resize-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Source / Origin</label>
                <input
                  type="text"
                  value={newEvidenceOrigin}
                  onChange={(e) => setNewEvidenceOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#315E63] hover:bg-[#274c50] text-white font-bold cursor-pointer"
                >
                  Seal & Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationPage;
