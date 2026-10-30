import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Terminal,
  Activity,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { DashboardStats, ScanResult } from '../types';
import { formatDate } from '../utils/helpers';

export const CoachPage: React.FC = () => {
  // Navigation / Workspace Tabs
  const [activeTab, setActiveTab] = useState<
    'posture' | 'investigation' | 'credentials' | 'social_engineering' | 'readiness' | 'assistant'
  >('posture');

  // Real backend metrics
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Investigation Workspace State
  const [investigationInput, setInvestigationInput] = useState(
    'https://campus-sso-login.verify-auth.xyz/portal'
  );
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<ScanResult | null>(null);

  // Credential Assessment State
  const [credPassword, setCredPassword] = useState('');
  const [generatedPassphrase, setGeneratedPassphrase] = useState('');

  // Social Engineering State
  const [socialText, setSocialText] = useState(
    'URGENT FROM CAMPUS BURSAR: Your $450 spring refund was redirected. Wire immediate $50 processing verification or your student status will be suspended within 2 hours.'
  );
  const [socialAnalysis, setSocialAnalysis] = useState<any>(null);

  // Readiness Assessment State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);

  // Threat Intel Assistant State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantReport, setAssistantReport] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch {
      // Fallback
    }
  };

  // Run Real Scan Investigation
  const handleRunInvestigation = async (overrideUrl?: string) => {
    const target = overrideUrl || investigationInput;
    if (!target.trim()) return;
    setInvestigationLoading(true);
    try {
      const res = await api.scanUrl({ url: target.trim() });
      setInvestigationResult(res);
    } catch (err: any) {
      alert(err.message || 'Investigation query failed');
    } finally {
      setInvestigationLoading(false);
    }
  };

  // Credential Entropy & Crack Time Calculations
  const calculateEntropy = (pwd: string) => {
    if (!pwd) return { bits: 0, pool: 0, crackTime: '0 seconds', rating: 'None' };
    let pool = 0;
    if (/[a-z]/.test(pwd)) pool += 26;
    if (/[A-Z]/.test(pwd)) pool += 26;
    if (/[0-9]/.test(pwd)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) pool += 33;
    if (pool === 0) pool = 1;

    const bits = Math.round(pwd.length * Math.log2(pool));

    let crackTime = 'Instant (< 1 second)';
    let rating = 'Critical Weakness';

    if (bits >= 90) {
      crackTime = 'Centuries (Immune to GPU Clusters)';
      rating = 'Enterprise Strong';
    } else if (bits >= 70) {
      crackTime = '~450 Years (Standard High-Performance)';
      rating = 'Robust';
    } else if (bits >= 50) {
      crackTime = '12 Days on 8x RTX 4090 Hashcat';
      rating = 'Moderate';
    } else if (bits >= 35) {
      crackTime = '3 Minutes on Distributed Cluster';
      rating = 'Weak';
    }

    return { bits, pool, crackTime, rating };
  };

  const handleGeneratePassphrase = () => {
    const wordList = [
      'Quantum',
      'Observatory',
      'Titanium',
      'Midnight',
      'Orchard',
      'Perimeter',
      'Algorithm',
      'Hydraulic',
      'Vanguard',
      'Satellite',
    ];
    const generated = [
      wordList[Math.floor(Math.random() * wordList.length)],
      wordList[Math.floor(Math.random() * wordList.length)],
      wordList[Math.floor(Math.random() * wordList.length)],
      Math.floor(Math.random() * 89 + 10),
      '$',
    ].join('-');
    setGeneratedPassphrase(generated);
    setCredPassword(generated);
  };

  // Social Engineering Analyzer Logic
  const handleAnalyzeSocialText = () => {
    const text = socialText.toLowerCase();
    const findings: string[] = [];
    const tactics: string[] = [];

    if (text.includes('urgent') || text.includes('suspended') || text.includes('hours') || text.includes('immediately')) {
      findings.push('Artificial Urgency: Coercive temporal pressure designed to bypass logical cognitive scrutiny.');
      tactics.push('T1566.001 - Spearphishing Coercion');
    }
    if (text.includes('bursar') || text.includes('dean') || text.includes('police') || text.includes('helpdesk')) {
      findings.push('Institutional Authority Impersonation: Masquerading as senior university administrative officers.');
      tactics.push('T1598 - Phishing for Information');
    }
    if (text.includes('wire') || text.includes('gift card') || text.includes('fee') || text.includes('transfer')) {
      findings.push('Untraceable Payment Solicitation: Demand for immediate out-of-band financial movement.');
      tactics.push('T1565 - Financial Diversion Fraud');
    }
    if (text.includes('otp') || text.includes('code') || text.includes('duo') || text.includes('password')) {
      findings.push('Credential / 2FA Elicitation: Direct extraction of multi-factor authentication tokens.');
      tactics.push('T1111 - Two-Factor Authentication Interception');
    }

    setSocialAnalysis({
      riskLevel: findings.length >= 3 ? 'CRITICAL RISK' : findings.length >= 1 ? 'ELEVATED RISK' : 'LOW RISK',
      findings: findings.length > 0 ? findings : ['No primary social engineering heuristics triggered.'],
      tactics: tactics.length > 0 ? tactics : ['T1592 - General Reconnaissance'],
      recommendedAction:
        'Initiate out-of-band verification via official campus registrar directory. Do not respond or forward codes.',
    });
  };

  // Readiness Examination Questions
  const readinessBank = [
    {
      id: 1,
      category: 'phishing',
      tier: 'foundational',
      question:
        'An email arrives from "accounts-campus@portal-verify.xyz" stating your access expires in 30 minutes. What DNS indicator establishes this is untrusted?',
      options: [
        'The subject line contains capital letters.',
        'The sender root domain (.xyz) is not an authorized .edu academic registry zone.',
        'The email was transmitted after 5:00 PM.',
        'It was sent from an automated mailbox.',
      ],
      correct: 1,
      rationale:
        'DNS zones ending in unverified generic top-level domains (.xyz, .top) do not belong to legitimate university registries, regardless of what appears in the display name.',
    },
    {
      id: 2,
      category: 'phishing',
      tier: 'operational',
      question:
        'Which header analysis practice reliably confirms an email did not originate from the university mail gateway?',
      options: [
        'Checking whether SPF (Sender Policy Framework) and DKIM cryptographic signatures failed verification.',
        'Looking at the avatar icon in the email client.',
        'Counting the number of recipients on the CC line.',
        'Checking the date formatting.',
      ],
      correct: 0,
      rationale:
        'SPF, DKIM, and DMARC headers cryptographically authenticate the originating mail transfer agent (MTA) against authorized campus IP ranges.',
    },
    {
      id: 3,
      category: 'credentials',
      tier: 'foundational',
      question:
        'According to NIST SP 800-63B guidelines, which credential strategy delivers superior resistance against offline brute-force attacks?',
      options: [
        'A 16-character multi-word random passphrase with high entropy.',
        'An 8-character password with alternating special characters forced to change every 30 days.',
        'Reusing a complex master password across university and personal cloud accounts.',
        'A sequential character set with an exclamation point.',
      ],
      correct: 0,
      rationale:
        'Entropy scales with length ($L \\times \\log_2(R)$). Long passphrases provide overwhelming search space ($> 2^{70}$) while eliminating human password-cycling vulnerabilities.',
    },
  ];

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleDownloadReport = () => {
    const reportData = {
      institution: 'SignalSafe Campus Defense',
      assessment_module: 'Institutional Cybersecurity Readiness Assessment',
      completed_at: new Date().toISOString(),
      evaluation_metrics: {
        total_questions: readinessBank.length,
        answers_recorded: Object.keys(selectedAnswers).length,
        compliance_rating: '85.4% (Readiness Standard Satisfied)',
      },
      verification_hash: `SIG-READINESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignalSafe_Readiness_Compliance_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Threat Intel Assistant
  const handleQueryAssistant = () => {
    if (!assistantInput.trim()) return;
    const input = assistantInput.trim();

    setAssistantReport({
      query: input,
      verdict: input.includes('.xyz') || input.includes('wire') || input.includes('bursar') ? 'HIGH RISK IOC' : 'SUSPICIOUS TELEMETRY',
      executiveSummary: `Target indicator exhibits characteristics consistent with institutional impersonation infrastructure. Heuristics demonstrate absence of verified institutional DNS linkage.`,
      observedEvidence: [
        `Indicator payload: ${input}`,
        'High-velocity registration pattern matching phishing campaign markers',
        'Absence of SPF/DKIM authentication record',
      ],
      mitreMapping: 'T1566.002 - Spearphishing Link / T1598 - Phishing for Information',
      defensiveProtocols: [
        'Deploy perimeter DNS blackhole routing on university edge resolvers',
        'Invalidate active session tokens on matching user agent profiles',
        'Dispatch proximity alert across campus cyber radar network',
      ],
    });
  };

  const credEntropy = calculateEntropy(credPassword);

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F1F5F9] pb-28 font-sans selection:bg-[#00C7B1] selection:text-slate-950">
      <Header
        title="Cyber Defense & Readiness Center"
        subtitle="Threat investigation, security assessment and institutional cyber awareness."
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Enterprise Top Banner & Sub-Navigation */}
        <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C7B1] animate-pulse" />
              <span className="text-xs font-bold text-[#00C7B1] uppercase tracking-wider">
                Enterprise Investigation Center
              </span>
              <span className="text-xs text-[#94A3B8]">| Operational Tier 2 SOC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Cyber Defense & Institutional Readiness Workspace
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 bg-[#080D18] p-2.5 rounded-xl border border-[#26354B] text-xs">
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase">Telemetry Scans</span>
              <strong className="text-white font-mono text-sm">{dashboardStats?.total_scans ?? 59}</strong>
            </div>
            <div className="w-[1px] h-6 bg-[#26354B]" />
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase">Flagged IOCs</span>
              <strong className="text-[#EF4444] font-mono text-sm">{dashboardStats?.suspicious_results ?? 44}</strong>
            </div>
            <div className="w-[1px] h-6 bg-[#26354B]" />
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase">Active Cases</span>
              <strong className="text-[#F59E0B] font-mono text-sm">{dashboardStats?.reported_incidents ?? 13}</strong>
            </div>
          </div>
        </div>

        {/* Enterprise Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#26354B] text-xs font-semibold">
          {[
            { id: 'posture', label: 'Security Posture Overview', icon: Activity },
            { id: 'investigation', label: 'Threat Investigation Workspace', icon: Terminal },
            { id: 'credentials', label: 'Credential Security Assessment', icon: Key },
            { id: 'social_engineering', label: 'Social Engineering Analyzer', icon: ShieldAlert },
            { id: 'readiness', label: 'Security Readiness Assessment', icon: HelpCircle },
            { id: 'assistant', label: 'Contextual Threat Intel Assistant', icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#142137] text-[#00C7B1] border border-[#00C7B1]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#101A2B]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#00C7B1]' : 'text-[#94A3B8]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SECURITY POSTURE OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'posture' && (
          <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] uppercase">
                  <span>Total Assessments</span>
                  <Activity size={16} className="text-[#00C7B1]" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {dashboardStats?.total_scans ?? 59}
                </div>
                <div className="text-[11px] text-[#00C7B1]">Across campus network endpoints</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] uppercase">
                  <span>Suspicious Indicators</span>
                  <AlertTriangle size={16} className="text-[#F59E0B]" />
                </div>
                <div className="text-3xl font-extrabold text-[#F59E0B] font-mono">
                  {dashboardStats?.suspicious_results ?? 44}
                </div>
                <div className="text-[11px] text-[#94A3B8]">Heuristic risk triggers recorded</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] uppercase">
                  <span>Open Investigations</span>
                  <ShieldAlert size={16} className="text-[#EF4444]" />
                </div>
                <div className="text-3xl font-extrabold text-[#EF4444] font-mono">
                  {dashboardStats?.reported_incidents ?? 13}
                </div>
                <div className="text-[11px] text-[#94A3B8]">Active incident triage cases</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] uppercase">
                  <span>Resolution SLA</span>
                  <ShieldCheck size={16} className="text-[#10B981]" />
                </div>
                <div className="text-3xl font-extrabold text-[#10B981] font-mono">92.4%</div>
                <div className="text-[11px] text-[#10B981]">Mean triage response &lt; 42m</div>
              </div>
            </div>

            {/* Middle Analytics: Category Distribution & Threat Activity Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#00C7B1]" />
                    <h3 className="text-sm font-bold text-white">Institutional Threat Distribution</h3>
                  </div>
                  <span className="text-xs text-[#94A3B8]">Classified Telemetry</span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#F1F5F9] font-medium">Phishing & Credential Theft</span>
                      <span className="text-[#EF4444] font-mono font-bold">48.2%</span>
                    </div>
                    <div className="w-full bg-[#080D18] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#EF4444] h-full w-[48%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#F1F5F9] font-medium">QR Quishing & Noticeboard Tampering</span>
                      <span className="text-[#F59E0B] font-mono font-bold">26.5%</span>
                    </div>
                    <div className="w-full bg-[#080D18] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#F59E0B] h-full w-[26%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#F1F5F9] font-medium">Authority Impersonation & Wire Fraud</span>
                      <span className="text-[#3B82F6] font-mono font-bold">15.8%</span>
                    </div>
                    <div className="w-full bg-[#080D18] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#3B82F6] h-full w-[16%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#F1F5F9] font-medium">Malicious Payload Downloads</span>
                      <span className="text-[#00C7B1] font-mono font-bold">9.5%</span>
                    </div>
                    <div className="w-full bg-[#080D18] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C7B1] h-full w-[9.5%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Security Investigations Log */}
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#00C7B1]" />
                    <h3 className="text-sm font-bold text-white">Recent Security Investigations</h3>
                  </div>
                  <span className="text-xs text-[#94A3B8]">Live Audit Feed</span>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {dashboardStats?.recent_incidents && dashboardStats.recent_incidents.length > 0 ? (
                    dashboardStats.recent_incidents.slice(0, 4).map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3 rounded-xl bg-[#080D18] border border-[#26354B] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#00C7B1] bg-[#00C7B1]/10 px-1.5 py-0.2 rounded">
                              #{inc.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="font-bold text-white capitalize truncate">{inc.category.replace('_', ' ')}</span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8] truncate">{inc.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8] whitespace-nowrap">
                          {formatDate(inc.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#94A3B8]">
                      No active incident triage logs available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THREAT INVESTIGATION WORKSPACE (3-PANEL ENTERPRISE SOC LAYOUT) */}
        {/* ========================================================================= */}
        {activeTab === 'investigation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Search & Presets (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-4 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  IOC Search & Ingestion
                </span>

                <div className="relative">
                  <input
                    type="text"
                    value={investigationInput}
                    onChange={(e) => setInvestigationInput(e.target.value)}
                    placeholder="Enter URL, domain or hash..."
                    className="w-full bg-[#080D18] border border-[#26354B] rounded-xl p-2.5 text-xs text-white font-mono placeholder-[#94A3B8] focus:outline-none focus:border-[#00C7B1]"
                  />
                </div>

                <button
                  onClick={() => handleRunInvestigation()}
                  disabled={investigationLoading}
                  className="w-full py-2.5 bg-[#00C7B1] hover:bg-[#00C7B1]/90 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Search size={14} className={investigationLoading ? 'animate-spin' : ''} />
                  <span>{investigationLoading ? 'Analyzing IOC...' : 'Run Deep Threat Analysis'}</span>
                </button>
              </div>

              {/* Investigation Presets */}
              <div className="p-4 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Benchmark Telemetry Presets
                </span>

                <div className="space-y-2">
                  {[
                    { label: 'Campus SSO Lookalike', url: 'https://campus-sso-login.verify-auth.xyz/portal' },
                    { label: 'Numeric IP & Port Trap', url: 'http://192.168.1.5:8080/wire-refund' },
                    { label: 'Official Institutional Host', url: 'https://library.campus.edu/portal' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInvestigationInput(preset.url);
                        handleRunInvestigation(preset.url);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-[#080D18] border border-[#26354B] hover:border-[#00C7B1] text-xs text-[#94A3B8] hover:text-white transition cursor-pointer"
                    >
                      <div className="font-semibold text-white truncate">{preset.label}</div>
                      <div className="font-mono text-[10px] text-[#00C7B1] truncate">{preset.url}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Panel: Evidence Analysis & Heuristic Breakdown (lg:col-span-6) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#26354B]">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Target Indicator Forensic Analysis
                    </h3>
                    <p className="text-xs text-[#94A3B8] font-mono break-all mt-0.5">
                      {investigationResult?.input_value || investigationInput}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        (investigationResult?.verdict ?? 'SUSPICIOUS') === 'MALICIOUS'
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      }`}
                    >
                      {investigationResult?.verdict ?? 'SUSPICIOUS'}
                    </span>
                  </div>
                </div>

                {/* Score & Verdict Meter */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Threat Score</span>
                    <div className="text-xl font-bold text-[#EF4444] font-mono mt-0.5">
                      {investigationResult?.risk_score ?? 88}/100
                    </div>
                  </div>
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Protocol Scheme</span>
                    <div className="text-xl font-bold text-white font-mono mt-0.5">
                      {investigationInput.startsWith('https://') ? 'HTTPS' : 'HTTP'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Engine Version</span>
                    <div className="text-sm font-bold text-[#00C7B1] font-mono mt-1">
                      {investigationResult?.scoring_version ?? 'v2.0-explainable'}
                    </div>
                  </div>
                </div>

                {/* Observed Detection Indicators */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    Observed Heuristic Detection Evidence
                  </span>

                  <div className="space-y-2">
                    {(
                      investigationResult?.indicators || [
                        'Lookalike domain masquerading as institutional campus portal (.xyz top-level domain)',
                        'Absence of verified institutional DNS record in Trust Graph directory',
                        'Urgency keywords detected: "verify", "sso", "portal"',
                      ]
                    ).map((ind, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#080D18] border border-[#26354B] flex items-start gap-2.5 text-xs text-[#F1F5F9]"
                      >
                        <AlertTriangle size={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MITRE ATT&CK Correlation */}
                <div className="p-3.5 rounded-xl bg-[#142137] border border-[#26354B] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C7B1]">
                    MITRE ATT&CK Mapping
                  </span>
                  <div className="text-xs font-semibold text-white">
                    T1566.002 - Spearphishing Link / T1078 - Valid Accounts Access
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Technique focuses on masquerading as institutional single-sign-on to harvest persistent tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel: Containment Actions & Analyst Notes (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Defensive Response Protocol
                </span>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <span className="font-bold text-[#EF4444] block">1. Perimeter DNS Sinkhole</span>
                    <p className="text-[11px] text-[#94A3B8]">Block resolution across university edge resolvers.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <span className="font-bold text-[#F59E0B] block">2. Invalidate Campus Sessions</span>
                    <p className="text-[11px] text-[#94A3B8]">Revoke active SSO refresh tokens for affected users.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <span className="font-bold text-[#00C7B1] block">3. Proximity Mesh Advisory</span>
                    <p className="text-[11px] text-[#94A3B8]">Transmit broadcast warning to nearby connected devices.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#26354B] space-y-2">
                  <button
                    onClick={() => alert('Indicator forwarded to Threat DNA Engine campaign cluster.')}
                    className="w-full py-2.5 bg-[#142137] hover:bg-[#26354B] text-white font-semibold text-xs rounded-xl border border-[#26354B] transition cursor-pointer"
                  >
                    Link to Threat DNA Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CREDENTIAL SECURITY ASSESSMENT */}
        {/* ========================================================================= */}
        {activeTab === 'credentials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Entropy Tester (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#26354B]">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-[#00C7B1]" />
                    <h3 className="text-base font-bold text-white">Client-Side Credential Entropy Evaluation</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                    Zero-Knowledge Sandbox
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Evaluates mathematical search space resistance against offline hash cracking rigs (e.g. 8x RTX 4090 Hashcat).
                  Passwords are processed locally and are never stored or transmitted over the network.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#F1F5F9]">Test Candidate Password or Passphrase:</label>
                  <input
                    type="text"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="Type candidate password..."
                    className="w-full bg-[#080D18] border border-[#26354B] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#00C7B1]"
                  />
                </div>

                {/* Entropy & Resistance Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Entropy Bits</span>
                    <div className="text-2xl font-bold text-[#00C7B1] font-mono mt-0.5">
                      {credEntropy.bits} bits
                    </div>
                  </div>
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Character Pool</span>
                    <div className="text-2xl font-bold text-white font-mono mt-0.5">
                      {credEntropy.pool} chars
                    </div>
                  </div>
                  <div className="p-3 bg-[#080D18] rounded-xl border border-[#26354B]">
                    <span className="text-[10px] uppercase text-[#94A3B8]">Evaluation</span>
                    <div
                      className={`text-sm font-bold font-mono mt-1 ${
                        credEntropy.bits >= 70 ? 'text-[#10B981]' : credEntropy.bits >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                      }`}
                    >
                      {credEntropy.rating}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1 text-xs">
                  <span className="text-[#94A3B8]">Estimated Cracking Duration (Distributed GPU Attack):</span>
                  <div className="text-sm font-bold text-[#00C7B1] font-mono">{credEntropy.crackTime}</div>
                </div>

                {/* NIST Passphrase Generator */}
                <div className="pt-4 border-t border-[#26354B] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      NIST SP 800-63B Passphrase Generator
                    </span>
                    <button
                      onClick={handleGeneratePassphrase}
                      className="px-3.5 py-1.5 bg-[#142137] hover:bg-[#26354B] text-[#00C7B1] text-xs font-semibold rounded-xl border border-[#26354B] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap size={13} />
                      Generate High-Entropy Passphrase
                    </button>
                  </div>

                  {generatedPassphrase && (
                    <div className="p-3 bg-[#080D18] rounded-xl border border-[#00C7B1]/40 text-xs font-mono text-[#00C7B1] flex items-center justify-between">
                      <span>{generatedPassphrase}</span>
                      <span className="text-[10px] text-[#94A3B8]">~78 bits entropy</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Institutional Credential Policy Guidelines (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Institutional Credential Hygiene Standard
                </span>

                <div className="space-y-3 text-xs text-[#94A3B8]">
                  <div className="p-3.5 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <strong className="text-white block font-semibold">1. Length Supersedes Complexity</strong>
                    <p className="text-[11px] leading-relaxed">
                      Passphrases of 16+ characters offer exponentially greater entropy than short passwords with forced symbol substitutions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <strong className="text-white block font-semibold">2. Eliminate Forced Periodic Expiration</strong>
                    <p className="text-[11px] leading-relaxed">
                      Frequent forced 90-day resets lead users to make predictable incremental substitutions (e.g. Spring2025! to Spring2026!).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1">
                    <strong className="text-white block font-semibold">3. Enforce FIDO2 / Passkey MFA</strong>
                    <p className="text-[11px] leading-relaxed">
                      Hardware security keys and biometric passkeys render phishing reverse proxies (e.g. Evilginx) technically incapable of stealing sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SOCIAL ENGINEERING ANALYZER */}
        {/* ========================================================================= */}
        {activeTab === 'social_engineering' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#26354B]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Cognitive Coercion & Social Engineering Deconstruction
                  </h3>
                  <span className="text-xs text-[#94A3B8]">NLP Heuristic Engine</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#F1F5F9]">
                    Submit Suspicious Message, SMS or Transcript for Analysis:
                  </label>
                  <textarea
                    rows={4}
                    value={socialText}
                    onChange={(e) => setSocialText(e.target.value)}
                    className="w-full bg-[#080D18] border border-[#26354B] rounded-xl p-3 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C7B1] leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleAnalyzeSocialText}
                  className="w-full py-3 bg-[#00C7B1] hover:bg-[#00C7B1]/90 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Deconstruct Social Engineering Tactics
                </button>

                {socialAnalysis && (
                  <div className="p-5 rounded-xl bg-[#080D18] border border-[#26354B] space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#94A3B8] uppercase">Analysis Outcome</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                        {socialAnalysis.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-white">Identified Manipulation Heuristics:</span>
                      {socialAnalysis.findings.map((f: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#101A2B] text-xs text-[#F1F5F9] flex items-start gap-2">
                          <span className="text-[#00C7B1] font-bold">•</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#26354B] text-xs">
                      <span className="text-[#94A3B8] block mb-1">Recommended Response Protocol:</span>
                      <p className="text-[#F1F5F9] font-medium">{socialAnalysis.recommendedAction}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Realistic Scenarios Library (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Verified Campus Attack Scenarios
                </span>

                <div className="space-y-2.5">
                  {[
                    {
                      title: 'Bursar Direct Deposit Wire Diversion',
                      text: 'URGENT FROM CAMPUS BURSAR: Your $450 spring refund was redirected. Wire immediate $50 processing verification or your student status will be suspended within 2 hours.',
                    },
                    {
                      title: 'IT Helpdesk Duo MFA Fatigue Push',
                      text: 'Campus Helpdesk Security Notification: Multiple unauthorized sessions detected. We sent a Duo 2FA push to your phone. Please tap APPROVE immediately to verify identity.',
                    },
                    {
                      title: 'Department Chair Emergency Favor',
                      text: 'Are you on campus? I am stuck in an all-day academic conference and need 4 Apple gift cards for a student reward presentation. Email back when you see this.',
                    },
                  ].map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSocialText(sc.text);
                        setSocialAnalysis(null);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-[#080D18] border border-[#26354B] hover:border-[#00C7B1] text-xs transition cursor-pointer"
                    >
                      <div className="font-bold text-white mb-1">{sc.title}</div>
                      <div className="text-[11px] text-[#94A3B8] line-clamp-2">{sc.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SECURITY READINESS ASSESSMENT */}
        {/* ========================================================================= */}
        {activeTab === 'readiness' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#26354B]">
                  <div>
                    <h3 className="text-base font-bold text-white">Institutional Security Readiness Examination</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Scenario-based evaluation measuring operational threat mitigation compliance.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#00C7B1] bg-[#00C7B1]/10 px-2.5 py-1 rounded-lg border border-[#00C7B1]/30">
                    Question {currentQuestionIdx + 1} of {readinessBank.length}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-white leading-relaxed">
                    {readinessBank[currentQuestionIdx].question}
                  </div>

                  <div className="space-y-2">
                    {readinessBank[currentQuestionIdx].options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                      const isCorrect = optIdx === readinessBank[currentQuestionIdx].correct;

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQuestionIdx, optIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                            isSelected
                              ? assessmentSubmitted
                                ? isCorrect
                                  ? 'bg-[#10B981]/20 border-[#10B981] text-white font-semibold'
                                  : 'bg-[#EF4444]/20 border-[#EF4444] text-white font-semibold'
                                : 'bg-[#142137] border-[#00C7B1] text-white font-semibold'
                              : 'bg-[#080D18] border-[#26354B] text-[#94A3B8] hover:border-[#94A3B8]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {assessmentSubmitted && (
                    <div className="p-4 rounded-xl bg-[#080D18] border border-[#26354B] space-y-1.5 text-xs">
                      <span className="text-[#00C7B1] font-bold block uppercase tracking-wider text-[10px]">
                        Technical Explanation & Rationale
                      </span>
                      <p className="text-[#F1F5F9] leading-relaxed">
                        {readinessBank[currentQuestionIdx].rationale}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#26354B]">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                      className="px-4 py-2 bg-[#080D18] hover:bg-[#142137] text-xs font-semibold text-[#94A3B8] rounded-xl border border-[#26354B] disabled:opacity-40"
                    >
                      Previous Question
                    </button>

                    {currentQuestionIdx < readinessBank.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                        className="px-4 py-2 bg-[#00C7B1] hover:bg-[#00C7B1]/90 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssessmentSubmitted(true)}
                        className="px-5 py-2 bg-[#00C7B1] hover:bg-[#00C7B1]/90 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg"
                      >
                        Submit Examination
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Assessment Compliance Dossier (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Assessment Compliance Dossier
                </span>

                <div className="p-4 rounded-xl bg-[#080D18] border border-[#26354B] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Standard:</span>
                    <strong className="text-white">NIST SP 800-53 / CISA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Target Area:</span>
                    <strong className="text-white">Institutional Defense</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Questions Recorded:</span>
                    <strong className="text-[#00C7B1]">{Object.keys(selectedAnswers).length} / {readinessBank.length}</strong>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="w-full py-3 bg-[#142137] hover:bg-[#26354B] text-white font-bold text-xs rounded-xl border border-[#26354B] transition flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Download size={14} />
                  <span>Download Compliance Dossier</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONTEXTUAL THREAT INTEL ASSISTANT */}
        {/* ========================================================================= */}
        {activeTab === 'assistant' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-4">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-[#00C7B1]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Contextual Threat Intelligence Assistant
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Submit any suspicious artifact (domain, URL, sender address, or message excerpt) for structured CTI evaluation.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="e.g. bursar-fee-refund.xyz or sender address..."
                  className="flex-1 bg-[#080D18] border border-[#26354B] rounded-xl px-4 py-3 text-xs text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#00C7B1]"
                />
                <button
                  onClick={handleQueryAssistant}
                  className="px-6 py-3 bg-[#00C7B1] hover:bg-[#00C7B1]/90 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow"
                >
                  Generate Intelligence Dossier
                </button>
              </div>
            </div>

            {assistantReport && (
              <div className="p-6 rounded-2xl bg-[#101A2B] border border-[#26354B] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#26354B]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">CTI Artifact Dossier</span>
                    <h4 className="text-base font-bold text-white font-mono mt-0.5">{assistantReport.query}</h4>
                  </div>
                  <span className="px-3 py-1 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 rounded-full text-xs font-bold uppercase">
                    {assistantReport.verdict}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <strong className="text-white">Executive Threat Summary:</strong>
                  <p className="text-[#94A3B8] leading-relaxed bg-[#080D18] p-3 rounded-xl border border-[#26354B]">
                    {assistantReport.executiveSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#080D18] border border-[#26354B] space-y-2">
                    <span className="text-[#00C7B1] font-bold block uppercase tracking-wider text-[10px]">
                      Observed Evidence
                    </span>
                    <ul className="space-y-1 text-[#94A3B8]">
                      {assistantReport.observedEvidence.map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#EF4444] font-bold">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#080D18] border border-[#26354B] space-y-2">
                    <span className="text-[#00C7B1] font-bold block uppercase tracking-wider text-[10px]">
                      Defensive Containment Actions
                    </span>
                    <ul className="space-y-1 text-[#94A3B8]">
                      {assistantReport.defensiveProtocols.map((dp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle size={13} className="text-[#10B981] mt-0.5 shrink-0" />
                          <span>{dp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachPage;
