import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Flag,
  Clock,
  FileSearch,
} from 'lucide-react';
import type { ScanResult } from '../types';
import { getRiskColor, getRiskBgColor, getScorePercentage, formatDate } from '../utils/helpers';
import CyberSafetyAssistant from './CyberSafetyAssistant';

interface ScanResultCardProps {
  result: ScanResult | null;
  loading: boolean;
  onReport?: (result: ScanResult) => void;
}

function getVerdictIcon(verdict: string) {
  switch (verdict) {
    case 'MALICIOUS':
      return <ShieldAlert size={20} />;
    case 'SUSPICIOUS':
      return <AlertTriangle size={20} />;
    case 'LOW_RISK':
      return <ShieldCheck size={20} />;
    case 'UNKNOWN':
    default:
      return <HelpCircle size={20} />;
  }
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'Malicious';
    case 'SUSPICIOUS':
      return 'Suspicious';
    case 'LOW_RISK':
      return 'Low Risk';
    case 'UNKNOWN':
    default:
      return 'Unknown';
  }
}

function getScoreStrokeColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return '#C74747';
    case 'SUSPICIOUS':
      return '#C58A35';
    case 'LOW_RISK':
      return '#27845A';
    case 'UNKNOWN':
    default:
      return '#64748B';
  }
}

function SkeletonLoader() {
  return (
    <div className="bg-white border border-[#E5E9ED] rounded-2xl p-5 animate-pulse space-y-5 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-28 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

function CircularScore({ score, verdict }: { score: number; verdict: string }) {
  const percentage = getScorePercentage(score);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const strokeColor = getScoreStrokeColor(verdict);

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-[#E5E9ED]"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[#202A35]">{percentage}</span>
      </div>
    </div>
  );
}

export default function ScanResultCard({ result, loading, onReport }: ScanResultCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!result) {
    return null;
  }

  const handleCopy = async () => {
    const text = [
      `Verdict: ${result.verdict}`,
      `Risk Score: ${result.risk_score}/100`,
      `Risk Level: ${result.risk_level}`,
      `Input: ${result.input_value}`,
      `Scanned: ${new Date(result.checked_at).toLocaleString()}`,
      '',
      'Indicators:',
      ...result.indicators.map((i) => `- ${i}`),
      '',
      'Recommendations:',
      ...result.recommendations.map((r) => `- ${r}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="bg-white border border-[#E5E9ED] rounded-2xl p-5 space-y-5 shadow-xs">
      {/* Header: Score + Verdict */}
      <div className="flex items-center gap-4">
        <CircularScore score={result.risk_score} verdict={result.verdict} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border
                ${getRiskBgColor(result.verdict)} ${getRiskColor(result.verdict)}
              `}
            >
              {getVerdictIcon(result.verdict)}
              {getVerdictLabel(result.verdict)}
            </span>
          </div>
          <p className="text-[#64748B] text-sm mt-1">
            Risk Level: <span className={`font-medium ${getRiskColor(result.verdict)}`}>{result.risk_level}</span>
          </p>
        </div>
      </div>

      {/* Indicators */}
      {result.indicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Indicators</h4>
          <ul className="space-y-1.5">
            {result.indicators.map((indicator, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[#202A35] bg-[#F7F8FA] p-2.5 rounded-xl border border-[#E5E9ED]">
                <AlertCircle size={15} className="text-[#C58A35] mt-0.5 flex-shrink-0" />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Recommendations</h4>
          <ul className="space-y-1.5">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[#202A35] bg-[#F7F8FA] p-2.5 rounded-xl border border-[#E5E9ED]">
                <CheckCircle2 size={15} className="text-[#27845A] mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Personalized Cyber Safety Assistant */}
      {(result.verdict === 'MALICIOUS' || result.verdict === 'SUSPICIOUS' || result.risk_score >= 40) && (
        <CyberSafetyAssistant
          threatType={result.input_type}
          verdict={result.verdict}
          payload={result.input_value}
          score={result.risk_score}
        />
      )}

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
        <Clock size={12} />
        <span>Scanned {formatDate(result.checked_at)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={() => navigate('/investigation')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-[#315E63] text-white text-xs font-bold
            hover:bg-[#274c50] active:scale-[0.98] transition cursor-pointer shadow-sm"
        >
          <FileSearch size={15} />
          <span>Deep Forensic Investigation</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-white border border-[#E5E9ED] text-xs font-semibold text-[#202A35]
            hover:bg-[#F0F4F4] active:scale-[0.98] transition cursor-pointer shadow-xs"
        >
          <Copy size={15} />
          {copied ? 'Copied!' : 'Copy Result'}
        </button>
        <button
          onClick={() => onReport && onReport(result)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-[#C74747]/10 border border-[#C74747]/25 text-xs font-semibold text-[#C74747]
            hover:bg-[#C74747]/20 active:scale-[0.98] transition cursor-pointer"
        >
          <Flag size={15} />
          Report
        </button>
      </div>
    </div>
  );
}
