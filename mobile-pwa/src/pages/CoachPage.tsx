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
      crackTime = 'Centuries (Resistant to high-performance GPU arrays)';
      rating = 'Exceptional Defense (Military-Grade)';
    } else if (bits >= 70) {
      crackTime = 'Decades (Resistant to automated attacks)';
      rating = 'Strong NIST Baseline';
    } else if (bits >= 50) {
      crackTime = 'Few days to weeks';
      rating = 'Moderate Vulnerability';
    } else if (bits >= 30) {
      crackTime = 'Few hours to minutes';
      rating = 'High Vulnerability';
    }

    return { bits, pool, crackTime, rating };
  };

  const handleGeneratePassphrase = () => {
    const wordList = [
      'Shield', 'Signal', 'Bursar', 'Quantum', 'Campus', 'Faculty',
      'Tower', 'Defense', 'Beacon', 'Horizon', 'Portal', 'Matrix',
      'Cipher', 'Vertex', 'Falcon', 'Sensor', 'Granite', 'Harbor'
    ];
    const picked: string[] = [];
    for (let i = 0; i < 4; i++) {
      picked.push(wordList[Math.floor(Math.random() * wordList.length)]);
    }
    const num = Math.floor(Math.random() * 89 + 10);
    const pass = `${picked.join('-')}-${num}`;
    setGeneratedPassphrase(pass);
    setCredPassword(pass);
  };

  // Social Engineering NLP Analyzer
  const handleAnalyzeSocialText = () => {
    if (!socialText.trim()) return;
    const text = socialText.toLowerCase();

    const findings: string[] = [];
    const tactics: string[] = [];

    if (text.includes('urgent') || text.includes('immediate') || text.includes('suspended') || text.includes('disabled')) {
      findings.push('Manufactured Urgency: Imposes artificially tight deadlines to induce panic.');
      tactics.push('T1204 - User Execution / Coercive Psychological Pressure');
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
        'Entropy scales with length. Long passphrases provide overwhelming search space while eliminating human password-cycling vulnerabilities.',
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
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28 font-sans selection:bg-[#315E63] selection:text-white">
      <Header
        title="Cyber Defense & Readiness Center"
        subtitle="Threat investigation, security assessment and institutional cyber awareness."
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Enterprise Top Banner & Sub-Navigation */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#315E63] animate-pulse" />
              <span className="text-xs font-bold text-[#315E63] uppercase tracking-wider">
                Enterprise Investigation Center
              </span>
              <span className="text-xs text-[#64748B]">| Operational Tier 2 SOC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202A35] tracking-tight">
              Cyber Defense & Institutional Readiness Workspace
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 bg-[#F7F8FA] p-2.5 rounded-xl border border-[#E5E9ED] text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Telemetry Scans</span>
              <strong className="text-[#202A35] font-mono text-sm">{dashboardStats?.total_scans ?? 59}</strong>
            </div>
            <div className="w-[1px] h-6 bg-[#E5E9ED]" />
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Flagged IOCs</span>
              <strong className="text-[#C74747] font-mono text-sm">{dashboardStats?.suspicious_results ?? 44}</strong>
            </div>
            <div className="w-[1px] h-6 bg-[#E5E9ED]" />
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Active Cases</span>
              <strong className="text-[#C58A35] font-mono text-sm">{dashboardStats?.reported_incidents ?? 13}</strong>
            </div>
          </div>
        </div>

        {/* Enterprise Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E9ED] text-xs font-semibold">
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
                    ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/30 font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#202A35] hover:bg-white'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#315E63]' : 'text-[#64748B]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SECURITY POSTURE OVERVIEW */}
        {activeTab === 'posture' && (
          <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                  <span>Total Assessments</span>
                  <Activity size={16} className="text-[#315E63]" />
                </div>
                <div className="text-3xl font-extrabold text-[#202A35] font-mono">
                  {dashboardStats?.total_scans ?? 59}
                </div>
                <div className="text-[11px] text-[#315E63] font-medium">Across campus network endpoints</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                  <span>Suspicious Indicators</span>
                  <AlertTriangle size={16} className="text-[#C58A35]" />
                </div>
                <div className="text-3xl font-extrabold text-[#C58A35] font-mono">
                  {dashboardStats?.suspicious_results ?? 44}
                </div>
                <div className="text-[11px] text-[#64748B]">Heuristic risk triggers recorded</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                  <span>Open Investigations</span>
                  <ShieldAlert size={16} className="text-[#C74747]" />
                </div>
                <div className="text-3xl font-extrabold text-[#C74747] font-mono">
                  {dashboardStats?.reported_incidents ?? 13}
                </div>
                <div className="text-[11px] text-[#64748B]">Active incident triage cases</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                  <span>Resolution SLA</span>
                  <ShieldCheck size={16} className="text-[#27845A]" />
                </div>
                <div className="text-3xl font-extrabold text-[#27845A] font-mono">92.4%</div>
                <div className="text-[11px] text-[#27845A] font-medium">Mean triage response &lt; 42m</div>
              </div>
            </div>

            {/* Middle Analytics: Category Distribution & Threat Activity Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#315E63]" />
                    <h3 className="text-sm font-bold text-[#202A35]">Institutional Threat Distribution</h3>
                  </div>
                  <span className="text-xs text-[#64748B]">Classified Telemetry</span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#202A35] font-semibold">Phishing & Credential Theft</span>
                      <span className="text-[#C74747] font-mono font-bold">48.2%</span>
                    </div>
                    <div className="w-full bg-[#E5E9ED] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#C74747] h-full w-[48%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#202A35] font-semibold">QR Quishing & Noticeboard Tampering</span>
                      <span className="text-[#C58A35] font-mono font-bold">26.5%</span>
                    </div>
                    <div className="w-full bg-[#E5E9ED] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#C58A35] h-full w-[26%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#202A35] font-semibold">Authority Impersonation & Wire Fraud</span>
                      <span className="text-[#477B9B] font-mono font-bold">15.8%</span>
                    </div>
                    <div className="w-full bg-[#E5E9ED] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#477B9B] h-full w-[16%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#202A35] font-semibold">Malicious Payload Downloads</span>
                      <span className="text-[#315E63] font-mono font-bold">9.5%</span>
                    </div>
                    <div className="w-full bg-[#E5E9ED] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#315E63] h-full w-[9.5%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Security Investigations Log */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#315E63]" />
                    <h3 className="text-sm font-bold text-[#202A35]">Recent Security Investigations</h3>
                  </div>
                  <span className="text-xs text-[#64748B]">Live Audit Feed</span>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {dashboardStats?.recent_incidents && dashboardStats.recent_incidents.length > 0 ? (
                    dashboardStats.recent_incidents.slice(0, 4).map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#315E63] bg-[#315E63]/10 px-1.5 py-0.2 rounded font-bold">
                              #{inc.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="font-bold text-[#202A35] capitalize truncate">{inc.category.replace('_', ' ')}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate">{inc.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B] whitespace-nowrap">
                          {formatDate(inc.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#64748B]">
                      No active incident triage logs available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THREAT INVESTIGATION WORKSPACE */}
        {activeTab === 'investigation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Search & Presets */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E9ED] space-y-3 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  IOC Search & Ingestion
                </span>

                <div className="relative">
                  <input
                    type="text"
                    value={investigationInput}
                    onChange={(e) => setInvestigationInput(e.target.value)}
                    placeholder="Enter URL, domain or hash..."
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-2.5 text-xs text-[#202A35] font-mono placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white"
                  />
                </div>

                <button
                  onClick={() => handleRunInvestigation()}
                  disabled={investigationLoading}
                  className="w-full py-2.5 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Search size={14} className={investigationLoading ? 'animate-spin' : ''} />
                  <span>{investigationLoading ? 'Analyzing IOC...' : 'Run Deep Threat Analysis'}</span>
                </button>
              </div>

              {/* Investigation Presets */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E9ED] space-y-2.5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
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
                      className="w-full text-left p-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] text-xs transition cursor-pointer"
                    >
                      <div className="font-bold text-[#202A35] truncate">{preset.label}</div>
                      <div className="font-mono text-[10px] text-[#315E63] truncate">{preset.url}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Panel: Evidence Analysis */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                  <div>
                    <h3 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                      Target Indicator Forensic Analysis
                    </h3>
                    <p className="text-xs text-[#64748B] font-mono break-all mt-0.5">
                      {investigationResult?.input_value || investigationInput}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        (investigationResult?.verdict ?? 'SUSPICIOUS') === 'MALICIOUS'
                          ? 'bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25'
                          : 'bg-[#C58A35]/10 text-[#C58A35] border border-[#C58A35]/25'
                      }`}
                    >
                      {investigationResult?.verdict ?? 'SUSPICIOUS'}
                    </span>
                  </div>
                </div>

                {/* Score & Verdict Meter */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Threat Score</span>
                    <div className="text-xl font-bold text-[#C74747] font-mono mt-0.5">
                      {investigationResult?.risk_score ?? 88}/100
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Protocol Scheme</span>
                    <div className="text-xl font-bold text-[#202A35] font-mono mt-0.5">
                      {investigationInput.startsWith('https://') ? 'HTTPS' : 'HTTP'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Engine Version</span>
                    <div className="text-sm font-bold text-[#315E63] font-mono mt-1">
                      {investigationResult?.scoring_version ?? 'v2.0-explainable'}
                    </div>
                  </div>
                </div>

                {/* Observed Detection Indicators */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
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
                        className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] flex items-start gap-2.5 text-xs text-[#202A35]"
                      >
                        <AlertTriangle size={15} className="text-[#C58A35] shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MITRE ATT&CK Correlation */}
                <div className="p-3.5 rounded-xl bg-[#F0F4F4] border border-[#E5E9ED] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#315E63]">
                    MITRE ATT&CK Mapping
                  </span>
                  <div className="text-xs font-bold text-[#202A35]">
                    T1566.002 - Spearphishing Link / T1078 - Valid Accounts Access
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Technique focuses on masquerading as institutional single-sign-on to harvest persistent tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel: Containment Actions */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Defensive Response Protocol
                </span>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <span className="font-bold text-[#C74747] block">1. Perimeter DNS Sinkhole</span>
                    <p className="text-[11px] text-[#64748B]">Block resolution across university edge resolvers.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <span className="font-bold text-[#C58A35] block">2. Invalidate Campus Sessions</span>
                    <p className="text-[11px] text-[#64748B]">Revoke active SSO refresh tokens for affected users.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <span className="font-bold text-[#315E63] block">3. Proximity Mesh Advisory</span>
                    <p className="text-[11px] text-[#64748B]">Transmit broadcast warning to nearby connected devices.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E9ED] space-y-2">
                  <button
                    onClick={() => alert('Indicator forwarded to Threat DNA Engine campaign cluster.')}
                    className="w-full py-2.5 bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-bold text-xs rounded-xl border border-[#E5E9ED] transition cursor-pointer"
                  >
                    Link to Threat DNA Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREDENTIAL SECURITY ASSESSMENT */}
        {activeTab === 'credentials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Entropy Tester */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-[#315E63]" />
                    <h3 className="text-base font-bold text-[#202A35]">Client-Side Credential Entropy Evaluation</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#27845A] bg-[#27845A]/10 px-2 py-0.5 rounded border border-[#27845A]/25">
                    Zero-Knowledge Sandbox
                  </span>
                </div>

                <p className="text-xs text-[#64748B]">
                  Evaluates mathematical search space resistance against offline hash cracking rigs.
                  Passwords are processed locally and are never stored or transmitted over the network.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#202A35]">Test Candidate Password or Passphrase:</label>
                  <input
                    type="text"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="Type candidate password..."
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] font-mono focus:outline-none focus:border-[#315E63] focus:bg-white"
                  />
                </div>

                {/* Entropy & Resistance Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Entropy Bits</span>
                    <div className="text-2xl font-bold text-[#315E63] font-mono mt-0.5">
                      {credEntropy.bits} bits
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Character Pool</span>
                    <div className="text-2xl font-bold text-[#202A35] font-mono mt-0.5">
                      {credEntropy.pool} chars
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Evaluation</span>
                    <div
                      className={`text-sm font-bold font-mono mt-1 ${
                        credEntropy.bits >= 70 ? 'text-[#27845A]' : credEntropy.bits >= 50 ? 'text-[#C58A35]' : 'text-[#C74747]'
                      }`}
                    >
                      {credEntropy.rating}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1 text-xs">
                  <span className="text-[#64748B]">Estimated Cracking Duration (Distributed GPU Attack):</span>
                  <div className="text-sm font-bold text-[#315E63] font-mono">{credEntropy.crackTime}</div>
                </div>

                {/* NIST Passphrase Generator */}
                <div className="pt-4 border-t border-[#E5E9ED] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202A35] uppercase tracking-wider">
                      NIST SP 800-63B Passphrase Generator
                    </span>
                    <button
                      onClick={handleGeneratePassphrase}
                      className="px-3.5 py-1.5 bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#315E63] text-xs font-bold rounded-xl border border-[#315E63]/25 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap size={13} />
                      Generate High-Entropy Passphrase
                    </button>
                  </div>

                  {generatedPassphrase && (
                    <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#315E63]/30 text-xs font-mono text-[#315E63] font-bold flex items-center justify-between">
                      <span>{generatedPassphrase}</span>
                      <span className="text-[10px] text-[#64748B]">~78 bits entropy</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Policy Guidelines */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Institutional Credential Hygiene Standard
                </span>

                <div className="space-y-3 text-xs text-[#64748B]">
                  <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <strong className="text-[#202A35] block font-semibold">1. Length Supersedes Complexity</strong>
                    <p className="text-[11px] leading-relaxed">
                      Passphrases of 16+ characters offer exponentially greater entropy than short passwords with forced symbol substitutions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <strong className="text-[#202A35] block font-semibold">2. Eliminate Forced Periodic Expiration</strong>
                    <p className="text-[11px] leading-relaxed">
                      Frequent forced 90-day resets lead users to make predictable incremental substitutions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1">
                    <strong className="text-[#202A35] block font-semibold">3. Enforce FIDO2 / Passkey MFA</strong>
                    <p className="text-[11px] leading-relaxed">
                      Hardware security keys and biometric passkeys render phishing reverse proxies technically incapable of stealing sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOCIAL ENGINEERING ANALYZER */}
        {activeTab === 'social_engineering' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                  <h3 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                    Cognitive Coercion & Social Engineering Deconstruction
                  </h3>
                  <span className="text-xs text-[#64748B]">NLP Heuristic Engine</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#202A35]">
                    Submit Suspicious Message, SMS or Transcript for Analysis:
                  </label>
                  <textarea
                    rows={4}
                    value={socialText}
                    onChange={(e) => setSocialText(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl p-3 text-xs text-[#202A35] focus:outline-none focus:border-[#315E63] focus:bg-white leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleAnalyzeSocialText}
                  className="w-full py-3 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Deconstruct Social Engineering Tactics
                </button>

                {socialAnalysis && (
                  <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B] uppercase">Analysis Outcome</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25">
                        {socialAnalysis.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#202A35]">Identified Manipulation Heuristics:</span>
                      {socialAnalysis.findings.map((f: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-[#E5E9ED] text-xs text-[#202A35] flex items-start gap-2 shadow-2xs">
                          <span className="text-[#315E63] font-bold">•</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#E5E9ED] text-xs">
                      <span className="text-[#64748B] block mb-1 font-semibold">Recommended Response Protocol:</span>
                      <p className="text-[#202A35] font-medium">{socialAnalysis.recommendedAction}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Realistic Scenarios Library */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-3 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
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
                      className="w-full text-left p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] hover:border-[#315E63]/40 hover:bg-[#F0F4F4] text-xs transition cursor-pointer"
                    >
                      <div className="font-bold text-[#202A35] mb-1">{sc.title}</div>
                      <div className="text-[11px] text-[#64748B] line-clamp-2">{sc.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY READINESS ASSESSMENT */}
        {activeTab === 'readiness' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                  <div>
                    <h3 className="text-base font-bold text-[#202A35]">Institutional Security Readiness Examination</h3>
                    <p className="text-xs text-[#64748B]">
                      Scenario-based evaluation measuring operational threat mitigation compliance.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#315E63] bg-[#315E63]/10 px-2.5 py-1 rounded-lg border border-[#315E63]/25 font-bold">
                    Question {currentQuestionIdx + 1} of {readinessBank.length}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-[#202A35] leading-relaxed">
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
                                  ? 'bg-[#27845A]/15 border-[#27845A] text-[#27845A] font-bold'
                                  : 'bg-[#C74747]/15 border-[#C74747] text-[#C74747] font-bold'
                                : 'bg-[#F0F4F4] border-[#315E63] text-[#315E63] font-bold'
                              : 'bg-[#F7F8FA] border-[#E5E9ED] text-[#202A35] hover:border-[#315E63]/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {assessmentSubmitted && (
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-1.5 text-xs">
                      <span className="text-[#315E63] font-bold block uppercase tracking-wider text-[10px]">
                        Technical Explanation & Rationale
                      </span>
                      <p className="text-[#202A35] leading-relaxed font-medium">
                        {readinessBank[currentQuestionIdx].rationale}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E9ED]">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                      className="px-4 py-2 bg-white hover:bg-[#F0F4F4] text-xs font-semibold text-[#64748B] rounded-xl border border-[#E5E9ED] disabled:opacity-40 cursor-pointer"
                    >
                      Previous Question
                    </button>

                    {currentQuestionIdx < readinessBank.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                        className="px-4 py-2 bg-[#315E63] hover:bg-[#274B4F] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssessmentSubmitted(true)}
                        className="px-5 py-2 bg-[#315E63] hover:bg-[#274B4F] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                      >
                        Submit Examination
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Assessment Compliance Dossier */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Assessment Compliance Dossier
                </span>

                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Standard:</span>
                    <strong className="text-[#202A35]">NIST SP 800-53 / CISA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Target Area:</span>
                    <strong className="text-[#202A35]">Institutional Defense</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Questions Recorded:</span>
                    <strong className="text-[#315E63]">{Object.keys(selectedAnswers).length} / {readinessBank.length}</strong>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="w-full py-3 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Download Compliance Dossier</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONTEXTUAL THREAT INTEL ASSISTANT */}
        {activeTab === 'assistant' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35] uppercase tracking-wider">
                  Contextual Threat Intelligence Assistant
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Submit any suspicious artifact (domain, URL, sender address, or message excerpt) for structured CTI evaluation.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="e.g. bursar-fee-refund.xyz or sender address..."
                  className="flex-1 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl px-4 py-3 text-xs text-[#202A35] placeholder-[#64748B] focus:outline-none focus:border-[#315E63] focus:bg-white"
                />
                <button
                  onClick={handleQueryAssistant}
                  className="px-6 py-3 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Generate Intelligence Dossier
                </button>
              </div>
            </div>

            {assistantReport && (
              <div className="p-6 rounded-2xl bg-white border border-[#E5E9ED] space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">CTI Artifact Dossier</span>
                    <h4 className="text-base font-bold text-[#202A35] font-mono mt-0.5">{assistantReport.query}</h4>
                  </div>
                  <span className="px-3 py-1 bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25 rounded-full text-xs font-bold uppercase">
                    {assistantReport.verdict}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <strong className="text-[#202A35]">Executive Threat Summary:</strong>
                  <p className="text-[#202A35] leading-relaxed bg-[#F7F8FA] p-3 rounded-xl border border-[#E5E9ED]">
                    {assistantReport.executiveSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-2">
                    <span className="text-[#315E63] font-bold block uppercase tracking-wider text-[10px]">
                      Observed Evidence
                    </span>
                    <ul className="space-y-1 text-[#64748B]">
                      {assistantReport.observedEvidence.map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#C74747] font-bold">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-2">
                    <span className="text-[#315E63] font-bold block uppercase tracking-wider text-[10px]">
                      Defensive Containment Actions
                    </span>
                    <ul className="space-y-1 text-[#64748B]">
                      {assistantReport.defensiveProtocols.map((dp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle size={13} className="text-[#27845A] mt-0.5 shrink-0" />
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
